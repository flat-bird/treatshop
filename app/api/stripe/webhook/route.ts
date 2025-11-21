import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import twilio from 'twilio';

type CheckoutSessionWithShipping = {
  shipping_details?: {
    address?: {
      line1?: string | null;
      line2?: string | null;
      city?: string | null;
      state?: string | null;
      postal_code?: string | null;
      country?: string | null;
    } | null;
  } | null;
};

export const runtime = 'nodejs';

function getTwilioClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials are not set');
  }
  return twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

async function sendSMS(to: string, message: string) {
  if (!process.env.TWILIO_PHONE_NUMBER) {
    throw new Error('TWILIO_PHONE_NUMBER is not set');
  }

  const twilioClient = getTwilioClient();

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });
    return result;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET is not set' },
      { status: 500 }
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    const eventType = event.type as string;
    
    if (eventType === 'payment_intent.succeeded' || eventType === 'checkout.session.completed') {
      const phoneNumber = process.env.TWILIO_RECIPIENT_PHONE_NUMBER;
      
      if (!phoneNumber) {
        console.warn('TWILIO_RECIPIENT_PHONE_NUMBER is not set, skipping SMS');
        return NextResponse.json({ received: true });
      }

      let message = '';
      let amount = null;
      let currency = 'usd';
      let lineItems: Array<{
        quantity?: number | null;
        price?: {
          product?: string | { id: string; name?: string | null } | null;
          description?: string | null;
        } | null;
        description?: string | null;
      }> = [];
      let customerName = 'Customer';
      let shippingAddress = '';
      let deliveryType = '';

      const localDeliveryProductId = 'prod_TSgjj9alx4MKo3';
      const shippingProductId = process.env.NEXT_PUBLIC_SHIPPING_PRODUCT_ID;

      if (eventType === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        amount = (session.amount_total ?? 0) / 100;
        currency = session.currency ?? 'usd';
        
        const sessionWithDetails = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items.data.price.product', 'customer', 'customer_details'],
        });
        
        lineItems = sessionWithDetails.line_items?.data || [];
        
        if (sessionWithDetails.customer_details?.name) {
          customerName = sessionWithDetails.customer_details.name;
        } else if (sessionWithDetails.customer) {
          try {
            const customer = typeof sessionWithDetails.customer === 'string'
              ? await stripe.customers.retrieve(sessionWithDetails.customer)
              : sessionWithDetails.customer;
            if (customer.deleted) {
              customerName = 'Customer';
            } else {
              customerName = customer.name || customer.email || 'Customer';
            }
          } catch (err) {
            console.error('Error retrieving customer:', err);
          }
        }
        
        // Try collected_information.shipping_details.address first (from webhook event)
        const sessionWithCollectedInfo = session as typeof session & {
          collected_information?: {
            shipping_details?: {
              address?: {
                line1?: string | null;
                line2?: string | null;
                city?: string | null;
                state?: string | null;
                postal_code?: string | null;
                country?: string | null;
              } | null;
            } | null;
          } | null;
        };
        
        if (sessionWithCollectedInfo.collected_information?.shipping_details?.address) {
          const addr = sessionWithCollectedInfo.collected_information.shipping_details.address;
          shippingAddress = [
            addr.line1,
            addr.line2,
            addr.city,
            addr.state,
            addr.postal_code,
            addr.country
          ].filter(Boolean).join(', ');
        } else {
          // Fallback to shipping_details on retrieved session
          const sessionWithShipping = sessionWithDetails as typeof sessionWithDetails & CheckoutSessionWithShipping;
          if (sessionWithShipping.shipping_details?.address) {
            const addr = sessionWithShipping.shipping_details.address;
            shippingAddress = [
              addr.line1,
              addr.line2,
              addr.city,
              addr.state,
              addr.postal_code,
              addr.country
            ].filter(Boolean).join(', ');
          } else {
            console.log('No shipping_details found in session:', {
              sessionId: sessionWithDetails.id,
              hasCollectedInfo: !!sessionWithCollectedInfo.collected_information,
              hasShippingDetails: !!sessionWithShipping.shipping_details,
              collectedInfo: sessionWithCollectedInfo.collected_information,
              shippingDetails: sessionWithShipping.shipping_details
            });
          }
        }
      } else if (eventType === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        amount = paymentIntent.amount / 100;
        currency = paymentIntent.currency;
        
        const paymentIntentWithInvoice = paymentIntent as typeof paymentIntent & { invoice?: string | Stripe.Invoice | null };
        if (paymentIntentWithInvoice.invoice) {
          const invoiceId = typeof paymentIntentWithInvoice.invoice === 'string' 
            ? paymentIntentWithInvoice.invoice 
            : paymentIntentWithInvoice.invoice.id;
          const invoice = await stripe.invoices.retrieve(invoiceId, {
            expand: ['lines.data.price.product', 'customer'],
          });
          lineItems = invoice.lines.data;
          
          if (invoice.customer) {
            try {
              const customer = typeof invoice.customer === 'string'
                ? await stripe.customers.retrieve(invoice.customer)
                : invoice.customer;
              if (customer.deleted) {
                customerName = 'Customer';
              } else {
                customerName = customer.name || customer.email || 'Customer';
              }
            } catch (err) {
              console.error('Error retrieving customer:', err);
            }
          }
        } else if (paymentIntent.metadata?.session_id) {
          try {
            const session = await stripe.checkout.sessions.retrieve(paymentIntent.metadata.session_id, {
              expand: ['line_items.data.price.product', 'customer', 'customer_details'],
            });
            lineItems = session.line_items?.data || [];
            
            if (session.customer_details?.name) {
              customerName = session.customer_details.name;
            } else if (session.customer) {
              try {
                const customer = typeof session.customer === 'string'
                  ? await stripe.customers.retrieve(session.customer)
                  : session.customer;
                if (customer.deleted) {
                  customerName = 'Customer';
                } else {
                  customerName = customer.name || customer.email || 'Customer';
                }
              } catch (err) {
                console.error('Error retrieving customer:', err);
              }
            }
            
            // Try collected_information.shipping_details.address first (from webhook event)
            const sessionWithCollectedInfo = session as typeof session & {
              collected_information?: {
                shipping_details?: {
                  address?: {
                    line1?: string | null;
                    line2?: string | null;
                    city?: string | null;
                    state?: string | null;
                    postal_code?: string | null;
                    country?: string | null;
                  } | null;
                } | null;
              } | null;
            };
            
            if (sessionWithCollectedInfo.collected_information?.shipping_details?.address) {
              const addr = sessionWithCollectedInfo.collected_information.shipping_details.address;
              shippingAddress = [
                addr.line1,
                addr.line2,
                addr.city,
                addr.state,
                addr.postal_code,
                addr.country
              ].filter(Boolean).join(', ');
            } else {
              // Fallback to shipping_details on retrieved session
              const sessionWithShipping = session as typeof session & CheckoutSessionWithShipping;
              if (sessionWithShipping.shipping_details?.address) {
                const addr = sessionWithShipping.shipping_details.address;
                shippingAddress = [
                  addr.line1,
                  addr.line2,
                  addr.city,
                  addr.state,
                  addr.postal_code,
                  addr.country
                ].filter(Boolean).join(', ');
              } else {
                console.log('No shipping_details found in session from payment_intent:', {
                  sessionId: session.id,
                  hasCollectedInfo: !!sessionWithCollectedInfo.collected_information,
                  hasShippingDetails: !!sessionWithShipping.shipping_details,
                  collectedInfo: sessionWithCollectedInfo.collected_information,
                  shippingDetails: sessionWithShipping.shipping_details
                });
              }
            }
          } catch (err) {
            console.error('Error retrieving session:', err);
          }
        }
      }

      const purchaseDetails: string[] = [];
      let hasLocalDelivery = false;
      let hasShipping = false;
      
      for (const item of lineItems) {
        try {
          const quantity = item.quantity || 1;
          const price = item.price;
          let productId = '';
          let productName = 'Unknown Product';
          
          if (price?.product) {
            productId = typeof price.product === 'string' ? price.product : price.product.id;
            
            if (productId === localDeliveryProductId) {
              hasLocalDelivery = true;
              continue;
            }
            if (shippingProductId && productId === shippingProductId) {
              hasShipping = true;
              continue;
            }
            
            try {
              const product = typeof price.product === 'string' 
                ? await stripe.products.retrieve(price.product)
                : price.product;
              productName = product?.name || 'Unknown Product';
            } catch (err) {
              console.error('Error retrieving product:', err);
              productName = price.description || 'Unknown Product';
            }
          } else if (item.description) {
            productName = item.description;
          }
          
          purchaseDetails.push(`${productName} x${quantity}`);
        } catch (err) {
          console.error('Error processing line item:', err);
        }
      }

      if (hasLocalDelivery) {
        deliveryType = 'Local Delivery';
      } else if (hasShipping) {
        deliveryType = 'Shipping';
      }

      message = `New Order from ${customerName}!\n\n`;
      
      if (purchaseDetails.length > 0) {
        message += purchaseDetails.join('\n');
        message += `\n\n`;
      }
      
      if (deliveryType) {
        message += `TYPE: ${deliveryType}\n`;
      }
      
      if (shippingAddress) {
        message += `ADDRESS: ${shippingAddress}\n\n`;
      }
      
      message += `Total: ${currency.toUpperCase()} ${amount?.toFixed(2) || '0.00'}`;

      await sendSMS(phoneNumber, message);
    } else {
      console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

