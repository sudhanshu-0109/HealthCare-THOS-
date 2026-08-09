/**
 * components/booking/RazorpayCheckout.jsx — Razorpay payment widget integration.
 * Loads Razorpay script, opens widget, calls /payments/verify on success.
 * In mock mode (no key), simulates payment with a modal confirmation.
 */

import { useState, useEffect, useRef } from 'react';
import { Timer, CreditCard, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import * as paymentsService from '../../services/payments.service';

const SLOT_HOLD_MINUTES = 10;

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function RazorpayCheckout({
  appointmentId,
  billId,
  razorpayOrderId,
  amount,
  keyId,
  isMock,
  doctor,
  scheduledDate,
  scheduledTime,
  slotHeldUntil,
  onSuccess,
  onCancel,
}) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);
  const [mockPaying, setMockPaying] = useState(false);
  const intervalRef = useRef(null);

  // Countdown timer for slot hold
  useEffect(() => {
    const heldUntil = new Date(slotHeldUntil).getTime();
    const update = () => {
      const remaining = Math.max(0, Math.floor((heldUntil - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) clearInterval(intervalRef.current);
    };
    update();
    intervalRef.current = setInterval(update, 1000);
    return () => clearInterval(intervalRef.current);
  }, [slotHeldUntil]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleVerify = async (razorpayPaymentId, razorpaySignature) => {
    try {
      const res = await paymentsService.verifyPayment({
        billId: billId || appointmentId,
        appointmentId,
        razorpayOrderId,
        razorpayPaymentId: razorpayPaymentId || 'mock_payment_' + Date.now(),
        razorpaySignature: razorpaySignature || 'mock_signature',
      });
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment verification failed. Please try again.');
      setPaying(false);
    }
  };

  const handlePay = async () => {
    if (timeLeft === 0) {
      setError('Slot hold expired. Please select a new slot.');
      return;
    }

    setPaying(true);
    setError(null);

    if (isMock || !keyId) {
      // Mock mode: simulate payment without Razorpay
      setMockPaying(true);
      setTimeout(async () => {
        await handleVerify('mock_payment_id', 'mock_signature');
        setMockPaying(false);
      }, 1500);
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError('Payment gateway unavailable. Please try again.');
      setPaying(false);
      return;
    }

    const options = {
      key: keyId,
      amount: Math.round(amount * 100),
      currency: 'INR',
      name: 'healthcare+',
      description: `Appointment with ${doctor.name}`,
      order_id: razorpayOrderId,
      handler: async (response) => {
        await handleVerify(response.razorpay_payment_id, response.razorpay_signature);
      },
      modal: {
        ondismiss: () => {
          setPaying(false);
          setError('Payment cancelled. Your slot is still held.');
        },
      },
      prefill: {},
      theme: { color: '#0891b2' },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const isExpired = timeLeft === 0;

  return (
    <div className="space-y-4">
      {/* Appointment summary */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Doctor</span>
          <span className="font-semibold text-slate-800">{doctor?.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Specialization</span>
          <span className="text-slate-700">{doctor?.specialization}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Hospital</span>
          <span className="text-slate-700">{doctor?.hospital}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Date & Time</span>
          <span className="font-medium text-slate-800">{scheduledDate} · {scheduledTime}</span>
        </div>
        <div className="border-t border-slate-200 pt-2 flex justify-between">
          <span className="text-slate-500 text-sm">Total Fee</span>
          <span className="text-lg font-bold text-slate-900">₹{Number(amount).toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Slot hold countdown */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${isExpired ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
        <Timer className="w-4 h-4 flex-shrink-0" />
        {isExpired
          ? 'Slot hold expired. Please go back and select a new slot.'
          : `Slot held for ${formatTime(timeLeft)}`}
      </div>

      {isMock && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-xl text-xs bg-blue-50 text-blue-700 border border-blue-200">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span><strong>Test mode:</strong> No real payment. Click Pay to simulate a successful payment.</span>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={paying}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handlePay}
          disabled={paying || isExpired}
          className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {mockPaying ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
          ) : (
            <><CreditCard className="w-4 h-4" /> Pay ₹{Number(amount).toLocaleString('en-IN')}</>
          )}
        </button>
      </div>
    </div>
  );
}
