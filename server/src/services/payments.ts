import { Request, Response } from 'express';
import Stripe from 'stripe';
import { User } from '../models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-08-16',
});

export const createPaymentIntent = async (req: Request, res: Response) => {
  const { amount } = req.body as { amount: number };

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method_types: ['card'],
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    res.status(500).json({ error: error?.message ?? 'Unknown error' });
  }
};

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) return res.status(500).json({ error: 'Missing STRIPE_PRICE_ID' });

    const successUrl = (req.body?.successUrl as string) || `${getBaseUrl(req)}/account?status=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = (req.body?.cancelUrl as string) || `${getBaseUrl(req)}/account?status=cancel`;
    const userId = (req.body?.userId as string) || undefined;

    let customer: string | undefined;
    let customer_email: string | undefined;
    if (userId) {
      const u = await User.findById(userId).lean();
      if (u?.stripeCustomerId) customer = u.stripeCustomerId;
      if (!customer && u?.email) customer_email = u.email;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      ...(userId ? { client_reference_id: userId } : {}),
      ...(customer ? { customer } : {}),
      ...(customer_email ? { customer_email } : {}),
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message ?? 'Failed to create checkout session' });
  }
};

export const createBillingPortalSession = async (req: Request, res: Response) => {
  try {
    const returnUrl = (req.body?.returnUrl as string) || `${getBaseUrl(req)}/account`;

    let customerId: string | undefined;
    if (req.user?.id) {
      const u = await User.findById(req.user.id).lean();
      customerId = u?.stripeCustomerId;
    }

    if (!customerId) return res.status(400).json({ error: 'No Stripe customer found for user' });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message ?? 'Failed to create billing portal session' });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string | undefined;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body as any, sig as any, endpointSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err?.message ?? String(err)}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription') {
          const subscriptionId = String(session.subscription);
          const customerId = String(session.customer);
          const refUserId = session.client_reference_id;
          if (refUserId) {
            await User.findByIdAndUpdate(refUserId, {
              $set: {
                subscriptionActive: true,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
              },
            });
          }
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = String(sub.customer);
        const periodEnd = new Date((sub.current_period_end || 0) * 1000);
        const active = sub.status === 'active' || sub.status === 'trialing';
        await User.updateMany(
          { stripeCustomerId: customerId },
          {
            $set: {
              subscriptionActive: active,
              stripeSubscriptionId: sub.id,
              subscriptionCurrentPeriodEnd: periodEnd,
            },
          }
        );
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = String(sub.customer);
        await User.updateMany(
          { stripeCustomerId: customerId },
          {
            $set: {
              subscriptionActive: false,
              stripeSubscriptionId: sub.id,
            },
          }
        );
        break;
      }
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent was successful!', paymentIntent.id);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', paymentIntent.id);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
        break;
    }
  } catch (err) {
    console.error('Webhook handling error', err);
  }

  res.json({ received: true });
};

function getBaseUrl(req: Request) {
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host');
  return `${proto}://${host}`;
}