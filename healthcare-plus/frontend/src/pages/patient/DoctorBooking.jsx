/**
 * pages/patient/DoctorBooking.jsx — Complete booking flow: Type → Slot → Summary → Payment → Confirmation
 *
 * Phase 16 extension: Added a consultation type step (OFFLINE | ONLINE) before slot selection.
 * Online appointments show a different confirmation screen with a "Join Waiting Room" CTA.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Loader2, CreditCard, AlertCircle,
  Monitor, MapPin, Video, Calendar,
} from 'lucide-react';
import * as appointmentsService from '../../services/appointments.service';
import RazorpayCheckout from '../../components/booking/RazorpayCheckout';
import api from '../../services/api';

const STEPS = { TYPE: 'type', SLOT: 'slot', SUMMARY: 'summary', PAYMENT: 'payment', CONFIRMED: 'confirmed' };

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
  const [step, setStep] = useState(STEPS.TYPE);
  const [consultationType, setConsultationType] = useState('OFFLINE');
  const [selectedDate, setSelectedDate] = useState(getDates()[0]);
  const [selectedTime, setSelectedTime] = useState(null);
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
  // `allSlots` carries every slot in the doctor's grid, each flagged booked or
  // free, so booked ones render struck-through/disabled (not simply hidden).
  useEffect(() => {
    if (!doctor?.id || !selectedDate?.full) return;
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedTime(null);
    api.get(`/availability/${doctor.id}/slots`, { params: { date: selectedDate.full } })
      .then((res) => {
        if (cancelled) return;
        // Prefer the flagged grid; fall back to available-only strings mapped to objects.
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

  const handleProceedToSummary = () => {
    if (!selectedTime) return;
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
        consultationType,
      });
      setBooking(res.data);
      setStep(STEPS.PAYMENT);
    } catch (err) {
      setBookingError(err.message || 'Could not start booking. Please try again.');
    } finally {
      setInitiating(false);
    }
  };

  // Called by RazorpayCheckout AFTER the server verified the payment and marked
  // the appointment CONFIRMED.
  const handlePaymentSuccess = async () => {
    setLoading(true);
    let token = null;
    let appointmentId = booking?.appointmentId;
    try {
      const res = await appointmentsService.getAppointmentById(appointmentId);
      const appt = res.data?.appointment || res.data;
      if (appt?.queueToken?.tokenNumber != null) token = `T-${appt.queueToken.tokenNumber}`;
    } catch {
      // Token will simply not be shown if the fetch fails.
    } finally {
      setConfirmedData({ token, appointmentId });
      setLoading(false);
      setStep(STEPS.CONFIRMED);
    }
  };

  const doctorSummary = {
    name: doctor?.user?.fullName,
    specialization: doctor?.specialization,
    hospital: hospital?.name,
  };

  // ── Step: TYPE selector ──────────────────────────────────────────────────────
  if (step === STEPS.TYPE) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8 max-w-md w-full">
          <button onClick={onBack || (() => navigate(-1))} className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="mb-8">
            <p className="text-cyan-400 text-sm font-semibold uppercase tracking-wider mb-1">Step 1 of 4</p>
            <h2 className="text-2xl font-bold text-white">Choose Consultation Mode</h2>
            <p className="text-white/50 text-sm mt-1">How would you like to meet Dr. {doctor?.user?.fullName}?</p>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-8">
            {/* OFFLINE option */}
            <button
              onClick={() => setConsultationType('OFFLINE')}
              className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                consultationType === 'OFFLINE'
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                consultationType === 'OFFLINE' ? 'bg-cyan-400/20' : 'bg-white/10'
              }`}>
                <MapPin className={`w-6 h-6 ${consultationType === 'OFFLINE' ? 'text-cyan-400' : 'text-white/40'}`} />
              </div>
              <div>
                <p className="font-semibold text-white">In-Person Visit</p>
                <p className="text-white/50 text-sm mt-0.5">Visit the clinic. You'll get a queue token after booking.</p>
              </div>
              {consultationType === 'OFFLINE' && (
                <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-cyan-400" />
              )}
            </button>

            {/* ONLINE option */}
            <button
              onClick={() => setConsultationType('ONLINE')}
              className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                consultationType === 'ONLINE'
                  ? 'border-violet-400 bg-violet-400/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                consultationType === 'ONLINE' ? 'bg-violet-400/20' : 'bg-white/10'
              }`}>
                <Video className={`w-6 h-6 ${consultationType === 'ONLINE' ? 'text-violet-400' : 'text-white/40'}`} />
              </div>
              <div>
                <p className="font-semibold text-white">Video Consultation</p>
                <p className="text-white/50 text-sm mt-0.5">Meet your doctor online from anywhere — no travel needed.</p>
              </div>
              {consultationType === 'ONLINE' && (
                <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-violet-400" />
              )}
            </button>
          </div>

          <button
            onClick={() => setStep(STEPS.SLOT)}
            className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-semibold transition-colors"
          >
            Continue — Select Time Slot
          </button>
        </div>
      </div>
    );
  }

  // ── Step: CONFIRMED ───────────────────────────────────────────────────────────
  if (step === STEPS.CONFIRMED) {
    const isOnline = consultationType === 'ONLINE';
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isOnline ? 'bg-violet-100' : 'bg-emerald-100'
          }`}>
            {isOnline
              ? <Video className="w-10 h-10 text-violet-500" />
              : <CheckCircle2 className="w-10 h-10 text-emerald-500" />}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Appointment Confirmed!</h2>
          <p className="text-slate-500 text-sm mb-6">
            {isOnline
              ? 'Your online consultation is scheduled. Join the waiting room at your appointment time.'
              : 'Your payment was verified and your appointment is booked.'}
          </p>

          <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Doctor</span><span className="font-semibold text-slate-900">{doctor?.user?.fullName}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Specialty</span><span className="font-medium text-slate-700">{doctor?.specialization}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Date</span><span className="font-medium text-slate-700">{selectedDate.full}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Time</span><span className="font-medium text-slate-700">{formatSlotLabel(selectedTime)}</span></div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Mode</span>
              <span className={`font-semibold text-sm ${ isOnline ? 'text-violet-600' : 'text-emerald-600'}`}>
                {isOnline ? '🎥 Video Consultation' : '🏥 In-Person'}
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
            {isOnline && confirmedData?.appointmentId && (
              <button
                onClick={() => navigate(`/patient/waiting-room/${confirmedData.appointmentId}`)}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" /> Join Waiting Room
              </button>
            )}
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 h-14 flex items-center px-4 gap-3 sticky top-0 z-10">
        <button
          onClick={
            step === STEPS.TYPE
              ? (onBack || (() => navigate(-1)))
              : () => {
                  if (step === STEPS.PAYMENT) setStep(STEPS.SUMMARY);
                  else if (step === STEPS.SUMMARY) setStep(STEPS.SLOT);
                  else if (step === STEPS.SLOT) setStep(STEPS.TYPE);
                }
          }
          className="text-slate-400 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-slate-900">Book Appointment</h1>
        {/* Progress */}
        <div className="ml-auto flex items-center gap-1">
          {[STEPS.TYPE, STEPS.SLOT, STEPS.SUMMARY, STEPS.PAYMENT].map((s) => (
            <div key={s} className={`w-2 h-2 rounded-full transition-colors ${
              step === s ? 'bg-cyan-600' : Object.values(STEPS).indexOf(step) > Object.values(STEPS).indexOf(s) ? 'bg-cyan-300' : 'bg-slate-200'
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
              onClick={handleProceedToSummary}
              disabled={!selectedTime}
              className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Continue to Summary <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* STEP 2: Summary */}
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

        {/* STEP 3: Payment */}
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
