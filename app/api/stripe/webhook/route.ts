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

      let message = 'Payment received!';
      let amount = null;
      let currency = 'usd';

      if (eventType === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as any;
        amount = paymentIntent.amount / 100;
        currency = paymentIntent.currency;
        message = `Payment of ${currency.toUpperCase()} ${amount.toFixed(2)} received successfully!`;
      } else if (eventType === 'checkout.session.completed') {
        const session = event.data.object as any;
        amount = session.amount_total / 100;
        currency = session.currency;
        message = `Checkout completed! Payment of ${currency.toUpperCase()} ${amount.toFixed(2)} received.`;
      } else if (eventType === 'payment_link.payment_succeeded') {
        message = 'Payment link payment succeeded!';
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

