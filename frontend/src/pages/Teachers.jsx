import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import { teachersAPI } from '../api/teachers';
import { MdAdd, MdEdit, MdDelete, MdPerson, MdBadge, MdEmail, MdSchool, MdVisibility, MdClose } from 'react-icons/md';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  
  // View State
  const [viewingTeacher, setViewingTeacher] = useState(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    teacher_id: '',
    rfid_uid: ''
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const data = await teachersAPI.getAll();
      setTeachers(data);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await teachersAPI.update(editingTeacher.id, formData);
        Swal.fire({ icon: 'success', title: 'Updated', timer: 1500, showConfirmButton: false, background: '#FFE7D0', color: '#1B1B1B' });
      } else {
        await teachersAPI.create(formData);
        Swal.fire({ icon: 'success', title: 'Created', text: 'Credentials sent via email.', background: '#FFE7D0', color: '#1B1B1B', confirmButtonColor: '#FC6E20' });
      }
      fetchTeachers();
      setShowModal(false);
      resetForm();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.error, background: '#FFE7D0', color: '#1B1B1B', confirmButtonColor: '#FC6E20' });
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      full_name: teacher.full_name,
      email: teacher.email || '',
      teacher_id: teacher.username,
      rfid_uid: teacher.rfid_uid || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete?',
      showCancelButton: true,
      confirmButtonColor: '#FC6E20',
      cancelButtonColor: '#323232',
      background: '#FFE7D0',
      color: '#1B1B1B'
    });
    if (result.isConfirmed) {
      await teachersAPI.delete(id);
      fetchTeachers();
      Swal.fire({ icon: 'success', title: 'Deleted', timer: 1500, showConfirmButton: false, background: '#FFE7D0', color: '#1B1B1B' });
    }
  };

  const resetForm = () => {
    setFormData({ full_name: '', email: '', teacher_id: '', rfid_uid: '' });
    setEditingTeacher(null);
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin h-8 w-8 border-4 border-brand-orange rounded-full border-t-transparent"></div></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="p-2 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-brand-dark">Faculty</h1>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 bg-brand-orange text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-orange/90 transition-all shadow-lg">
          <MdAdd size={24} /> Add Teacher
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {teachers.map((t) => (
          <div key={t.id} className="bg-white p-6 rounded-2xl shadow-md border border-brand-orange/20 hover:shadow-xl transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-brand-beige text-brand-orange rounded-full"><MdPerson size={24} /></div>
              <div>
                <h3 className="font-bold text-brand-dark text-lg">{t.full_name}</h3>
                <p className="text-sm text-brand-charcoal/70">@{t.username}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-brand-charcoal/80 mb-6">
              <div className="flex items-center gap-2"><MdEmail className="text-brand-orange"/> {t.email}</div>
              <div className="flex items-center gap-2"><MdBadge className="text-brand-orange"/> {t.rfid_uid || 'No RFID'}</div>
            </div>
            <div className="flex gap-2 pt-4 border-t border-brand-beige">
              <button onClick={() => setViewingTeacher(t)} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors flex justify-center items-center gap-1"><MdVisibility/> View</button>
              <button onClick={() => handleEdit(t)} className="flex-1 py-2 bg-brand-beige text-brand-dark rounded-lg hover:bg-brand-orange/20 font-medium transition-colors flex justify-center items-center gap-1"><MdEdit/> Edit</button>
              <button onClick={() => handleDelete(t.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"><MdDelete size={20}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-brand-dark px-6 py-4"><h2 className="text-xl font-bold text-brand-beige">{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input required className="w-full p-3 border rounded-lg" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="Full Name" />
              <input type="email" required className="w-full p-3 border rounded-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email" />
              <input required className="w-full p-3 border rounded-lg" value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})} placeholder="Teacher ID" disabled={!!editingTeacher} />
              <input className="w-full p-3 border rounded-lg" value={formData.rfid_uid} onChange={e => setFormData({...formData, rfid_uid: e.target.value})} placeholder="RFID UID (Optional)" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-brand-orange text-white rounded-lg font-bold">Save</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewingTeacher && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
            <button onClick={() => setViewingTeacher(null)} className="absolute top-4 right-4 text-white/80 hover:text-white z-10"><MdClose size={24}/></button>
            <div className="bg-brand-orange h-32 flex items-center justify-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl font-bold text-brand-orange shadow-lg border-4 border-white/20">
                {viewingTeacher.full_name.charAt(0)}
              </div>
            </div>
            <div className="p-8 text-center space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-brand-dark">{viewingTeacher.full_name}</h2>
                <p className="text-brand-charcoal/60 font-mono">@{viewingTeacher.username}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-left bg-brand-beige/30 p-4 rounded-xl border border-brand-orange/10">
                <div><label className="text-xs text-brand-charcoal/50 uppercase font-bold">Email</label><p className="text-sm font-medium truncate">{viewingTeacher.email}</p></div>
                <div><label className="text-xs text-brand-charcoal/50 uppercase font-bold">RFID</label><p className="text-sm font-medium font-mono">{viewingTeacher.rfid_uid || 'N/A'}</p></div>
                <div><label className="text-xs text-brand-charcoal/50 uppercase font-bold">Joined</label><p className="text-sm font-medium">{new Date(viewingTeacher.created_at).toLocaleDateString()}</p></div>
                <div><label className="text-xs text-brand-charcoal/50 uppercase font-bold">Role</label><p className="text-sm font-medium capitalize">Teacher</p></div>
              </div>
              <button onClick={() => setViewingTeacher(null)} className="w-full py-3 bg-brand-dark text-white rounded-xl font-bold hover:bg-brand-charcoal">Close</button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Teachers;