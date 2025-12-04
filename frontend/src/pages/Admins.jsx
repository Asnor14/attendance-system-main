import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import { adminsAPI } from '../api/admins';
import { useAuth } from '../context/AuthContext';
import { MdAdd, MdDelete, MdPerson, MdEmail, MdSecurity, MdLock, MdEdit, MdVisibility, MdClose, MdBadge } from 'react-icons/md';

const Admins = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [viewingAdmin, setViewingAdmin] = useState(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    current_password: '', // Needed for creation
    password: '' // Needed for update (optional reset)
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const data = await adminsAPI.getAll();
      setAdmins(data);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      full_name: admin.full_name,
      email: admin.email,
      username: admin.username,
      password: '', // Leave blank unless resetting
      current_password: '' // Not used for update
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Logic for UPDATE
    if (editingAdmin) {
      try {
        await adminsAPI.update(editingAdmin.id, {
          full_name: formData.full_name,
          email: formData.email,
          username: formData.username,
          password: formData.password // Optional
        });
        Swal.fire({ icon: 'success', title: 'Admin Updated', timer: 1500, showConfirmButton: false, background: '#FFE7D0', color: '#1B1B1B' });
        fetchAdmins();
        closeModal();
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Update Failed', text: error.response?.data?.error, background: '#FFE7D0', color: '#1B1B1B', confirmButtonColor: '#FC6E20' });
      }
      return;
    }

    // Logic for CREATE (Existing)
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Create Admin Access?',
      text: 'This will grant full system access. Confirm details?',
      showCancelButton: true,
      confirmButtonText: 'Yes, Create',
      background: '#FFE7D0',
      color: '#1B1B1B',
      confirmButtonColor: '#FC6E20',
      cancelButtonColor: '#323232',
    });

    if (!result.isConfirmed) return;

    try {
      await adminsAPI.create(formData);
      await Swal.fire({ icon: 'success', title: 'Admin Created', text: `Credentials sent to ${formData.email}`, background: '#FFE7D0', color: '#1B1B1B', confirmButtonColor: '#FC6E20' });
      fetchAdmins();
      closeModal();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Failed', text: error.response?.data?.error, background: '#FFE7D0', color: '#1B1B1B', confirmButtonColor: '#FC6E20' });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAdmin(null);
    setFormData({ full_name: '', email: '', username: '', current_password: '', password: '' });
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({ icon: 'warning', title: 'Revoke Access?', showCancelButton: true, confirmButtonColor: '#FC6E20', background: '#FFE7D0', color: '#1B1B1B' });
    if (result.isConfirmed) {
      try {
        await adminsAPI.delete(id);
        fetchAdmins();
        Swal.fire({ icon: 'success', title: 'Removed', background: '#FFE7D0', color: '#1B1B1B' });
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.error, background: '#FFE7D0', color: '#1B1B1B' });
      }
    }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin h-8 w-8 border-4 border-brand-orange rounded-full border-t-transparent"></div></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="p-2 space-y-8">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-brand-dark">Admins</h1><p className="text-brand-charcoal/70">Manage system administrators</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-brand-orange text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-brand-orange/90 transition-all"><MdAdd size={24} /> Add Admin</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admins.map((admin) => (
          <div key={admin.id} className="bg-white p-6 rounded-xl shadow-md border border-brand-orange/20 hover:shadow-lg transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-brand-charcoal text-brand-beige rounded-full"><MdSecurity size={24} /></div>
              <div><h3 className="font-bold text-brand-dark">{admin.full_name}</h3><p className="text-xs text-brand-charcoal/60 font-mono">@{admin.username}</p></div>
            </div>
            <div className="text-sm text-brand-charcoal/80 mb-6 flex items-center gap-2"><MdEmail className="text-brand-orange" /> {admin.email}</div>
            
            <div className="flex gap-2 pt-4 border-t border-brand-beige">
               <button onClick={() => setViewingAdmin(admin)} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors flex justify-center items-center gap-1"><MdVisibility/> View</button>
               
               {admin.id !== user?.id && (
                 <>
                   <button onClick={() => handleEdit(admin)} className="flex-1 py-2 bg-brand-beige text-brand-dark rounded-lg hover:bg-brand-orange/20 font-medium transition-colors flex justify-center items-center gap-1"><MdEdit/> Edit</button>
                   <button onClick={() => handleDelete(admin.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"><MdDelete size={20}/></button>
                 </>
               )}
               {admin.id === user?.id && <div className="flex-1 py-2 text-center text-xs text-brand-charcoal/40 italic bg-brand-beige/20 rounded-lg">(You)</div>}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-brand-charcoal px-6 py-4"><h2 className="text-xl font-bold text-brand-beige">{editingAdmin ? 'Edit Admin' : 'Grant Access'}</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input required className="w-full p-3 border rounded-lg" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="Full Name" />
              <input type="email" required className="w-full p-3 border rounded-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email" />
              <input required className="w-full p-3 border rounded-lg font-mono" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="Username" />
              
              {editingAdmin ? (
                 <div className="pt-2 border-t border-gray-100">
                    <label className="text-xs font-bold text-gray-400 uppercase">Reset Password (Optional)</label>
                    <input type="password" className="w-full p-3 border rounded-lg mt-1" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="New Password" />
                 </div>
              ) : (
                 <div className="pt-4 mt-4 border-t border-brand-beige">
                    <label className="block text-sm font-bold text-brand-orange mb-1 flex items-center gap-1"><MdLock /> Confirm YOUR Password</label>
                    <input type="password" required className="w-full p-3 border-2 border-brand-orange/50 rounded-lg" value={formData.current_password} onChange={e => setFormData({...formData, current_password: e.target.value})} placeholder="Authorize Action" />
                 </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-3 bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-brand-orange text-white rounded-xl font-bold hover:bg-brand-orange/90">{editingAdmin ? 'Update' : 'Grant Access'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewingAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
            <button onClick={() => setViewingAdmin(null)} className="absolute top-4 right-4 text-white/80 hover:text-white z-10"><MdClose size={24}/></button>
            <div className="bg-brand-charcoal h-32 flex items-center justify-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl font-bold text-brand-charcoal shadow-lg border-4 border-white/20">
                <MdSecurity />
              </div>
            </div>
            <div className="p-8 text-center space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-brand-dark">{viewingAdmin.full_name}</h2>
                <p className="text-brand-charcoal/60 font-mono">@{viewingAdmin.username}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-left bg-brand-beige/30 p-4 rounded-xl border border-brand-orange/10">
                <div className="col-span-2"><label className="text-xs text-brand-charcoal/50 uppercase font-bold">Email</label><p className="text-sm font-medium truncate">{viewingAdmin.email}</p></div>
                <div><label className="text-xs text-brand-charcoal/50 uppercase font-bold">Joined</label><p className="text-sm font-medium">{new Date(viewingAdmin.created_at).toLocaleDateString()}</p></div>
                <div><label className="text-xs text-brand-charcoal/50 uppercase font-bold">Role</label><p className="text-sm font-medium capitalize font-bold text-brand-orange">Admin</p></div>
              </div>
              <button onClick={() => setViewingAdmin(null)} className="w-full py-3 bg-brand-dark text-white rounded-xl font-bold hover:bg-brand-charcoal">Close</button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Admins;