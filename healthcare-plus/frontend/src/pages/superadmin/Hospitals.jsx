import { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import * as adminService from '../../services/admin.service';

const Hospitals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // form state
  const [formData, setFormData] = useState({
    name: '', address: '', city: '', contactPhone: '', contactEmail: '', latitude: 0, longitude: 0, adminName: '', adminEmail: ''
  });

  const fetchHospitals = async () => {
    try {
      const res = await adminService.getHospitals();
      setHospitals(res.data || res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHospitals(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminService.createHospital({ ...formData, latitude: parseFloat(formData.latitude), longitude: parseFloat(formData.longitude) });
      setShowModal(false);
      fetchHospitals();
    } catch (e) {
      alert(e.response?.data?.message || 'Error creating hospital');
    }
  };

  if (loading) return <div>Loading hospitals...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Hospitals</h1>
        <Button onClick={() => setShowModal(true)}>Add Hospital</Button>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {hospitals.map(h => (
              <tr key={h.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{h.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{h.city}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${h.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {h.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
            {hospitals.length === 0 && (
              <tr><td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">No hospitals found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Hospital</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Hospital Name</label>
                <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                  <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                <input type="email" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Latitude</label>
                  <input type="number" step="any" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Longitude</label>
                  <input type="number" step="any" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} />
                </div>
              </div>
              <hr />
              <h3 className="font-semibold text-gray-700">Initial Hospital Admin (Optional)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Admin Name</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" value={formData.adminName} onChange={e => setFormData({...formData, adminName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Admin Email</label>
                  <input type="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setShowModal(false)} type="button">Cancel</Button>
                <Button type="submit">Save Hospital</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hospitals;
