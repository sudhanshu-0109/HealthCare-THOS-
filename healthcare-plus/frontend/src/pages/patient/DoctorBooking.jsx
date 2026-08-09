/**
 * pages/patient/DoctorBooking.jsx — Slot picker + payment flow for booking a doctor.
 * Accessed from HospitalWorkspace when patient clicks "Book Appointment".
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Building2, Stethoscope, Star } from 'lucide-react';
import SlotPicker from '../../components/booking/SlotPicker';
import RazorpayCheckout from '../../components/booking/RazorpayCheckout';
import * as appointmentsService from '../../services/appointments.service';

const STEPS = { SLOT: 'slot', PAYMENT: 'payment' };

export default function DoctorBooking({ doctor: propDoctor }) {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const doctor = propDoctor || null;

  const [step, setStep] = useState(STEPS.SLOT);
  const [bookingInfo, setBookingInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSlotSelected = async ({ date, time }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentsService.initiateBooking({
        doctorId: doctor?.id || doctorId,
        scheduledDate: date,
        scheduledTime: time,
      });
      setBookingInfo(res.data);
      setStep(STEPS.PAYMENT);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not initiate booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (data) => {
    navigate(`/appointments/${data.appointment?.id}/confirmation`, {
      state: { appointment: data.appointment, queueToken: data.queueToken },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-teal-50/10">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <button
          onClick={() => step === STEPS.PAYMENT ? setStep(STEPS.SLOT) : navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Doctor card */}
        {doctor && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-md shadow-cyan-500/20 flex-shrink-0">
                <User className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-slate-900 text-lg">{doctor.user?.fullName || 'Dr. Unknown'}</h1>
                <p className="text-cyan-600 text-sm font-medium flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5" />
                  {doctor.specialization}
                </p>
                <p className="text-slate-500 text-sm flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {doctor.department?.name} · {doctor.hospital?.name}
                </p>
                {doctor.averageRating > 0 && (
                  <p className="text-amber-500 text-xs font-medium flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 fill-amber-400 stroke-amber-500" />
                    {doctor.averageRating.toFixed(1)} · {doctor.experienceYears}y experience
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === STEPS.SLOT ? 'bg-cyan-500 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
            <div className="h-px flex-1 bg-slate-100" />
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === STEPS.PAYMENT ? 'bg-cyan-500 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          {step === STEPS.SLOT && (
            <SlotPicker
              doctorId={doctor?.id || doctorId}
              consultationFee={doctor?.consultationFee || 0}
              onSlotSelected={handleSlotSelected}
            />
          )}

          {step === STEPS.PAYMENT && bookingInfo && (
            <RazorpayCheckout
              appointmentId={bookingInfo.appointmentId}
              billId={bookingInfo.billId}
              razorpayOrderId={bookingInfo.razorpayOrderId}
              amount={bookingInfo.amount}
              keyId={bookingInfo.keyId}
              isMock={bookingInfo.isMock}
              doctor={bookingInfo.doctor}
              scheduledDate={bookingInfo.scheduledDate}
              scheduledTime={bookingInfo.scheduledTime}
              slotHeldUntil={bookingInfo.slotHeldUntil}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setStep(STEPS.SLOT)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
