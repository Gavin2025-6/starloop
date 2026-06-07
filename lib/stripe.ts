import Stripe from "stripe";

// Lazy init — avoids module-level crash when env var missing at build time
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return _stripe;
}

// Backward-compatible export for code that imports `stripe` directly
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const CREDIT_PACKAGES = [
  {
    key: "BASIC",
    name: "基础包",
    credits: 100,
    price: 10,
    unitAmount: 1000, // cents
    description: "适合小型商家，刚开始收集评价",
    badge: null,
  },
  {
    key: "STANDARD",
    name: "标准包",
    credits: 280,
    price: 25,
    unitAmount: 2500,
    description: "最受欢迎，每条短信 $0.089",
    badge: "最划算",
  },
  {
    key: "PRO",
    name: "专业包",
    credits: 600,
    price: 50,
    unitAmount: 5000,
    description: "高频发送，每条短信 $0.083",
    badge: null,
  },
] as const;

export type CreditPackageKey = typeof CREDIT_PACKAGES[number]["key"];

export function getPackageByKey(key: string) {
  return CREDIT_PACKAGES.find(p => p.key === key) ?? null;
}

export async function createCreditCheckoutSession(params: {
  packageKey: CreditPackageKey;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const pkg = getPackageByKey(params.packageKey);
  if (!pkg) throw new Error(`Unknown package: ${params.packageKey}`);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: params.userEmail,
    line_items: [{
      price_data: {
        currency: "usd",
        unit_amount: pkg.unitAmount,
        product_data: {
          name: `StarLoop ${pkg.name} — ${pkg.credits} SMS`,
          description: pkg.description,
        },
      },
      quantity: 1,
    }],
    metadata: {
      userId: params.userId,
      packageKey: params.packageKey,
      credits: String(pkg.credits),
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return session.url!;
}
