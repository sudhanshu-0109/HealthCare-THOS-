/**
 * components/booking/SlotPicker.jsx — Date + time slot selector.
 */

import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import * as availabilityService from '../../services/availability.service';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDate = (d) => `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
const toDateStr = (d) => d.toISOString().split('T')[0];

const getNext14Days = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
};

export default function SlotPicker({ doctorId, consultationFee, onSlotSelected }) {
  const days = getNext14Days();
  const [selectedDate, setSelectedDate] = useState(days[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dayOffset, setDayOffset] = useState(0);

  useEffect(() => {
    if (!doctorId) return;
    setLoading(true);
    setError(null);
    setSelectedSlot(null);
    availabilityService.getSlots(doctorId, toDateStr(selectedDate))
      .then((res) => setSlots(res.data?.slots || res.slots || []))
      .catch(() => setError('Could not load available slots.'))
      .finally(() => setLoading(false));
  }, [doctorId, selectedDate]);

  const visibleDays = days.slice(dayOffset, dayOffset + 7);

  return (
    <div className="space-y-5">
      {/* Date selector */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-500" /> Select Date
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDayOffset(Math.max(0, dayOffset - 7))}
              disabled={dayOffset === 0}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDayOffset(Math.min(7, dayOffset + 7))}
              disabled={dayOffset >= 7}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {visibleDays.map((day) => {
            const isSelected = toDateStr(day) === toDateStr(selectedDate);
            const isToday = toDateStr(day) === toDateStr(new Date());
            return (
              <button
                key={toDateStr(day)}
                onClick={() => setSelectedDate(day)}
                className={`flex flex-col items-center py-2 px-1 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700'
                }`}
              >
                <span className="text-[10px] opacity-70">{DAYS[day.getDay()]}</span>
                <span className="text-sm font-bold">{day.getDate()}</span>
                {isToday && <span className="w-1 h-1 rounded-full bg-current mt-0.5 opacity-60" />}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">{formatDate(selectedDate)}</p>
      </div>

      {/* Time slot grid */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-500" /> Available Slots
        </h3>

        {loading && (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading slots…
          </div>
        )}

        {!loading && error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>
        )}

        {!loading && !error && slots.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-xl">
            No available slots on this date
          </div>
        )}

        {!loading && !error && slots.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {slots.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold text-center transition-all ${
                  selectedSlot === slot
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-slate-50 text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 border border-slate-200 hover:border-cyan-300'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer: fee + CTA */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="text-sm">
          <span className="text-slate-400">Consultation Fee</span>
          <div className="font-bold text-slate-900 text-lg">₹{Number(consultationFee).toLocaleString('en-IN')}</div>
        </div>
        <button
          onClick={() => onSlotSelected({ date: toDateStr(selectedDate), time: selectedSlot })}
          disabled={!selectedSlot}
          className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          Continue to Payment →
        </button>
      </div>
    </div>
  );
}
