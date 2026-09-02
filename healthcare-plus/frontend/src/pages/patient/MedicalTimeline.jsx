/**
 * pages/patient/MedicalTimeline.jsx — Paginated medical timeline view.
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import TimelineEvent from '../../components/passport/TimelineEvent';
import * as passportService from '../../services/passport.service';

const EVENT_TYPES = ['', 'APPOINTMENT', 'CONSULTATION', 'PRESCRIPTION', 'LAB_REPORT', 'MEDICATION'];

export default function MedicalTimeline() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTimeline = async (reset = false) => {
    const currentPage = reset ? 1 : page;
    setLoading(true);
    try {
      const res = await passportService.getMyTimeline({
        eventType: filter || undefined,
        page: currentPage,
        limit: 15,
      });
      const data = res.data || res;
      const eventList = Array.isArray(data?.events) ? data.events : Array.isArray(data) ? data : [];
      if (reset) {
        setEvents(eventList);
        setPage(2);
      } else {
        setEvents((prev) => [...(Array.isArray(prev) ? prev : []), ...eventList]);
        setPage((p) => p + 1);
      }
      setTotal(typeof data?.total === 'number' ? data.total : eventList.length);
    } catch (err) {
      console.error('[MedicalTimeline]', err);
      if (reset) setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline(true);
  }, [filter]);

  const hasMore = (events?.length || 0) < (total || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-teal-50/10">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/patient/passport" className="text-slate-400 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">Medical Timeline</h1>
            <p className="text-sm text-slate-400">{total} events in your history</p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          >
            <option value="">All Types</option>
            {EVENT_TYPES.slice(1).map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {/* Timeline */}
        {loading && events.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading history…
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-3">📋</div>
            <p>No medical events yet</p>
            <p className="text-sm mt-1">Your history will appear here after appointments</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            {events.map((event, idx) => (
              <TimelineEvent key={event.id} event={event} isLast={idx === events.length - 1} />
            ))}

            {hasMore && (
              <button
                onClick={() => fetchTimeline()}
                disabled={loading}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                Load more
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
