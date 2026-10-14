# Veloce Dynamics — Shop & Checkout

## What's here
- `index.html` — main site
- `shop.html` — merch shop with a working cart (localStorage) that checks out via Stripe
- `success.html` / `cancel.html` — post-checkout redirect pages
- `api/create-checkout-session.js` — serverless function that creates a Stripe Checkout Session for the cart
- `package.json` — declares the `stripe` dependency the function needs

## How checkout works
1. Customer adds items in `shop.html` — stored client-side in `localStorage`.
2. Clicking "Checkout" sends `{ id, qty }` pairs (no prices) to `/api/create-checkout-session`.
3. The function looks up real prices from its own `PRODUCTS` table (server-side — the browser can never tamper with the amount charged), creates a Stripe Checkout Session, and returns the session URL.
4. The browser redirects to Stripe's hosted payment page. On success/cancel, Stripe redirects back to `success.html` / `cancel.html`.

## Deploying (Vercel, free tier)
```bash
npm install -g vercel
cd veloce-dynamics
vercel
```
Then in the Vercel dashboard → Project → Settings → Environment Variables, add:
- `STRIPE_SECRET_KEY` — your Stripe secret key (starts `sk_test_...` for testing, `sk_live_...` to go live)

Redeploy after adding the variable. The site and the `/api` function deploy together automatically.

## Editing products/prices
Edit the `PRODUCTS` object at the top of `api/create-checkout-session.js` — this is the single source of truth for prices. Keep the product cards in `shop.html` (`data-id`, `data-name`, `data-price`) in sync for display purposes; the actual charge always uses the server-side table.

## Next: Sponsor invoicing
Set up in the Stripe Dashboard (no code needed):
1. Settings → Branding — add your logo/colors so invoices carry the Veloce Dynamics look.
2. Invoices → Create invoice — add the sponsor as a customer, add line items for their package, and send. Stripe emails them a secure hosted payment page.
