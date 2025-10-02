import { Router } from 'express';
import { createPaymentIntent, createCheckoutSession, createBillingPortalSession, cancelSubscription, getPricing, verifyCheckoutSession, fetchLiveSubscription } from '../services/payments';
import requireAuth from '../middleware/requireAuth';

const router = Router();

// One-time PaymentIntent (not used for subscriptions)
router.post('/intent', createPaymentIntent);

// Create a Stripe Checkout Session for subscriptions
router.post('/checkout-session', createCheckoutSession);

// Create a Stripe Billing Portal session (requires auth; server derives customerId)
router.post('/portal', requireAuth, createBillingPortalSession);

// Cancel subscription at period end
router.post('/cancel', requireAuth, cancelSubscription);

// Public pricing endpoint
router.get('/pricing', getPricing);

// Verify checkout session status and sync subscription
router.get('/checkout-session/:id', verifyCheckoutSession);

// Live subscription sync (requires auth)
router.get('/subscription/live', requireAuth, fetchLiveSubscription);

export default router;
