import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import twilio from 'twilio';

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
    
    if (eventType === 'payment_intent.succeeded' || eventType === 'checkout.session.completed' || eventType === 'payment_link.payment_succeeded') {
      const phoneNumber = process.env.TWILIO_RECIPIENT_PHONE_NUMBER;
      
      if (!phoneNumber) {
        console.warn('TWILIO_RECIPIENT_PHONE_NUMBER is not set, skipping SMS');
        return NextResponse.json({ received: true });
      }

      let message = '';
      let amount = null;
      let currency = 'usd';
      let lineItems: any[] = [];

      if (eventType === 'checkout.session.completed') {
        const session = event.data.object as any;
        amount = session.amount_total / 100;
        currency = session.currency;
        
        const sessionWithLineItems = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items.data.price.product'],
        });
        
        lineItems = sessionWithLineItems.line_items?.data || [];
      } else if (eventType === 'payment_link.payment_succeeded') {
        const paymentLinkEvent = event.data.object as any;
        amount = paymentLinkEvent.amount_total ? paymentLinkEvent.amount_total / 100 : null;
        currency = paymentLinkEvent.currency || 'usd';
        
        if (paymentLinkEvent.payment_intent) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentLinkEvent.payment_intent);
            if (paymentIntent.metadata?.session_id) {
              const session = await stripe.checkout.sessions.retrieve(paymentIntent.metadata.session_id, {
                expand: ['line_items.data.price.product'],
              });
              lineItems = session.line_items?.data || [];
            }
          } catch (err) {
            console.error('Error retrieving payment intent:', err);
          }
        }
        
        if (lineItems.length === 0 && paymentLinkEvent.payment_link) {
          try {
            const lineItemsList = await stripe.paymentLinks.listLineItems(paymentLinkEvent.payment_link, {
              limit: 100,
              expand: ['data.price.product'],
            });
            lineItems = lineItemsList.data;
          } catch (err) {
            console.error('Error retrieving payment link line items:', err);
          }
        }
      } else if (eventType === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as any;
        amount = paymentIntent.amount / 100;
        currency = paymentIntent.currency;
        
        if (paymentIntent.invoice) {
          const invoice = await stripe.invoices.retrieve(paymentIntent.invoice, {
            expand: ['lines.data.price.product'],
          });
          lineItems = invoice.lines.data;
        } else if (paymentIntent.metadata?.session_id) {
          try {
            const session = await stripe.checkout.sessions.retrieve(paymentIntent.metadata.session_id, {
              expand: ['line_items.data.price.product'],
            });
            lineItems = session.line_items?.data || [];
          } catch (err) {
            console.error('Error retrieving session:', err);
          }
        }
      }

      const purchaseDetails: string[] = [];
      
      for (const item of lineItems) {
        try {
          const quantity = item.quantity || 1;
          const price = item.price;
          let productName = 'Unknown Product';
          
          if (price?.product) {
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
          
          const itemAmount = price?.unit_amount ? (price.unit_amount / 100) : 0;
          const itemTotal = itemAmount * quantity;
          
          purchaseDetails.push(`${productName} x${quantity} - ${currency.toUpperCase()} ${itemTotal.toFixed(2)}`);
        } catch (err) {
          console.error('Error processing line item:', err);
        }
      }

      if (purchaseDetails.length > 0) {
        message = `New Order!\n\n`;
        message += purchaseDetails.join('\n');
        message += `\n\nTotal: ${currency.toUpperCase()} ${amount?.toFixed(2) || '0.00'}`;
      } else {
        message = `Payment of ${currency.toUpperCase()} ${amount?.toFixed(2) || '0.00'} received successfully!`;
      }

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

