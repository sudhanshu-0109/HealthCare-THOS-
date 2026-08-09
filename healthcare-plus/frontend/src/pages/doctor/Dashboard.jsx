import { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, Users } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import TodayQueueWidget from '../../components/dashboard/doctor/TodayQueueWidget';
import ConsultationHistoryWidget from '../../components/dashboard/doctor/ConsultationHistoryWidget';
import PendingLabsWidget from '../../components/dashboard/doctor/PendingLabsWidget';
import api from '../../services/api';

const NAV_ITEMS = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'appointments', icon: Calendar, label: 'Appointments' },
  { id: 'patients', icon: Users, label: 'Patients' },
];

export default function DoctorDashboard() {
  const [activeItem, setActiveItem] = useState('overview');
  const [doctorProfile, setDoctorProfile] = useState(null);

  useEffect(() => {
    api.get('/doctors/me').then(res => {
      setDoctorProfile(res.data || res);
    }).catch(console.error);
  }, []);

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      activeItem={activeItem}
      setActiveItem={setActiveItem}
      roleLabel="Doctor"
      roleColor="from-cyan-500 to-teal-600"
    >
      <div className="flex flex-col gap-6 max-w-7xl mx-auto h-full">
        
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-teal-700 rounded-2xl p-8 text-white shadow-md">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {doctorProfile ? `Dr. ${doctorProfile.user.fullName.split(' ')[0]}` : 'Doctor'}
          </h1>
          <p className="text-cyan-100 max-w-xl">
            You have a busy day ahead. Check your live queue and upcoming appointments.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          
          {/* Main Column - Queue (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col min-h-[500px]">
            <TodayQueueWidget />
          </div>
          
          {/* Side Column - History & Labs (1/3 width) */}
          <div className="flex flex-col gap-6 min-h-[500px]">
            <div className="flex-1 min-h-[250px]">
              <ConsultationHistoryWidget />
            </div>
            <div className="flex-1 min-h-[250px]">
              <PendingLabsWidget />
            </div>
          </div>
          
        </div>
      </div>
    </DashboardShell>
  );
}
