import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Save, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import PatientContextPanel from '../../components/consultation/PatientContextPanel';
import ConsultationForm from '../../components/consultation/ConsultationForm';
import PrescriptionEditor from '../../components/consultation/PrescriptionEditor';
import LabRequestEditor from '../../components/consultation/LabRequestEditor';
import FollowUpRecommendationForm from '../../components/consultation/FollowUpRecommendationForm';
import * as consultationsService from '../../services/consultations.service';
import * as prescriptionsService from '../../services/prescriptions.service';
import * as labRequestsService from '../../services/labRequests.service';
import * as followUpService from '../../services/followUp.service';

export default function ConsultationScreen() {
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const queueTokenId = searchParams.get('token');
  const navigate = useNavigate();

  const [consultation, setConsultation] = useState(null);
  const [passportSummary, setPassportSummary] = useState(null);
  const [passportDenied, setPassportDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Child component states that need to be submitted separately but tracked here for completeness check
  const [hasPrescription, setHasPrescription] = useState(false);
  const [hasLabRequest, setHasLabRequest] = useState(false);
  const [hasFollowUp, setHasFollowUp] = useState(false);
  
  // Autosave tracking for ConsultationForm
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    if (!appointmentId || !queueTokenId) {
      setError('Missing appointment or token ID.');
      setLoading(false);
      return;
    }

    consultationsService.startConsultation(appointmentId, queueTokenId)
      .then(res => {
        const cData = res.data || res;
        setConsultation(cData.consultation || cData);
        if (cData.passportAccessDenied) {
          setPassportDenied(true);
        } else {
          setPassportSummary(cData.passportSummary);
        }
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to start consultation.');
      })
      .finally(() => setLoading(false));
  }, [appointmentId, queueTokenId]);

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

  const handleComplete = async () => {
    if (!window.confirm('Are you sure you want to complete this consultation? You will not be able to edit it later.')) {
      return;
    }
    
    try {
      await consultationsService.completeConsultation(consultation.id);
      navigate('/doctor/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete consultation.');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading consultation...</div>;
  if (error) return <div className="p-8 text-center text-red-600 font-bold">{error}</div>;
  if (!consultation) return null;

  return (
    <DashboardShell
      navItems={[]}
      activeItem=""
      setActiveItem={() => {}}
      roleLabel="Doctor"
      roleColor="from-cyan-500 to-teal-600"
    >
      <div className="flex flex-col h-full bg-slate-50 max-w-7xl mx-auto rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/doctor/dashboard')} className="text-slate-400 hover:text-slate-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                Consultation: {consultation.patient.fullName}
              </h1>
              <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                <span>{consultation.patient.patientProfile?.gender || 'Unknown Gender'}</span>
                <span>•</span>
                <span>Blood: {consultation.patient.patientProfile?.bloodGroup || 'Unknown'}</span>
                {isSaving ? (
                  <span className="flex items-center gap-1 text-amber-600 ml-4">
                    <Save className="w-3.5 h-3.5 animate-pulse" /> Saving...
                  </span>
                ) : lastSaved ? (
                  <span className="flex items-center gap-1 text-emerald-600 ml-4">
                    <CheckCircle className="w-3.5 h-3.5" /> Saved at {lastSaved.toLocaleTimeString()}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleComplete}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <CheckCircle className="w-5 h-5" />
            Complete Consultation
          </button>
        </div>

        {/* Content Split */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Main Area (Form + Editors) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <ConsultationForm 
              initialData={consultation} 
              onSave={handleConsultationSave} 
            />

            <PrescriptionEditor 
              consultationId={consultation.id} 
              onSuccess={() => setHasPrescription(true)}
              isReadOnly={hasPrescription}
            />

            <LabRequestEditor 
              consultationId={consultation.id}
              onSuccess={() => setHasLabRequest(true)}
              isReadOnly={hasLabRequest}
            />
            
            <FollowUpRecommendationForm
              consultationId={consultation.id}
              onSuccess={() => setHasFollowUp(true)}
              isReadOnly={hasFollowUp}
            />

          </div>

          {/* Context Panel (Passport Summary) */}
          <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto p-5">
            <h3 className="font-bold text-slate-800 mb-4">Patient Medical Context</h3>
            
            {passportDenied ? (
              <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-lg flex flex-col gap-2 text-sm">
                <AlertCircle className="w-5 h-5" />
                <p><strong>Access Denied.</strong> The patient has not granted you consent to view their Healthcare Passport.</p>
                <p>You can still conduct this consultation, but historical records and allergies are hidden.</p>
              </div>
            ) : passportSummary ? (
              <PatientContextPanel summary={passportSummary} patientId={consultation.patientId} />
            ) : (
              <div className="text-slate-400 text-sm">Loading context...</div>
            )}
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}
