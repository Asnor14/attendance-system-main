import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import { studentsAPI } from '../api/students';
import { MdAdd, MdEdit, MdDelete, MdPerson } from 'react-icons/md';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', student_id: '', course: '', rfid_uid: '' });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { setStudents(await studentsAPI.getAll()); } catch(e){} finally { setLoading(false); } };
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    await studentsAPI.create(formData); 
    setShowModal(false); loadData(); 
    Swal.fire({ icon: 'success', title: 'Saved!', timer: 1500, showConfirmButton: false, background: '#FFE7D0', color: '#1B1B1B' });
  };
  
  const handleDelete = async (id) => {
    if ((await Swal.fire({ title: 'Delete Student?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#FC6E20', cancelButtonColor: '#323232', background: '#FFE7D0', color: '#1B1B1B' })).isConfirmed) {
      await studentsAPI.delete(id); loadData();
      Swal.fire({ icon: 'success', title: 'Deleted', timer: 1500, showConfirmButton: false, background: '#FFE7D0', color: '#1B1B1B' });
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="p-2">
      <div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-bold text-brand-dark">Students</h1><button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-brand-orange text-white px-4 py-2 rounded-lg hover:bg-brand-orange/90 shadow-lg"><MdAdd size={20} /> Add Student</button></div>
      
      {students.length === 0 ? (
        <div className="col-span-full py-16 text-center bg-white rounded-2xl border-2 border-dashed border-brand-orange/30">
          <div className="w-16 h-16 bg-brand-beige rounded-full flex items-center justify-center mx-auto mb-4"><MdPerson className="text-3xl text-brand-orange" /></div>
          <h3 className="text-lg font-semibold text-brand-dark">No students found</h3>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-brand-charcoal text-brand-beige"><tr><th className="p-4">Name</th><th className="p-4">ID</th><th className="p-4">Course</th><th className="p-4">RFID</th><th className="p-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-brand-charcoal/10">
               {students.map(s => (
                 <tr key={s.id} className="hover:bg-brand-beige/20 transition-colors">
                   <td className="p-4 font-medium text-brand-dark flex items-center gap-3"><div className="p-2 bg-brand-beige text-brand-orange rounded-full"><MdPerson/></div>{s.full_name}</td>
                   <td className="p-4 text-brand-charcoal/70 font-mono text-sm">{s.student_id}</td>
                   <td className="p-4">{s.course}</td>
                   <td className="p-4"><span className="bg-brand-beige text-brand-charcoal px-2 py-1 rounded text-xs font-mono">{s.rfid_uid || 'None'}</span></td>
                   <td className="p-4 flex gap-2"><button className="text-red-500 hover:bg-red-50 p-2 rounded" onClick={() => handleDelete(s.id)}><MdDelete /></button></td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      )}
      
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
             <h2 className="text-xl font-bold text-brand-dark mb-4">Add Student</h2>
             <form onSubmit={handleSubmit} className="space-y-4">
               <input className="w-full p-3 border rounded-lg" placeholder="Full Name" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
               <input className="w-full p-3 border rounded-lg" placeholder="Student ID" value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})} required />
               <input className="w-full p-3 border rounded-lg" placeholder="Course" value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} required />
               <input className="w-full p-3 border rounded-lg" placeholder="RFID (Optional)" value={formData.rfid_uid} onChange={e => setFormData({...formData, rfid_uid: e.target.value})} />
               <div className="flex gap-3 pt-2">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-brand-beige text-brand-charcoal rounded-lg">Cancel</button>
                 <button type="submit" className="flex-1 py-3 bg-brand-orange text-white rounded-lg font-bold">Save</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};
export default Students;