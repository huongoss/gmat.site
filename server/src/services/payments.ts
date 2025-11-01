import { Request, Response } from 'express';
import Stripe from 'stripe';
import { User } from '../models/User';

// Initialize Stripe (omit apiVersion to use library default & avoid TS narrowing errors)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

function isSubscriptionActiveStripe(status: string): boolean {
  // Consider active access for these states
  return ['active','trialing','past_due'].includes(status);
}

/**
 * Retrieve the next bill (invoice) date for a subscription.
 * Strategy:
 * 1. Use upcoming invoice (stripe.invoices.retrieveUpcoming) which reflects next charge date.
 * 2. Fallback to subscription.current_period_end if upcoming invoice not available (e.g., canceled at period end or free trial ended).
 * Returns a Date or undefined if not determinable.
 */
async function getNextBillDate(params: { customerId: string; subscriptionId: string }): Promise<Date | undefined> {
  const { customerId, subscriptionId } = params;
  try {
    // Feature-detect retrieveUpcoming (may not exist in installed stripe version)
    const invoicesAny: any = stripe.invoices as any;
    if (typeof invoicesAny.retrieveUpcoming === 'function') {
      const upcoming = await invoicesAny.retrieveUpcoming({ customer: customerId, subscription: subscriptionId });
      const ts = (upcoming as any)?.next_payment_attempt || (upcoming as any)?.due_date || (upcoming as any)?.created;
      if (ts && ts > 0) return new Date(ts * 1000);
      // Some invoices may instead have lines period end we can inspect
      const periodEnd = (upcoming.lines?.data?.[0] as any)?.period?.end;
      if (periodEnd && periodEnd > 0) return new Date(periodEnd * 1000);
    } else {
      console.warn('[getNextBillDate] retrieveUpcoming not supported by current stripe library version');
    }
  } catch (e: any) {
    // Common reasons: no upcoming invoice (canceled, fully paid, trial ended) – silently fallback
    console.warn('[getNextBillDate] upcoming invoice unavailable', { subscriptionId, message: e?.message });
  }
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const rawEnd = Number((sub as any).current_period_end) || 0;
    if (rawEnd > 0) return new Date(rawEnd * 1000);
    // Derive from billing_cycle_anchor + plan interval if current_period_end absent
    try {
      const anchorTs = Number((sub as any).billing_cycle_anchor) || 0;
      const items: any[] = (sub as any).items?.data || [];
      const firstPrice = items[0]?.price;
      const recurring = firstPrice?.recurring;
      if (anchorTs > 0 && recurring?.interval) {
        const interval = recurring.interval as string; // 'day' | 'week' | 'month' | 'year'
        const intervalCount = recurring.interval_count || 1;
        let candidate = new Date(anchorTs * 1000);
        const now = Date.now();
        // Advance candidate forward until it's in the future (avoid excessive loops by capping)
        let safety = 0;
        while (candidate.getTime() <= now && safety < 60) {
          switch (interval) {
            case 'day':
              candidate.setDate(candidate.getDate() + intervalCount);
              break;
            case 'week':
              candidate.setDate(candidate.getDate() + 7 * intervalCount);
              break;
            case 'month':
              candidate.setMonth(candidate.getMonth() + intervalCount);
              break;
            case 'year':
              candidate.setFullYear(candidate.getFullYear() + intervalCount);
              break;
            default:
              safety = 60; // unsupported interval; break loop
              break;
          }
          safety++;
        }
        if (candidate.getTime() > now && safety < 60) {
          return candidate;
        }
      }
    } catch (calcErr) {
      console.warn('[getNextBillDate] billing_cycle_anchor computation failed', { subscriptionId, message: (calcErr as any)?.message });
    }
  } catch (e) {
    console.warn('[getNextBillDate] subscription fallback failed', { subscriptionId, message: (e as any)?.message });
  }
  return undefined;
}

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
        const recurringMatch = prices.data.find((p: Stripe.Price) => p.recurring?.interval === intervalEnv);
        const anyRecurring = prices.data.find((p: Stripe.Price) => p.recurring);
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

    const clientBase = (process.env.CLIENT_URL || '').replace(/\/$/, '') || `${getBaseUrl(req)}`;
    const successUrl =
      (req.body?.successUrl as string) ||
      `${clientBase}/account?status=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      (req.body?.cancelUrl as string) || `${clientBase}/account?status=cancel`;
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

export const verifyCheckoutSession = async (req: Request, res: Response) => {
  const sessionId = req.params.id;
  if (!sessionId) return res.status(400).json({ error: 'Missing session id' });
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Process subscription sessions; some may report status 'open' briefly but still have subscription
    if (session.mode === 'subscription' && session.subscription && session.customer) {
      const subId = String(session.subscription);
      const customerId = String(session.customer);
      console.log('[verifyCheckoutSession] session', { sessionId, status: session.status, subId, customerId, clientRef: session.client_reference_id });
      // Try to locate user by several strategies
      let user: any = null;
      if (session.client_reference_id) {
        user = await User.findById(session.client_reference_id);
      }
      if (!user) {
        user = await User.findOne({ stripeCustomerId: customerId });
      }
      if (!user && (session as any).customer_details?.email) {
        // Fallback by email (normalize lowercase)
        const email = String((session as any).customer_details.email).toLowerCase();
        user = await User.findOne({ email });
        if (user && !user.stripeCustomerId) user.stripeCustomerId = customerId;
      }
      if (user) {
        user.subscriptionActive = true;
        user.stripeCustomerId = customerId;
        user.stripeSubscriptionId = subId;
        // Fetch subscription for period end
        try {
          const subscription = await stripe.subscriptions.retrieve(subId);
          const rawEnd = Number((subscription as any).current_period_end) || 0;
          if (rawEnd > 0) {
            (user as any).subscriptionCurrentPeriodEnd = new Date(rawEnd * 1000);
          } else {
            console.warn('[verifyCheckoutSession] missing current_period_end on subscription', { subId });
          }
          const status = subscription.status;
          user.subscriptionActive = isSubscriptionActiveStripe(status);
          console.log('[verifyCheckoutSession] subscription retrieved', { status, active: user.subscriptionActive, periodEnd: rawEnd, userId: user.id });
        } catch (e) {
          console.warn('[verifyCheckoutSession] subscription retrieve failed', (e as any)?.message);
        }
        await user.save();
      }
    }
    // Derive next bill date from upcoming invoice (fallback to period end) if subscription present
    let nextBillDate: Date | undefined;
    if (session.mode === 'subscription' && session.subscription && session.customer) {
      try {
        nextBillDate = await getNextBillDate({ customerId: String(session.customer), subscriptionId: String(session.subscription) });
      } catch (e) {
        console.warn('[verifyCheckoutSession] getNextBillDate failed', (e as any)?.message);
      }
    }
    return res.status(200).json({ status: session.status, subscription: session.subscription, customer: session.customer, nextBillDate: nextBillDate || null });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to verify session' });
  }
};

export const fetchLiveSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id as string | undefined;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.email) return res.status(400).json({ error: 'User missing email' });

    const email = user.email.toLowerCase();
    // Find customer in Stripe by email (ignore stored stripeSubscriptionId per request)
    const custList = await stripe.customers.list({ email, limit: 5 });
    const customer = custList.data[0];
    if (!customer) {
      console.log('[fetchLiveSubscription] no Stripe customer for email', email);
      user.subscriptionActive = false;
      await user.save();
      return res.status(200).json({ subscriptionActive: false });
    }
    const customerId = customer.id;
    if (!user.stripeCustomerId || user.stripeCustomerId !== customerId) {
      user.stripeCustomerId = customerId; // sync / repair
    }

    // List subscriptions for this customer, prefer active/trialing/past_due; fallback to most recent
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 });
    const prioritized = subs.data.filter(s => ['active','trialing','past_due'].includes(s.status));
    let chosen = prioritized[0];
    if (!chosen && subs.data.length) {
      // pick the subscription with the latest current_period_end
      chosen = subs.data.slice().sort((a,b) => ((b as any).current_period_end||0) - ((a as any).current_period_end||0))[0];
    }

    if (!chosen) {
      console.log('[fetchLiveSubscription] no subscriptions for customer', { customerId });
      user.subscriptionActive = false;
      await user.save();
      return res.status(200).json({ subscriptionActive: false });
    }

    const subscription = await stripe.subscriptions.retrieve(chosen.id);
    const status = subscription.status;
    user.stripeSubscriptionId = subscription.id; // store latest we found
    user.subscriptionActive = ['active','trialing','past_due'].includes(status);
    const rawEnd = Number((subscription as any).current_period_end) || 0;
    if (rawEnd > 0) (user as any).subscriptionCurrentPeriodEnd = new Date(rawEnd * 1000); // provisional fallback
    let nextBillDate: Date | undefined;
    try {
      nextBillDate = await getNextBillDate({ customerId, subscriptionId: subscription.id });
      if (nextBillDate) (user as any).subscriptionCurrentPeriodEnd = nextBillDate; // store canonical next bill date
    } catch (e) {
      console.warn('[fetchLiveSubscription] getNextBillDate failed', (e as any)?.message);
    }
    if (!rawEnd && !nextBillDate) {
      console.warn('[fetchLiveSubscription] neither current_period_end nor upcoming invoice available', { id: subscription.id, status });
    }
    await user.save();
    console.log('[fetchLiveSubscription] subscription detail', { id: subscription.id, status, active: user.subscriptionActive, periodEnd: rawEnd, customerId });

    return res.status(200).json({
      subscriptionActive: user.subscriptionActive,
      status,
      subscriptionId: subscription.id,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      nextBillDate: subscription.cancel_at_period_end ? null : ((user as any).subscriptionCurrentPeriodEnd || null)
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to fetch subscription' });
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
    u.subscriptionCurrentPeriodEnd = new Date(((subscription as any).current_period_end || 0) * 1000);
    await u.save();

    return res.status(200).json({
      message: 'Subscription will cancel at period end.',
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      nextBillDate: subscription.cancel_at_period_end ? null : (u.subscriptionCurrentPeriodEnd || null),
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
        const periodEnd = new Date(((sub as any).current_period_end || 0) * 1000);
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
          price = prices.data.find((p: Stripe.Price) => p.recurring?.interval === 'month') || prices.data.find((p: Stripe.Price) => p.recurring) || prices.data[0] || null;
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