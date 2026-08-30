/**
 * components/common/PaymentModal.jsx — REAL payment modal.
 *
 * Pays an EXISTING bill (created by staff at confirm time, or by initiateBooking
 * for appointments) via the unified billing path:
 *   Razorpay checkout (or mock) → POST /payments/verify → Bill marked PAID.
 *
 * There is no client-side simulation of the business state: onSuccess only fires
 * after the backend has verified the payment and marked the Bill PAID. Callers must
 * re-fetch real data on success rather than optimistically mutating local state.
 *
 * Props:
 *   open              — boolean
 *   billId            — Bill.id to pay (required)
 *   razorpayOrderId   — Razorpay order id attached to the bill's Payment (required)
 *   amount            — amount in rupees (display + mock)
 *   description       — line shown under the amount
 *   keyId, isMock     — optional; fetched from /billing/config when omitted
 *   onSuccess(bill)   — called with the verified bill payload after PAID
 *   onCancel          — called when the user closes the modal
 */
import { useState, useEffect } from 'react';
import { X, CreditCard, CheckCircle2, Loader2, Lock, AlertTriangle } from 'lucide-react';
import * as paymentsService from '../../services/payments.service';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function PaymentModal({
  open,
  billId,
  razorpayOrderId,
  amount,
  description,
  keyId: keyIdProp,
  isMock: isMockProp,
  onSuccess,
  onCancel,
}) {
  const [config, setConfig] = useState({ keyId: keyIdProp ?? null, isMock: isMockProp });
  const [configLoading, setConfigLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState(null);

  // Reset transient state each time the modal opens, and fetch Razorpay config
  // if the caller didn't already provide it.
  useEffect(() => {
    if (!open) return;
    setPaid(false);
    setPaying(false);
    setError(null);

    if (isMockProp !== undefined || keyIdProp) {
      setConfig({ keyId: keyIdProp ?? null, isMock: isMockProp });
      return;
    }
    setConfigLoading(true);
    paymentsService.getPaymentConfig()
      .then((res) => setConfig({ keyId: res.data?.keyId ?? null, isMock: res.data?.isMock ?? true }))
      .catch(() => setConfig({ keyId: null, isMock: true }))
      .finally(() => setConfigLoading(false));
  }, [open, keyIdProp, isMockProp]);

  if (!open) return null;

  const amountNum = Number(amount || 0);
  const useMock = config.isMock || !config.keyId;

  const verify = async ({ razorpayPaymentId, razorpaySignature }) => {
    const res = await paymentsService.verifyPayment({
      billId,
      razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId || `mock_payment_${Date.now()}`,
      razorpaySignature: razorpaySignature || 'mock_signature',
    });
    setPaid(true);
    // Brief success confirmation, then hand the verified bill back to the caller.
    setTimeout(() => onSuccess?.(res.data), 900);
  };

  const handlePay = async () => {
    if (!billId || !razorpayOrderId) {
      setError('This bill is not ready for payment yet. Please refresh and try again.');
      return;
    }
    setPaying(true);
    setError(null);

    try {
      if (useMock) {
        // No Razorpay credentials configured: the backend accepts mock signatures.
        await verify({});
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError('Payment gateway unavailable. Please try again.');
        setPaying(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: config.keyId,
        amount: Math.round(amountNum * 100),
        currency: 'INR',
        name: 'HealthCare+',
        description: description || 'Payment',
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            await verify({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
          } catch (err) {
            setError(err.message || 'Payment verification failed. Please try again.');
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            setError('Payment cancelled.');
          },
        },
        theme: { color: '#0891b2' },
      });
      rzp.open();
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
      setPaying(false);
    }
  };

  if (paid) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg mb-1">Payment Successful!</h3>
          <p className="text-slate-500 text-sm">₹{amountNum.toLocaleString('en-IN')} paid successfully</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!paying ? onCancel : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-teal-700 p-5 text-white">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <span className="font-semibold">Secure Payment</span>
            </div>
            {!paying && (
              <button onClick={onCancel} className="text-white/70 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="text-3xl font-bold mt-2">₹{amountNum.toLocaleString('en-IN')}</div>
          {description && <p className="text-cyan-100 text-xs mt-1">{description}</p>}
        </div>

        <div className="p-5">
          {config.isMock && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-xl text-xs bg-blue-50 text-blue-700 border border-blue-200 mb-4">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span><strong>Test mode:</strong> No real payment gateway is configured. Clicking Pay will complete a test transaction verified by the server.</span>
            </div>
          )}

          {!config.isMock && (
            <p className="text-sm text-slate-600 mb-4">
              You'll be redirected to Razorpay's secure checkout to complete your payment.
            </p>
          )}

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">{error}</div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
            <Lock className="w-3 h-3" />
            <span>256-bit SSL encrypted payment</span>
          </div>

          <button
            onClick={handlePay}
            disabled={paying || configLoading}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-70 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {paying || configLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {configLoading ? 'Loading…' : 'Processing…'}
              </>
            ) : (
              `Pay ₹${amountNum.toLocaleString('en-IN')}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
