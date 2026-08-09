import { RefreshCw, PlayCircle } from 'lucide-react';
import useDoctorQueue from '../../../hooks/useDoctorQueue';
import { useNavigate } from 'react-router-dom';

export default function TodayQueueWidget() {
  const { queue, loading, fetchQueue, stats } = useDoctorQueue();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Today's Queue</h2>
        <div className="flex justify-center items-center h-40 text-slate-400">Loading...</div>
      </div>
    );
  }

  const queueList = Array.isArray(queue) ? queue : [];
  const waitingQueue = queueList.filter(t => t?.status === 'WAITING' || t?.status === 'CALLED');
  const inProgress = queueList.find(t => t?.status === 'IN_PROGRESS');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-slate-800">Today's Queue</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
            {(stats?.waiting || 0) + (stats?.called || 0)} Waiting
          </span>
          <button onClick={fetchQueue} className="text-slate-400 hover:text-slate-700">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {inProgress && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex justify-between items-center">
            <div>
              <div className="text-xs font-bold text-amber-600 mb-1">CURRENTLY CONSULTING</div>
              <div className="font-medium text-slate-900">
                #{inProgress.tokenNumber} - {inProgress.appointment?.patient?.fullName || 'Patient'}
              </div>
            </div>
            <button
              onClick={() => navigate(`/doctor/consultation/${inProgress.appointment?.id}?token=${inProgress.id}`)}
              className="bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Resume
            </button>
          </div>
        )}

        {waitingQueue.length === 0 && !inProgress ? (
          <div className="text-center text-slate-400 py-8">No patients waiting right now.</div>
        ) : (
          waitingQueue.map((token) => (
            <div key={token.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors">
              <div>
                <span className="font-bold text-slate-700 text-sm w-8 inline-block">#{token.tokenNumber}</span>
                <span className="text-sm font-medium text-slate-900">{token.appointment?.patient?.fullName || 'Patient'}</span>
              </div>
              <button
                onClick={() => navigate(`/doctor/consultation/${token.appointment?.id}?token=${token.id}`)}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  token.status === 'CALLED' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <PlayCircle className="w-4 h-4" />
                {token.status === 'CALLED' ? 'Start' : 'Call & Start'}
              </button>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100 text-center">
        <button onClick={() => navigate('/doctor/queue')} className="text-sm font-medium text-blue-600 hover:text-blue-700">
          Open Full Queue Manager →
        </button>
      </div>
    </div>
  );
}
