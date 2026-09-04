/**
 * router/AppRouter.jsx — Full application route tree with ProtectedRoute wrappers.
 *
 * All new dashboards from Responsive Elegant Website are self-contained (include DashboardShell),
 * so they do NOT need a DashboardLayout wrapper.
 *
 * Every page except the landing page is code-split with React.lazy. Eagerly importing
 * all 20+ pages meant a single first paint pulled the entire app (and every dashboard's
 * chart/map dependency) into the module graph, which made the dev server take minutes to
 * serve `/`. Now `/` loads only the landing page, and each dashboard pulls its own chunk
 * the first time you navigate to it.
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';

// Auth Guard Component
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Landing stays eager — it is the first paint for `/`.
import Landing from '../pages/public/Landing';

// Public pages (lazy-loaded)
const Login = lazy(() => import('../pages/public/Login'));
const Register = lazy(() => import('../pages/public/Register'));
const VerifyEmail = lazy(() => import('../pages/public/VerifyEmail'));
const ForgotPassword = lazy(() => import('../pages/public/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/public/ResetPassword'));
const AcceptInvite = lazy(() => import('../pages/public/AcceptInvite'));
const NotFound = lazy(() => import('../pages/NotFound'));
const Unauthorized = lazy(() => import('../pages/Unauthorized'));
const DevMapCheck = lazy(() => import('../pages/__DevMapCheck')); // TEMP: remove after map verification

// Patient pages (lazy-loaded)
const PatientDashboard = lazy(() => import('../pages/patient/Dashboard'));
const HospitalWorkspace = lazy(() => import('../pages/patient/HospitalWorkspace'));
const DoctorBooking = lazy(() => import('../pages/patient/DoctorBooking'));
const AppointmentConfirmation = lazy(() => import('../pages/patient/AppointmentConfirmation'));
const LiveQueue = lazy(() => import('../pages/patient/LiveQueue'));
const Passport = lazy(() => import('../pages/patient/Passport'));
const MedicalTimeline = lazy(() => import('../pages/patient/MedicalTimeline'));
const EmergencyTracking = lazy(() => import('../pages/patient/EmergencyTracking'));
// Health Hub + Wellness modules
const HealthHub = lazy(() => import('../pages/patient/HealthHub'));
const PhysicalHealth = lazy(() => import('../pages/patient/PhysicalHealth'));
// Mental Wellness module (Option C full-merge — 3 sub-routes + shared layout)
const MentalWellnessLayout  = lazy(() => import('../pages/patient/MentalWellnessLayout'));
const WellnessHome          = lazy(() => import('../pages/patient/WellnessHome'));
const WellnessCompanion     = lazy(() => import('../pages/patient/WellnessCompanion'));
const WellnessJourney       = lazy(() => import('../pages/patient/WellnessJourney'));
// Phase 16: Online Consultation
const WaitingRoom = lazy(() => import('../pages/patient/WaitingRoom'));
const VideoConsultation = lazy(() => import('../pages/patient/VideoConsultation'));

// Admin pages (lazy-loaded)
const HospitalAdminDashboard = lazy(() => import('../pages/admin/Dashboard'));

// Doctor pages (lazy-loaded)
const DoctorDashboard = lazy(() => import('../pages/doctor/Dashboard'));
const DoctorQueue = lazy(() => import('../pages/doctor/Queue'));
const ConsultationScreen = lazy(() => import('../pages/doctor/ConsultationScreen'));
const PatientProfileView = lazy(() => import('../pages/doctor/PatientProfileView'));
// Phase 16: Online Consultation
const DoctorVideoConsultation = lazy(() => import('../pages/doctor/DoctorVideoConsultation'));

// Lab pages (lazy-loaded)
const LabDashboard = lazy(() => import('../pages/lab/Dashboard'));

// Pharmacy pages (lazy-loaded)
const PharmacyDashboard = lazy(() => import('../pages/pharmacy/Dashboard'));

// Driver pages (lazy-loaded)
const AmbulanceDashboard = lazy(() => import('../pages/driver/Dashboard'));

// Super Admin pages (lazy-loaded)
const SuperAdminDashboard = lazy(() => import('../pages/superadmin/Dashboard'));

// Shown while a route's chunk is in flight.
const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600" />
  </div>
);

// ── AppRouter ─────────────────────────────────────────────────────────────
const AppRouter = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
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

        {/* ── Patient Health Hub entry point ────────────────────── */}
        <Route path="/health-hub" element={<HealthHub />} />
        <Route path="/health-hub/hospital-care" element={<Navigate to="/patient/dashboard" replace />} />
        <Route path="/health-hub/physical-health" element={<PhysicalHealth />} />
        <Route path="/physical-wellness" element={<Navigate to="/health-hub/physical-health" replace />} />

        {/* ── Mental Wellness module — nested sub-routes ───────── */}
        {/* MentalWellnessLayout renders: AmbientBackground + MWNavigation + <Outlet /> */}
        <Route path="/health-hub/mental-wellness" element={<MentalWellnessLayout />}>
          <Route index element={<WellnessHome />} />
          <Route path="companion" element={<WellnessCompanion />} />
          <Route path="journey"   element={<WellnessJourney />} />
        </Route>

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
    </Suspense>
  );
};

export default AppRouter;
