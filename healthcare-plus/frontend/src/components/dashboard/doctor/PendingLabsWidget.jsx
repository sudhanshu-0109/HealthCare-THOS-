import { useState, useEffect } from 'react';
import { FlaskConical, Clock } from 'lucide-react';
import api from '../../../services/api'; // temporary inline fetch until lab service is full

export default function PendingLabsWidget() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);

  // We haven't built the specific 'get doctor's pending labs' route yet, 
  // but we can query /api/lab-requests later. For now, it's a placeholder struct.
  // We'll update it to real data when Phase 10 is done or by querying Phase 8 LabRequests.
  useEffect(() => {
    // This assumes an endpoint like GET /api/lab-requests?doctorId=me&status=PENDING
    // which we will add in Phase 10 or we can do a quick fetch if we add it to labRequests controller.
    // For Phase 8 we'll just mock the fetch or show empty state.
    setLoading(false);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">Pending Lab Results</h2>
        <div className="bg-red-50 text-red-600 p-1.5 rounded-lg">
          <FlaskConical className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-3">
        {labs.length === 0 ? (
          <div className="text-center text-slate-400 py-6 text-sm flex flex-col items-center gap-2">
            <Clock className="w-8 h-8 text-slate-200" />
            No pending lab results to review.
          </div>
        ) : (
          labs.map(lab => (
            <div key={lab.id} className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-900">{lab.patientName}</div>
                <div className="text-xs text-slate-500">{lab.testName}</div>
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-amber-50 text-amber-600 rounded">
                Pending
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
