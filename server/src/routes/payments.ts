import { Router } from 'express';
import { createPaymentIntent, createCheckoutSession, createBillingPortalSession } from '../services/payments';
import requireAuth from '../middleware/requireAuth';

const router = Router();

// One-time PaymentIntent (not used for subscriptions)
router.post('/intent', createPaymentIntent);

// Create a Stripe Checkout Session for subscriptions
router.post('/checkout-session', createCheckoutSession);

// Create a Stripe Billing Portal session (requires auth; server derives customerId)
router.post('/portal', requireAuth, createBillingPortalSession);

export default router;
