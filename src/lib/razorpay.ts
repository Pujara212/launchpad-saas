// ── Razorpay integration helpers ─────────────────────────────────────────────

/** Dynamically load the Razorpay checkout script */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface RazorpayOrderOptions {
  amount: number;        // in paise (₹ × 100)
  currency?: string;
  orderId: string;       // from backend in production; mock here
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onDismiss: () => void;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/**
 * Opens the Razorpay checkout popup.
 * In production replace `key` with your live/test key from Razorpay dashboard.
 * The order should be created server-side (POST /api/payment/create-order).
 */
export async function openRazorpayCheckout(opts: RazorpayOrderOptions): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error("Failed to load Razorpay script. Check your internet connection.");
  }

  const options = {
    // ⚠️  Replace with your actual Razorpay Key ID (publishable – safe in frontend)
    key: "rzp_test_YourKeyHere",
    amount: opts.amount,
    currency: opts.currency ?? "INR",
    order_id: opts.orderId,
    name: "BookEase",
    description: opts.description,
    image: "", // add logo URL if needed
    handler: (response: RazorpaySuccessResponse) => {
      opts.onSuccess(response);
    },
    prefill: {
      name: opts.customerName,
      email: opts.customerEmail,
      contact: opts.customerPhone,
    },
    theme: { color: "#7c3aed" },
    modal: {
      ondismiss: opts.onDismiss,
    },
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.on("payment.failed", (response: any) => {
    console.error("Razorpay payment failed:", response.error);
    opts.onDismiss();
  });
  rzp.open();
}

/** Generate a mock order ID (replace with real backend call in production) */
export function createMockOrder(amount: number): { orderId: string; amount: number; currency: string } {
  return {
    orderId: `order_mock_${Date.now()}`,
    amount: amount * 100, // paise
    currency: "INR",
  };
}
