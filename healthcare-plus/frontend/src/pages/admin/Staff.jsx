import { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import * as adminService from '../../services/admin.service';

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '', email: '', role: 'RECEPTIONIST'
  });

  const fetchStaff = async () => {
    try {
      const res = await adminService.getStaff();
      setStaff(res.data || res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminService.inviteStaff(formData);
      setShowModal(false);
      setFormData({ fullName: '', email: '', role: 'RECEPTIONIST' });
      fetchStaff();
    } catch (e) {
      alert(e.response?.data?.message || 'Error inviting staff');
    }
  };

  if (loading) return <div>Loading staff...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Hospital Staff</h1>
        <Button onClick={() => setShowModal(true)}>Invite Staff</Button>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staff.map(s => (
              <tr key={s.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.fullName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr><td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No staff found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Invite Staff Member</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input type="email" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="PHARMACIST">Pharmacist</option>
                  <option value="LAB_STAFF">Lab Staff</option>
                  <option value="AMBULANCE_DRIVER">Ambulance Driver</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setShowModal(false)} type="button">Cancel</Button>
                <Button type="submit">Send Invite</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
