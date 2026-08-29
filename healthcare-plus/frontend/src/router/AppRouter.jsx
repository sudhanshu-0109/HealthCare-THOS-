/**
 * router/AppRouter.jsx — Full application route tree with ProtectedRoute wrappers.
 *
 * All new dashboards from Responsive Elegant Website are self-contained (include DashboardShell),
 * so they do NOT need a DashboardLayout wrapper.
 */

import { Routes, Route } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';

// Public pages
import Landing from '../pages/public/Landing';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import VerifyEmail from '../pages/public/VerifyEmail';
import ForgotPassword from '../pages/public/ForgotPassword';
import ResetPassword from '../pages/public/ResetPassword';
import AcceptInvite from '../pages/public/AcceptInvite';
import NotFound from '../pages/NotFound';
import Unauthorized from '../pages/Unauthorized';
import DevMapCheck from '../pages/__DevMapCheck'; // TEMP: remove after map verification

// Auth Guard Component
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Patient pages
import PatientDashboard from '../pages/patient/Dashboard';
import HospitalWorkspace from '../pages/patient/HospitalWorkspace';
import DoctorBooking from '../pages/patient/DoctorBooking';
import AppointmentConfirmation from '../pages/patient/AppointmentConfirmation';
import LiveQueue from '../pages/patient/LiveQueue';
import Passport from '../pages/patient/Passport';
import MedicalTimeline from '../pages/patient/MedicalTimeline';
import EmergencyTracking from '../pages/patient/EmergencyTracking';
// Phase 16: Online Consultation
import WaitingRoom from '../pages/patient/WaitingRoom';
import VideoConsultation from '../pages/patient/VideoConsultation';

// Admin pages
import HospitalAdminDashboard from '../pages/admin/Dashboard';

// Doctor pages
import DoctorDashboard from '../pages/doctor/Dashboard';
import DoctorQueue from '../pages/doctor/Queue';
import ConsultationScreen from '../pages/doctor/ConsultationScreen';
import PatientProfileView from '../pages/doctor/PatientProfileView';
// Phase 16: Online Consultation
import DoctorVideoConsultation from '../pages/doctor/DoctorVideoConsultation';

// Lab pages
import LabDashboard from '../pages/lab/Dashboard';

// Pharmacy pages
import PharmacyDashboard from '../pages/pharmacy/Dashboard';

// Driver pages
import AmbulanceDashboard from '../pages/driver/Dashboard';

// Super Admin pages
import SuperAdminDashboard from '../pages/superadmin/Dashboard';

// ── AppRouter ─────────────────────────────────────────────────────────────
const AppRouter = () => {
  return (
    <Routes>

      {/* ── Public routes ──────────────────────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/__devmap" element={<DevMapCheck />} />{/* TEMP: remove after map verification */}
      </Route>

      {/* ── Patient routes (protected, role=PATIENT) ──────────────────── */}
      {/*   PatientDashboard is self-contained with DashboardShell          */}
      <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/hospitals" element={<PatientDashboard />} />
        
        {/* Phase 5, 6, 7 Routes */}
        <Route path="/hospitals/:hospitalId" element={<HospitalWorkspace />} />
        <Route path="/hospitals/:hospitalId/doctors/:doctorId/book" element={<DoctorBooking />} />
        <Route path="/appointments/:id/confirmation" element={<AppointmentConfirmation />} />
        <Route path="/appointments/:appointmentId/queue" element={<LiveQueue />} />
        <Route path="/patient/passport" element={<Passport />} />
        <Route path="/patient/timeline" element={<MedicalTimeline />} />
        <Route path="/patient/emergency/:requestId" element={<EmergencyTracking />} />
        <Route path="/patient/billing" element={<PatientDashboard />} />

        {/* Phase 16: Online Consultation */}
        <Route path="/patient/waiting-room/:appointmentId" element={<WaitingRoom />} />
        <Route path="/patient/video-consultation/:appointmentId" element={<VideoConsultation />} />
        
        {/* Redirect old dashboard routes */}
        <Route path="/dashboard" element={<PatientDashboard />} />
        <Route path="/appointments" element={<PatientDashboard />} />
        <Route path="/passport" element={<Passport />} />
        <Route path="/prescriptions" element={<PatientDashboard />} />
      </Route>

      {/* ── Doctor routes (protected, role=DOCTOR) ────────────────────── */}
      {/*   DoctorDashboard is self-contained with DashboardShell            */}
      <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/queue" element={<DoctorQueue />} />
        <Route path="/doctor/consultation/:appointmentId" element={<ConsultationScreen />} />
        <Route path="/doctor/passport/:patientId" element={<PatientProfileView />} />
        {/* Phase 16: Online Consultation */}
        <Route path="/doctor/video-consultation/:appointmentId" element={<DoctorVideoConsultation />} />
      </Route>

      {/* ── Hospital Admin routes (protected, role=HOSPITAL_ADMIN) ─────── */}
      {/*   HospitalAdminDashboard is a self-contained tab SPA (DashboardShell */}
      {/*   drives tabs via local state, not the URL), so a single route is    */}
      {/*   the canonical entry. The former /admin/{departments,staff,...}     */}
      {/*   sub-routes were reachable only from dead code and always rendered  */}
      {/*   Overview regardless of the path — removed to keep URLs honest.     */}
      <Route element={<ProtectedRoute allowedRoles={['HOSPITAL_ADMIN']} />}>
        <Route path="/admin/dashboard" element={<HospitalAdminDashboard />} />
      </Route>

      {/* ── Lab Staff routes (protected, role=LAB_STAFF) ────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['LAB_STAFF']} />}>
        <Route path="/lab/dashboard" element={<LabDashboard />} />
        <Route path="/lab/requests/:requestId" element={<LabDashboard />} />
      </Route>

      {/* ── Pharmacist routes (protected, role=PHARMACIST) ──────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['PHARMACIST']} />}>
        <Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />
      </Route>

      {/* ── Ambulance Driver routes (protected, role=AMBULANCE_DRIVER) ─── */}
      <Route element={<ProtectedRoute allowedRoles={['AMBULANCE_DRIVER']} />}>
        <Route path="/driver/dashboard" element={<AmbulanceDashboard />} />
      </Route>

      {/* ── Receptionist routes (protected, role=RECEPTIONIST) ──────────── */}
      <Route element={<ProtectedRoute allowedRoles={['RECEPTIONIST']} />}>
        <Route path="/receptionist/dashboard" element={<HospitalAdminDashboard />} />
      </Route>

      {/* ── Super Admin routes (protected, role=SUPER_ADMIN) ─────────────── */}
      {/*   SuperAdminDashboard is a self-contained tab SPA — single canonical */}
      {/*   route (former /superadmin/{hospitals,users,...} sub-routes were    */}
      {/*   dead-code-only and always rendered Overview; removed).             */}
      <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
      </Route>

      {/* ── 404 fallback ──────────────────────────────────────────────── */}
      <Route path="*" element={<PublicLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>

    </Routes>
  );
};

export default AppRouter;
