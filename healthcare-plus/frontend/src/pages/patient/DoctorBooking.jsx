/**
 * pages/patient/DoctorBooking.jsx — Complete booking flow: Slot → Type → Summary → Payment → Confirmation
 *
 * Phase 16: Added TYPE_SELECTION step between SLOT and SUMMARY.
 * Patient chooses OFFLINE (in-person, gets queue token) or ONLINE (video call, gets waiting room).
 *
 * Real flow:
 *   Slot → Type → Summary → initiateBooking (creates Appointment PENDING_PAYMENT + Bill + Razorpay order)
 *        → RazorpayCheckout → POST /payments/verify → Appointment CONFIRMED
 *        → OFFLINE: fetch queue token → Confirmation with token
 *        → ONLINE: navigate to Waiting Room
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, ChevronRight, Loader2, CreditCard, AlertCircle,
  MapPin, Video, Users, Clock,
} from 'lucide-react';
import * as appointmentsService from '../../services/appointments.service';
import RazorpayCheckout from '../../components/booking/RazorpayCheckout';
import api from '../../services/api';

const STEPS = {
  SLOT: 'slot',
  TYPE: 'type',           // Phase 16: new type selection step
  SUMMARY: 'summary',
  PAYMENT: 'payment',
  CONFIRMED: 'confirmed',
};

const STEP_ORDER = [STEPS.SLOT, STEPS.TYPE, STEPS.SUMMARY, STEPS.PAYMENT];

// Generate next 7 days
const getDates = () => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      full: d.toISOString().split('T')[0],
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    });
  }
  return dates;
};

// Format a 24-hour "HH:MM" slot into a 12-hour label for display.
const formatSlotLabel = (hhmm) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
};

export default function DoctorBooking({ doctor, hospital, onBack }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.SLOT);
  const [selectedDate, setSelectedDate] = useState(getDates()[0]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [consultationType, setConsultationType] = useState(null); // 'OFFLINE' | 'ONLINE'
  const [loading, setLoading] = useState(false);
  const [initiating, setInitiating] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [booking, setBooking] = useState(null);
  const [confirmedData, setConfirmedData] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const dates = getDates();

  // Fetch REAL slots for the selected date from the availability service.
  useEffect(() => {
    if (!doctor?.id || !selectedDate?.full) return;
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedTime(null);
    api.get(`/availability/${doctor.id}/slots`, { params: { date: selectedDate.full } })
      .then((res) => {
        if (cancelled) return;
        const all = res.data?.allSlots;
        if (Array.isArray(all)) {
          setAvailableSlots(all);
        } else {
          const slots = res.data?.slots || [];
          setAvailableSlots(Array.isArray(slots) ? slots.map((time) => ({ time, booked: false })) : []);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setAvailableSlots([]);
        setSlotsError(err.message || 'Could not load available slots.');
      })
      .finally(() => { if (!cancelled) setSlotsLoading(false); });
    return () => { cancelled = true; };
  }, [doctor?.id, selectedDate?.full]);

  const handleProceedToType = () => {
    if (!selectedTime) return;
    setStep(STEPS.TYPE);
  };

  const handleSelectType = (type) => {
    setConsultationType(type);
    setStep(STEPS.SUMMARY);
  };

  // Create the appointment + bill + Razorpay order FIRST, then collect payment.
  const handleProceedToPayment = async () => {
    setInitiating(true);
    setBookingError(null);
    try {
      const res = await appointmentsService.initiateBooking({
        doctorId: doctor?.id,
        scheduledDate: selectedDate.full,
        scheduledTime: selectedTime,
        consultationType: consultationType || 'OFFLINE',
      });
      setBooking(res.data);
      setStep(STEPS.PAYMENT);
    } catch (err) {
      setBookingError(err.message || 'Could not start booking. Please try again.');
    } finally {
      setInitiating(false);
    }
  };

  // Called by RazorpayCheckout AFTER the server verified the payment.
  const handlePaymentSuccess = async () => {
    if (booking?.consultationType === 'ONLINE') {
      // Online: go directly to waiting room
      navigate(`/patient/waiting-room/${booking.appointmentId}`, { replace: true });
      return;
    }

    // Offline: fetch queue token and show confirmation
    setLoading(true);
    let token = null;
    try {
      const res = await appointmentsService.getAppointmentById(booking.appointmentId);
      const appt = res.data?.appointment || res.data;
      if (appt?.queueToken?.tokenNumber != null) token = `T-${appt.queueToken.tokenNumber}`;
    } catch {
      // Token will simply not be shown if the fetch fails.
    } finally {
      setConfirmedData({ token });
      setLoading(false);
      setStep(STEPS.CONFIRMED);
    }
  };

  const doctorSummary = {
    name: doctor?.user?.fullName,
    specialization: doctor?.specialization,
    hospital: hospital?.name,
  };

  // ── CONFIRMED SCREEN ──────────────────────────────────────────────────────

  if (step === STEPS.CONFIRMED) {
    const isOnline = (booking?.consultationType || consultationType) === 'ONLINE';
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isOnline ? 'bg-gradient-to-br from-violet-50 to-slate-50' : 'bg-gradient-to-br from-emerald-50 to-cyan-50'}`}>
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isOnline ? 'bg-violet-100' : 'bg-emerald-100'}`}>
            {isOnline
              ? <Video className="w-10 h-10 text-violet-500" />
              : <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            }
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            {isOnline ? 'Online Consultation Booked!' : 'Appointment Confirmed!'}
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            {isOnline
              ? 'Your payment was verified. Join the waiting room when your appointment time approaches.'
              : 'Your payment was verified and your appointment is booked.'}
          </p>

          <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Doctor</span><span className="font-semibold text-slate-900">{doctor?.user?.fullName}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Specialty</span><span className="font-medium text-slate-700">{doctor?.specialization}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Date</span><span className="font-medium text-slate-700">{selectedDate.full}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Time</span><span className="font-medium text-slate-700">{formatSlotLabel(selectedTime)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Mode</span>
              <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${isOnline ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {isOnline ? '🎥 Online' : '🏥 In-Person'}
              </span>
            </div>
            {!isOnline && confirmedData?.token && (
              <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-1">
                <span className="text-slate-500">Queue Token</span>
                <span className="font-bold text-cyan-700 text-lg">{confirmedData.token}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {isOnline ? (
              <button
                onClick={() => navigate(`/patient/waiting-room/${booking?.appointmentId}`)}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" /> Go to Waiting Room
              </button>
            ) : null}
            <button
              onClick={() => onBack ? onBack() : navigate('/patient/dashboard')}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => onBack ? onBack() : navigate('/patient/dashboard')}
              className="w-full py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Back to Hospital
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── BOOKING FLOW ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 h-14 flex items-center px-4 gap-3 sticky top-0 z-10">
        <button
          onClick={
            step === STEPS.SLOT
              ? (onBack || (() => navigate(-1)))
              : () => {
                  const idx = STEP_ORDER.indexOf(step);
                  setStep(STEP_ORDER[Math.max(0, idx - 1)]);
                }
          }
          className="text-slate-400 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-slate-900">Book Appointment</h1>
        {/* Progress */}
        <div className="ml-auto flex items-center gap-1">
          {STEP_ORDER.map((s) => (
            <div key={s} className={`w-2 h-2 rounded-full transition-colors ${
              step === s ? 'bg-cyan-600' : STEP_ORDER.indexOf(step) > STEP_ORDER.indexOf(s) ? 'bg-cyan-300' : 'bg-slate-200'
            }`} />
          ))}
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 pb-8">
        {/* Doctor Card */}
        {doctor && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-5 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {doctor.user?.fullName?.charAt(0) || 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">{doctor.user?.fullName}</p>
              <p className="text-xs text-slate-500">{doctor.specialization} • {doctor.department?.name}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-slate-900">₹{doctor.consultationFee}</p>
              <p className="text-xs text-slate-400">per visit</p>
            </div>
          </div>
        )}

        {/* STEP 1: Slot Selection */}
        {step === STEPS.SLOT && (
          <>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
              <h2 className="font-semibold text-slate-900 mb-3 text-sm">Select Date</h2>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {dates.map((d) => (
                  <button key={d.full} onClick={() => setSelectedDate(d)}
                    className={`flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-xl border-2 transition-all ${
                      selectedDate.full === d.full ? 'border-cyan-500 bg-cyan-50' : 'border-slate-100 hover:border-slate-200'
                    }`}>
                    <span className="text-xs text-slate-400 font-medium">{d.day}</span>
                    <span className={`text-lg font-bold ${selectedDate.full === d.full ? 'text-cyan-700' : 'text-slate-800'}`}>{d.date}</span>
                    <span className="text-xs text-slate-400">{d.month}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-5">
              <h2 className="font-semibold text-slate-900 mb-3 text-sm">Select Time Slot</h2>
              {slotsLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-cyan-500" /></div>
              ) : slotsError ? (
                <p className="text-xs text-red-500 py-3 text-center">{slotsError}</p>
              ) : availableSlots.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No slots available for this date. Please pick another day.</p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => !slot.booked && setSelectedTime(slot.time)}
                        disabled={slot.booked}
                        title={slot.booked ? 'This slot is already booked' : undefined}
                        className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                          slot.booked
                            ? 'border-slate-100 bg-slate-50 text-slate-300 line-through cursor-not-allowed'
                            : selectedTime === slot.time
                              ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                              : 'border-slate-100 text-slate-700 hover:border-cyan-200'
                        }`}>
                        {formatSlotLabel(slot.time)}
                      </button>
                    ))}
                  </div>
                  {availableSlots.every((s) => s.booked) && (
                    <p className="text-xs text-slate-400 pt-3 text-center">All slots are booked for this date. Please pick another day.</p>
                  )}
                </>
              )}
            </div>

            <button
              onClick={handleProceedToType}
              disabled={!selectedTime}
              className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* STEP 2: Type Selection (Phase 16) */}
        {step === STEPS.TYPE && (
          <>
            <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-5">
              <h2 className="font-semibold text-slate-900 mb-1">Choose Consultation Mode</h2>
              <p className="text-xs text-slate-400 mb-5">
                {formatSlotLabel(selectedTime)} · {selectedDate.full}
              </p>

              <div className="space-y-3">
                {/* In-Person Option */}
                <button
                  onClick={() => handleSelectType('OFFLINE')}
                  className="w-full flex items-start gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-cyan-300 hover:bg-cyan-50 transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-900">In-Person Visit</p>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Classic</span>
                    </div>
                    <p className="text-xs text-slate-500">Visit the clinic physically. You'll receive a queue token and wait to be called.</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Physical presence</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Queue-based</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-500 mt-1 flex-shrink-0 transition-colors" />
                </button>

                {/* Online Option */}
                <button
                  onClick={() => handleSelectType('ONLINE')}
                  className="w-full flex items-start gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-violet-300 hover:bg-violet-50 transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-violet-200 transition-colors">
                    <Video className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-900">Video Consultation</p>
                      <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">Online</span>
                    </div>
                    <p className="text-xs text-slate-500">Consult from home via secure video call. No waiting room needed.</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Video className="w-3 h-3" /> HD video call</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Scheduled time</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 mt-1 flex-shrink-0 transition-colors" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* STEP 3: Summary */}
        {step === STEPS.SUMMARY && (
          <>
            <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-5">
              <h2 className="font-semibold text-slate-900 mb-4">Appointment Summary</h2>
              <div className="space-y-3">
                {[
                  { label: 'Hospital', value: hospital?.name },
                  { label: 'Doctor', value: doctor?.user?.fullName },
                  { label: 'Department', value: doctor?.department?.name },
                  { label: 'Specialization', value: doctor?.specialization },
                  { label: 'Date', value: selectedDate.full },
                  { label: 'Time', value: formatSlotLabel(selectedTime) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-medium text-slate-900">{value}</span>
                  </div>
                ))}
                {/* Mode badge */}
                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Mode</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    consultationType === 'ONLINE'
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {consultationType === 'ONLINE' ? '🎥 Online Video' : '🏥 In-Person'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm bg-cyan-50 rounded-xl p-3 mt-2">
                  <span className="font-semibold text-slate-700">Consultation Fee</span>
                  <span className="font-bold text-cyan-700 text-lg">₹{doctor?.consultationFee}</span>
                </div>
              </div>
            </div>

            {bookingError && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {bookingError}
              </div>
            )}

            <button
              onClick={handleProceedToPayment}
              disabled={initiating}
              className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {initiating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Reserving your slot…</>
                : <><CreditCard className="w-4 h-4" /> Proceed to Payment</>}
            </button>
          </>
        )}

        {/* STEP 4: Payment */}
        {step === STEPS.PAYMENT && booking && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Complete Payment</h2>
            <RazorpayCheckout
              appointmentId={booking.appointmentId}
              billId={booking.billId}
              razorpayOrderId={booking.razorpayOrderId}
              amount={booking.amount ?? doctor?.consultationFee}
              keyId={booking.keyId}
              isMock={booking.isMock}
              doctor={doctorSummary}
              scheduledDate={booking.scheduledDate || selectedDate.full}
              scheduledTime={formatSlotLabel(booking.scheduledTime || selectedTime)}
              slotHeldUntil={booking.slotHeldUntil}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setStep(STEPS.SUMMARY)}
            />
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            <p className="text-slate-600 font-medium">Confirming your appointment…</p>
          </div>
        </div>
      )}
    </div>
  );
}
