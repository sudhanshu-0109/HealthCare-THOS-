/**
 * pages/patient/HospitalWorkspace.jsx — Patient's view inside a hospital.
 * Sidebar: Doctors, Appointments, and stubs for Pharmacy/Lab/Billing/Notifications.
 * Main: Department tabs + doctor listing with Book button.
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Users, Calendar, Pill, FlaskConical, Receipt, Bell, ArrowLeft,
  Search, Star, Stethoscope, Clock, BookOpen, ChevronRight, Loader2
} from 'lucide-react';
import api from '../../services/api';
import * as appointmentsService from '../../services/appointments.service';
import DoctorBooking from './DoctorBooking';

const NAV = [
  { id: 'doctors', label: 'Doctors', icon: Users },
  { id: 'appointments', label: 'My Appointments', icon: Calendar },
  { id: 'pharmacy', label: 'Pharmacy', icon: Pill, comingSoon: true },
  { id: 'lab', label: 'Laboratory', icon: FlaskConical, comingSoon: true },
  { id: 'billing', label: 'Billing', icon: Receipt, comingSoon: true },
];

export default function HospitalWorkspace() {
  const { hospitalId } = useParams();
  const navigate = useNavigate();

  const [activeNav, setActiveNav] = useState('doctors');
  const [hospital, setHospital] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Load hospital + departments
  useEffect(() => {
    Promise.all([
      api.get(`/hospitals/${hospitalId}`),
      api.get(`/departments?hospitalId=${hospitalId}`),
    ]).then(([h, d]) => {
      setHospital(h.data || h);
      const depts = d.data || d || [];
      setDepartments(depts);
      if (depts.length > 0) setSelectedDept(depts[0].id);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [hospitalId]);

  // Load doctors when department changes
  useEffect(() => {
    if (!selectedDept || activeNav !== 'doctors') return;
    setLoadingDoctors(true);
    api.get(`/doctors?hospitalId=${hospitalId}&departmentId=${selectedDept}`)
      .then((res) => setDoctors(res.data || res || []))
      .catch(() => setDoctors([]))
      .finally(() => setLoadingDoctors(false));
  }, [selectedDept, hospitalId, activeNav]);

  // Load appointments
  useEffect(() => {
    if (activeNav !== 'appointments') return;
    appointmentsService.getMyAppointments({ limit: 20 })
      .then((res) => {
        const apptsData = res.data?.appointments || res.data || [];
        setAppointments(Array.isArray(apptsData) ? apptsData : apptsData.appointments || []);
      })
      .catch(() => setAppointments([]));
  }, [activeNav]);

  if (selectedDoctor) {
    return <DoctorBooking doctor={selectedDoctor} />;
  }

  const filteredDoctors = doctors.filter((d) =>
    !search || d.user?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-100 flex-shrink-0 flex flex-col">
        <div className="h-14 flex items-center gap-2 px-4 border-b border-slate-100">
          <button onClick={() => navigate('/patient/dashboard')} className="text-slate-400 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-slate-700 truncate">{hospital?.name}</span>
        </div>
        <nav className="flex-1 py-3 space-y-1 px-2">
          {NAV.map(({ id, label, icon: Icon, comingSoon }) => (
            <button
              key={id}
              onClick={() => !comingSoon && setActiveNav(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeNav === id && !comingSoon
                  ? 'bg-cyan-50 text-cyan-700'
                  : comingSoon
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
              {comingSoon && <span className="ml-auto text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-medium">Soon</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {activeNav === 'doctors' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-900">Find a Doctor</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search doctors…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 w-52"
                />
              </div>
            </div>

            {/* Department tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDept(dept.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedDept === dept.id
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-cyan-300 hover:text-cyan-600'
                  }`}
                >
                  {dept.name}
                </button>
              ))}
            </div>

            {/* Doctor list */}
            {loadingDoctors ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading doctors…
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No doctors found in this department</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredDoctors.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-cyan-500/20">
                        {(doc.user?.fullName || 'D')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">{doc.user?.fullName}</p>
                        <p className="text-xs text-cyan-600 font-medium flex items-center gap-1">
                          <Stethoscope className="w-3 h-3" /> {doc.specialization}
                        </p>
                        {doc.averageRating > 0 && (
                          <p className="text-xs text-amber-500 flex items-center gap-1 mt-0.5">
                            <Star className="w-3 h-3 fill-amber-400 stroke-amber-500" />
                            {doc.averageRating.toFixed(1)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">₹{Number(doc.consultationFee).toLocaleString('en-IN')}</p>
                        <p className="text-xs text-slate-400">per visit</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {doc.experienceYears}y experience
                      </div>
                      <button
                        onClick={() => setSelectedDoctor(doc)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold transition-colors"
                      >
                        Book Appointment <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeNav === 'appointments' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-5">My Appointments</h2>
            {appointments.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No appointments yet</p>
                <button onClick={() => setActiveNav('doctors')} className="mt-3 text-cyan-600 text-sm hover:underline">Browse doctors</button>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => (
                  <Link
                    key={appt.id}
                    to={`/appointments/${appt.id}/queue`}
                    className="flex items-center justify-between bg-white rounded-xl border border-slate-100 px-4 py-3 hover:border-cyan-200 transition-colors no-underline"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{appt.doctor?.user?.fullName}</p>
                      <p className="text-xs text-slate-400">{new Date(appt.scheduledDate).toLocaleDateString('en-IN')} · {appt.scheduledTime}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                      appt.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' :
                      appt.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' :
                      appt.status === 'CANCELLED' ? 'bg-red-50 text-red-600' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {appt.status.replace('_', ' ')}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
