import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, UserCheck,
  Loader2, AlertCircle, ClipboardList, PanelRightClose, PanelRightOpen,
  Save, CheckCircle
} from 'lucide-react';
import useVideoConsultation from '../../hooks/useVideoConsultation';
import * as onlineSessionService from '../../services/onlineSession.service';
import * as consultationsService from '../../services/consultations.service';
import { getSocket } from '../../services/socket';

import ConsultationForm from '../../components/consultation/ConsultationForm';
import PrescriptionEditor from '../../components/consultation/PrescriptionEditor';
import LabRequestEditor from '../../components/consultation/LabRequestEditor';
import PatientContextPanel from '../../components/consultation/PatientContextPanel';

export default function DoctorVideoConsultation() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [error, setError] = useState(null);

  // Clinical Panel State
  const [showClinicalPanel, setShowClinicalPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('notes'); // notes, prescription, lab, context
  
  const [consultation, setConsultation] = useState(null);
  const [passportSummary, setPassportSummary] = useState(null);
  const [passportDenied, setPassportDenied] = useState(false);
  
  const [hasPrescription, setHasPrescription] = useState(false);
  const [hasLabRequest, setHasLabRequest] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const {
    localRef,
    remoteRef,
    isConnected,
    isConnecting,
    isMuted,
    isCameraOff,
    remoteJoined,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useVideoConsultation(appointmentId, { role: 'DOCTOR' });

  // Load session details initially
  useEffect(() => {
    onlineSessionService.getSession(appointmentId)
      .then((res) => {
        const s = res.data?.data || res.data;
        setSession(s);
        if (s.status === 'IN_PROGRESS' || s.status === 'DOCTOR_JOINED') {
          setCallStarted(true);
        }
      })
      .catch((err) => setError(err.response?.data?.message || err.message));
  }, [appointmentId]);

  // Load Consultation details when call starts (so doctor can take notes)
  useEffect(() => {
    if (callStarted) {
      consultationsService.getConsultationByAppointment(appointmentId)
        .then(res => {
          const cData = res.data?.data || res.data;
          setConsultation(cData.consultation);
          if (cData.passportAccessDenied) {
            setPassportDenied(true);
          } else {
            setPassportSummary(cData.passportSummary);
          }
          setShowClinicalPanel(true);
        })
        .catch(err => console.error("Failed to load consultation context", err));
    }
  }, [callStarted, appointmentId]);

  // Listen for session-ended
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onEnded = ({ appointmentId: id }) => {
      if (id !== appointmentId) return;
      endCall();
      navigate(`/doctor/consultation/${appointmentId}`, { replace: true });
    };
    s.on('consultation:session-ended', onEnded);
    return () => s.off('consultation:session-ended', onEnded);
  }, [appointmentId, endCall, navigate]);

  const handleStartCall = useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      const res = await onlineSessionService.startSession(appointmentId);
      setSession(res.data?.data || res.data);
      setCallStarted(true);
      await startCall();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not start call.');
    } finally {
      setStarting(false);
    }
  }, [appointmentId, startCall]);

  const handleEndCall = useCallback(async () => {
    setEnding(true);
    try {
      await onlineSessionService.endSession(appointmentId, 'Doctor ended the session');
      endCall();
      navigate(`/doctor/consultation/${appointmentId}`, { replace: true });
    } catch (err) {
      console.error('[DoctorVideoConsultation] endSession error:', err.message);
      endCall();
      navigate(`/doctor/consultation/${appointmentId}`, { replace: true });
    } finally {
      setEnding(false);
    }
  }, [appointmentId, endCall, navigate]);

  const handleConsultationSave = async (data) => {
    if (!consultation) return;
    setIsSaving(true);
    try {
      await consultationsService.updateConsultation(consultation.id, data);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Autosave failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  const appt = session?.appointment;
  const patientName = appt?.patient?.fullName || 'Patient';

  if (error && !session) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-3xl border border-white/10 p-8 max-w-sm w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Session Error</h2>
          <p className="text-white/60 text-sm">{error}</p>
          <button onClick={() => navigate(-1)} className="mt-6 w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-slate-950 overflow-hidden relative">
      
      {/* Left Panel: Video Call Area */}
      <div className={`flex flex-col h-full transition-all duration-300 ${showClinicalPanel ? 'w-full lg:w-[45%] xl:w-1/2 flex-none' : 'w-full'}`}>
        
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : isConnecting ? 'bg-amber-400 animate-pulse' : 'bg-white/20'}`} />
            <span className="text-white/60 text-sm">
              {callStarted ? (isConnected ? 'Connected' : 'Connecting…') : 'Ready to start'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <UserCheck className="w-3.5 h-3.5" />
              {patientName}
            </div>
            {/* Toggle Clinical Panel Button on Mobile/Tablet */}
            {callStarted && (
              <button 
                onClick={() => setShowClinicalPanel(!showClinicalPanel)}
                className="lg:hidden p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                {showClinicalPanel ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Video area */}
        <div className="flex-1 relative bg-slate-950 min-h-0">
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {!callStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm z-10">
              <div className="text-center max-w-xs p-4">
                <div className="w-20 h-20 rounded-full bg-violet-500/20 border border-violet-400/30 flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-violet-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Start Consultation</h2>
                <p className="text-white/50 text-sm mb-6">
                  Patient <span className="text-white font-medium">{patientName}</span> is waiting
                </p>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                <button
                  onClick={handleStartCall}
                  disabled={starting}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                  {starting ? 'Starting...' : 'Start Video Call'}
                </button>
              </div>
            </div>
          )}

          {callStarted && !remoteJoined && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 z-10">
              <div className="text-center p-4">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-2" />
                <p className="text-white/60 text-sm">Waiting for patient to connect…</p>
              </div>
            </div>
          )}

          {callStarted && (
            <div className="absolute bottom-4 right-4 w-28 h-36 sm:w-32 sm:h-44 lg:w-28 lg:h-40 xl:w-36 xl:h-48 rounded-xl overflow-hidden border border-white/20 shadow-2xl bg-slate-800 z-20">
              <video
                ref={localRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isCameraOff && (
                <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                  <VideoOff className="w-6 h-6 text-white/40" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        {callStarted && (
          <div className="flex items-center justify-center gap-3 sm:gap-4 py-4 bg-slate-900/80 backdrop-blur border-t border-white/10 shrink-0">
            <button
              onClick={toggleMute}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
                isMuted ? 'bg-red-500/20 border border-red-500/50' : 'bg-white/10 border border-white/20 hover:bg-white/20'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5 text-red-400" /> : <Mic className="w-5 h-5 text-white" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
                isCameraOff ? 'bg-red-500/20 border border-red-500/50' : 'bg-white/10 border border-white/20 hover:bg-white/20'
              }`}
            >
              {isCameraOff ? <VideoOff className="w-5 h-5 text-red-400" /> : <Video className="w-5 h-5 text-white" />}
            </button>

            <button
              onClick={handleEndCall}
              disabled={ending}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-50 flex items-center justify-center transition-all shadow-lg shadow-red-900/50 mx-2"
              title="End Call & Go to Notes"
            >
              {ending ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <PhoneOff className="w-6 h-6 text-white" />}
            </button>

            <button
              onClick={() => setShowClinicalPanel(!showClinicalPanel)}
              className={`w-12 h-12 sm:w-14 sm:h-14 hidden lg:flex rounded-full border flex-center items-center justify-center transition-all ${
                showClinicalPanel ? 'bg-violet-600 border-violet-500 hover:bg-violet-500 text-white' : 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
              }`}
              title="Toggle Clinical Panel"
            >
              <ClipboardList className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Right Panel: Clinical Tools */}
      {showClinicalPanel && consultation && (
        <div className="absolute inset-y-0 right-0 w-full lg:relative lg:w-[55%] xl:w-1/2 bg-slate-50 border-l border-slate-200 flex flex-col h-full shadow-2xl z-30 transform transition-transform duration-300 translate-x-0">
          
          {/* Panel Header */}
          <div className="bg-white px-4 py-3 border-b border-slate-200 flex justify-between items-center shrink-0">
            <div>
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-violet-600" /> Clinical Tools
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                {isSaving ? (
                  <span className="flex items-center gap-1 text-amber-600">
                    <Save className="w-3 h-3 animate-pulse" /> Saving...
                  </span>
                ) : lastSaved ? (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle className="w-3 h-3" /> Saved at {lastSaved.toLocaleTimeString()}
                  </span>
                ) : null}
              </div>
            </div>
            <button 
              onClick={() => setShowClinicalPanel(false)} 
              className="lg:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-lg"
            >
              <PanelRightClose className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-slate-200 shrink-0 overflow-x-auto no-scrollbar">
            {[
              { id: 'notes', label: 'Notes' },
              { id: 'prescription', label: 'Prescription' },
              { id: 'lab', label: 'Lab Tests' },
              { id: 'context', label: 'Patient Context' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-violet-100 text-violet-700' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 relative">
            {activeTab === 'notes' && (
              <div className="max-w-3xl mx-auto pb-8">
                <ConsultationForm 
                  initialData={consultation} 
                  onSave={handleConsultationSave} 
                />
              </div>
            )}
            
            {activeTab === 'prescription' && (
              <div className="max-w-3xl mx-auto pb-8">
                <PrescriptionEditor 
                  consultationId={consultation.id} 
                  onSuccess={() => setHasPrescription(true)}
                  isReadOnly={hasPrescription}
                />
              </div>
            )}
            
            {activeTab === 'lab' && (
              <div className="max-w-3xl mx-auto pb-8">
                <LabRequestEditor 
                  consultationId={consultation.id}
                  onSuccess={() => setHasLabRequest(true)}
                  isReadOnly={hasLabRequest}
                />
              </div>
            )}

            {activeTab === 'context' && (
              <div className="max-w-3xl mx-auto pb-8">
                {passportDenied ? (
                  <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-lg flex flex-col gap-2 text-sm">
                    <AlertCircle className="w-5 h-5" />
                    <p><strong>Access Denied.</strong> The patient has not granted you consent to view their Healthcare Passport.</p>
                  </div>
                ) : passportSummary ? (
                  <PatientContextPanel summary={passportSummary} patientId={consultation.patientId} />
                ) : (
                  <div className="text-slate-500 text-sm flex items-center gap-2 justify-center py-10">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading context...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
