import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import { studentsAPI } from '../api/students';
import { 
  MdAdd, MdEdit, MdDelete, MdPerson, MdVisibility, 
  MdClose, MdSchool, MdBadge, MdCreditCard 
} from 'react-icons/md';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);

  const [formData, setFormData] = useState({ 
    full_name: '', 
    student_id: '', 
    course: '', 
    rfid_uid: '',
    enrolled_subjects: '' 
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => { 
    try { 
      setStudents(await studentsAPI.getAll()); 
    } catch(e) {
      console.error(e);
    } finally { 
      setLoading(false); 
    } 
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      full_name: student.full_name,
      student_id: student.student_id,
      course: student.course,
      rfid_uid: student.rfid_uid || '',
      enrolled_subjects: student.enrolled_subjects || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    try {
      if (editingStudent) {
        await studentsAPI.update(editingStudent.id, formData);
        Swal.fire({ icon: 'success', title: 'Updated!', timer: 1500, showConfirmButton: false, background: '#FFE7D0', color: '#1B1B1B' });
      } else {
        await studentsAPI.create(formData);
        Swal.fire({ icon: 'success', title: 'Saved!', timer: 1500, showConfirmButton: false, background: '#FFE7D0', color: '#1B1B1B' });
      }
      setShowModal(false); 
      resetForm();
      loadData(); 
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.error || 'Failed to save', background: '#FFE7D0', color: '#1B1B1B', confirmButtonColor: '#FC6E20' });
    }
  };
  
  const handleDelete = async (id) => {
    if ((await Swal.fire({ title: 'Delete Student?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#FC6E20', cancelButtonColor: '#323232', background: '#FFE7D0', color: '#1B1B1B' })).isConfirmed) {
      try {
        await studentsAPI.delete(id); 
        loadData();
        Swal.fire({ icon: 'success', title: 'Deleted', timer: 1500, showConfirmButton: false, background: '#FFE7D0', color: '#1B1B1B' });
      } catch (error) {
        Swal.fire('Error', 'Failed to delete student', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({ full_name: '', student_id: '', course: '', rfid_uid: '', enrolled_subjects: '' });
    setEditingStudent(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="p-2 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-brand-dark">Students</h1>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 bg-brand-orange text-white px-4 py-2 rounded-lg hover:bg-brand-orange/90 shadow-lg transition-all">
          <MdAdd size={20} /> <span className="hidden sm:inline">Add Student</span><span className="sm:hidden">Add</span>
        </button>
      </div>
      
      {students.length === 0 ? (
        <div className="col-span-full py-16 text-center bg-white rounded-2xl border-2 border-dashed border-brand-orange/30">
          <div className="w-16 h-16 bg-brand-beige rounded-full flex items-center justify-center mx-auto mb-4"><MdPerson className="text-3xl text-brand-orange" /></div>
          <h3 className="text-lg font-semibold text-brand-dark">No students found</h3>
        </div>
      ) : (
        <>
          {/* --- DESKTOP VIEW (Table) --- */}
          <div className="hidden sm:block bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-brand-charcoal text-brand-beige">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">ID</th>
                  <th className="p-4 hidden md:table-cell">Course</th>
                  <th className="p-4 hidden lg:table-cell">RFID</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-charcoal/10">
                 {students.map(s => (
                   <tr key={s.id} className="hover:bg-brand-beige/20 transition-colors">
                     <td className="p-4 font-medium text-brand-dark flex items-center gap-3">
                       {s.face_image_url ? (
                         <img src={s.face_image_url} alt="Face" className="w-10 h-10 rounded-full object-cover border border-brand-orange/30" />
                       ) : (
                         <div className="p-2 bg-brand-beige text-brand-orange rounded-full"><MdPerson/></div>
                       )}
                       <span className="truncate">{s.full_name}</span>
                     </td>
                     <td className="p-4 text-brand-charcoal/70 font-mono text-sm">{s.student_id}</td>
                     <td className="p-4 hidden md:table-cell">{s.course}</td>
                     <td className="p-4 hidden lg:table-cell">
                       {s.rfid_uid ? <span className="bg-brand-beige text-brand-charcoal px-2 py-1 rounded text-xs font-mono">{s.rfid_uid}</span> : <span className="text-gray-400 text-xs">None</span>}
                     </td>
                     <td className="p-4 flex justify-center gap-2">
                       <button onClick={() => setViewingStudent(s)} className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"><MdVisibility size={20}/></button>
                       <button onClick={() => handleEdit(s)} className="p-2 text-brand-charcoal bg-brand-beige hover:bg-brand-orange/20 rounded-lg transition-colors"><MdEdit size={20}/></button>
                       <button onClick={() => handleDelete(s.id)} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><MdDelete size={20}/></button>
                     </td>
                   </tr>
                 ))}
              </tbody>
            </table>
          </div>

          {/* --- MOBILE VIEW (Cards) --- */}
          <div className="sm:hidden grid grid-cols-1 gap-4">
            {students.map(s => (
              <div key={s.id} className="bg-white p-4 rounded-xl shadow-md border border-brand-orange/10 flex flex-col gap-3">
                <div className="flex items-center gap-3 border-b border-brand-beige/50 pb-3">
                   {s.face_image_url ? (
                     <img src={s.face_image_url} alt="Face" className="w-12 h-12 rounded-full object-cover border border-brand-orange/30" />
                   ) : (
                     <div className="p-3 bg-brand-beige text-brand-orange rounded-full"><MdPerson size={20}/></div>
                   )}
                   <div>
                     <h3 className="font-bold text-brand-dark">{s.full_name}</h3>
                     <p className="text-xs text-brand-charcoal/60 font-mono">{s.student_id}</p>
                   </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                   <div className="flex items-center gap-2">
                      <span className="bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded text-xs font-bold">{s.course}</span>
                      {s.rfid_uid && <MdCreditCard className="text-brand-charcoal/40" />}
                   </div>
                   <div className="flex gap-1">
                      <button onClick={() => setViewingStudent(s)} className="p-2 text-blue-600 bg-blue-50 rounded-lg"><MdVisibility/></button>
                      <button onClick={() => handleEdit(s)} className="p-2 text-brand-dark bg-brand-beige rounded-lg"><MdEdit/></button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 text-red-600 bg-red-50 rounded-lg"><MdDelete/></button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
             <div className="bg-brand-dark px-6 py-4">
               <h2 className="text-xl font-bold text-brand-beige">{editingStudent ? 'Edit Student' : 'Add Student'}</h2>
             </div>
             <form onSubmit={handleSubmit} className="p-6 space-y-4">
               <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                 <input className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-orange outline-none" placeholder="e.g. Juan Dela Cruz" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
               </div>
               <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Student ID</label>
                 <input className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-orange outline-none font-mono" placeholder="00-0000" value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})} required disabled={!!editingStudent} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase">Course</label>
                   <input className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-orange outline-none" placeholder="BSIT" value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} required />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase">RFID UID</label>
                   <input className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-orange outline-none font-mono" placeholder="Optional" value={formData.rfid_uid} onChange={e => setFormData({...formData, rfid_uid: e.target.value})} />
                 </div>
               </div>
               <div className="flex gap-3 pt-4">
                 <button type="button" onClick={closeModal} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                 <button type="submit" className="flex-1 py-3 bg-brand-orange text-white rounded-lg font-bold hover:bg-brand-orange/90 transition-colors shadow-lg">Save</button>
               </div>
             </form>
          </motion.div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative">
            <button onClick={() => setViewingStudent(null)} className="absolute top-3 right-3 text-white/80 hover:text-white z-10 bg-black/20 rounded-full p-1"><MdClose size={20}/></button>
            
            {/* Header Image */}
            <div className="h-32 bg-gradient-to-r from-brand-charcoal to-brand-dark flex items-center justify-center relative">
              {viewingStudent.face_image_url ? (
                <img src={viewingStudent.face_image_url} alt="Face" className="w-full h-full object-cover opacity-50" />
              ) : (
                <MdPerson className="text-6xl text-white/20" />
              )}
              <div className="absolute -bottom-10">
                {viewingStudent.face_image_url ? (
                  <img src={viewingStudent.face_image_url} alt="Profile" className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white" />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-brand-orange flex items-center justify-center text-4xl font-bold text-white">
                    {viewingStudent.full_name.charAt(0)}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-12 pb-8 px-6 text-center space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-brand-dark">{viewingStudent.full_name}</h2>
                <p className="text-brand-charcoal/60 font-mono text-sm">{viewingStudent.student_id}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left bg-brand-beige/20 p-4 rounded-xl border border-brand-orange/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-orange uppercase"><MdSchool/> Course</div>
                  <p className="text-sm font-semibold text-brand-dark">{viewingStudent.course}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-orange uppercase"><MdBadge/> Status</div>
                  <p className="text-sm font-semibold text-green-600">Active</p>
                </div>
                <div className="col-span-2 space-y-1 pt-2 border-t border-brand-charcoal/5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-orange uppercase"><MdCreditCard/> RFID UID</div>
                  <p className="text-sm font-mono bg-white p-2 rounded border border-brand-charcoal/10 text-center text-brand-charcoal">
                    {viewingStudent.rfid_uid || 'Not Assigned'}
                  </p>
                </div>
              </div>

              <button onClick={() => setViewingStudent(null)} className="w-full py-3 bg-brand-dark text-white rounded-xl font-bold hover:bg-brand-charcoal transition-colors">
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
export default Students;