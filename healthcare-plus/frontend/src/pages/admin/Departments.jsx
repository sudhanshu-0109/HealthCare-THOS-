import { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import * as adminService from '../../services/admin.service';
import useAuthStore from '../../store/authStore';

const Departments = () => {
  const { user } = useAuthStore();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');

  const fetchDepartments = async () => {
    try {
      const res = await adminService.getDepartments(user?.hospitalId);
      setDepartments(res.data || res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminService.createDepartment({ name });
      setShowModal(false);
      setName('');
      fetchDepartments();
    } catch (e) {
      alert(e.response?.data?.message || 'Error creating department');
    }
  };

  if (loading) return <div>Loading departments...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Departments</h1>
        <Button onClick={() => setShowModal(true)}>Add Department</Button>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {departments.map(d => (
              <tr key={d.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{d.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${d.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {d.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr><td colSpan="2" className="px-6 py-4 text-center text-sm text-gray-500">No departments found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Department</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Department Name</label>
                <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setShowModal(false)} type="button">Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
