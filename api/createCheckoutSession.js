// backend/api/createCheckoutSession.js

import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16',
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  const { planId, userId } = req.body;

  if (!planId || !userId) {
    return res.status(400).json({ message: 'planId and userId are required' });
  }

  try {
    // Stripe Price ID'lerini planId'ye göre belirleyin
    let priceId;
    switch (planId) {
      case 1: // Forex + Hisse Senedi Paketi
        priceId = 'price_1NXXXXXX'; // Stripe'da oluşturduğunuz Price ID'si
        break;
      case 2: // Profesyonel Vadeli İşlemler Paketi
        priceId = 'price_1NYYYYYY';
        break;
      case 3: // Kripto Özel Paketi
        priceId = 'price_1NZZZZZZ';
        break;
      default:
        return res.status(400).json({ message: 'Invalid planId' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId,
        planId: planId,
      },
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    res.status(200).json({ sessionUrl: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
