import { Request, Response } from 'express';
import Stripe from 'stripe';
import { User } from '../models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
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
    // Prefer pre-created price if available
    const priceId = process.env.STRIPE_PRICE_ID;

    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
    if (priceId) {
      lineItems = [{ price: priceId, quantity: 1 }];
    } else {
      const productId = process.env.STRIPE_PRODUCT_ID;
      const currency = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();
      const intervalEnv = (process.env.STRIPE_INTERVAL || 'month').toLowerCase() as 'day' | 'week' | 'month' | 'year';

      if (!productId) {
        return res.status(500).json({ error: 'Missing STRIPE_PRODUCT_ID or STRIPE_PRICE_ID' });
      }

      // Try to use product default price first
      let resolvedPriceId: string | undefined;
      try {
        const product = await stripe.products.retrieve(productId, { expand: ['default_price'] } as any);
        const def = (product as any).default_price;
        if (typeof def === 'string') resolvedPriceId = def;
        else if (def && typeof def === 'object' && def.id) resolvedPriceId = def.id as string;
      } catch (e) {
        // ignore, fallback to listing prices
      }

      // If no default price, try to find an active monthly (or intervalEnv) price
      if (!resolvedPriceId) {
        const prices = await stripe.prices.list({ product: productId, active: true, limit: 50 });
        const recurringMatch = prices.data.find((p) => p.recurring?.interval === intervalEnv);
        const anyRecurring = prices.data.find((p) => p.recurring);
        const anyPrice = prices.data[0];
        const chosen = recurringMatch || anyRecurring || anyPrice;
        if (chosen) resolvedPriceId = chosen.id;
      }

      const amountCentsRaw = process.env.STRIPE_PRICE_AMOUNT_CENTS || '';
      const amountCents = parseInt(amountCentsRaw, 10);

      if (resolvedPriceId) {
        lineItems = [{ price: resolvedPriceId, quantity: 1 }];
      } else if (amountCents) {
        // Build price data on the fly with default monthly interval
        lineItems = [
          {
            price_data: {
              currency,
              product: productId,
              unit_amount: amountCents,
              recurring: { interval: intervalEnv },
            },
            quantity: 1,
          },
        ];
      } else {
        return res.status(500).json({
          error:
            'No suitable Price found for product. Set a default/recurring price in Stripe, or provide STRIPE_PRICE_AMOUNT_CENTS.',
        });
      }
    }

    const successUrl =
      (req.body?.successUrl as string) ||
      `${getBaseUrl(req)}/account?status=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      (req.body?.cancelUrl as string) || `${getBaseUrl(req)}/account?status=cancel`;
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
      line_items: lineItems,
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

export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id as string | undefined;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const u = await User.findById(userId);
    if (!u || !u.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Cancel at period end by default
    const subscription = await stripe.subscriptions.update(u.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update DB with status and period end
    u.subscriptionActive = subscription.status === 'active' || subscription.status === 'trialing';
    u.subscriptionCurrentPeriodEnd = new Date((subscription.current_period_end || 0) * 1000);
    await u.save();

    return res.status(200).json({
      message: 'Subscription will cancel at period end.',
      status: subscription.status,
      current_period_end: u.subscriptionCurrentPeriodEnd,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message ?? 'Failed to cancel subscription' });
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

export const getPricing = async (_req: Request, res: Response) => {
  try {
    const explicitPriceId = process.env.STRIPE_PRICE_ID;
    let price: Stripe.Price | null = null;

    if (explicitPriceId) {
      price = await stripe.prices.retrieve(explicitPriceId);
    } else {
      const productId = process.env.STRIPE_PRODUCT_ID;
      if (!productId) return res.status(500).json({ error: 'Missing STRIPE_PRODUCT_ID or STRIPE_PRICE_ID' });

      try {
        const product = await stripe.products.retrieve(productId, { expand: ['default_price'] } as any);
        const def = (product as any).default_price;
        if (def && typeof def === 'object') price = def as Stripe.Price;
        else if (typeof def === 'string') price = await stripe.prices.retrieve(def);

        if (!price) {
          const prices = await stripe.prices.list({ product: productId, active: true, limit: 50 });
          price = prices.data.find((p) => p.recurring?.interval === 'month') || prices.data.find((p) => p.recurring) || prices.data[0] || null;
        }
      } catch (e) {
        console.error('Error fetching product prices from Stripe', e);
        return res.status(500).json({ error: 'Failed to resolve Stripe price' });
      }
    }

    if (!price) return res.status(404).json({ error: 'No price configured' });

    const amount = price.unit_amount || 0;
    const currency = price.currency;
    const interval = price.recurring?.interval || 'month';

    return res.status(200).json({ amount, currency, interval, priceId: price.id });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to load pricing' });
  }
};

function getBaseUrl(req: Request) {
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host');
  return `${proto}://${host}`;
}