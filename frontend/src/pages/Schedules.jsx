import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import { schedulesAPI } from '../api/schedules';
import { teachersAPI } from '../api/teachers';
import { studentsAPI } from '../api/students'; // 👈 Import Students API
import { useAuth } from '../context/AuthContext';
import { 
  MdAdd, MdEdit, MdDelete, MdSchedule, MdPerson, MdAccessTime, 
  MdCalendarToday, MdGroup, MdClose, MdSearch 
} from 'react-icons/md';

const daysOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Schedules = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showModal, setShowModal] = useState(false); // Add/Edit Schedule Modal
  const [showStudentsModal, setShowStudentsModal] = useState(false); // View Students Modal
  
  // Data States
  const [formData, setFormData] = useState({ subject_code: '', subject_name: '', time_start: '', time_end: '', grace_period: 0, days: [], teacher_id: '' });
  const [editingId, setEditingId] = useState(null);
  
  // Student Viewing State
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);

  useEffect(() => { 
    loadData(); 
  }, []);

  const loadData = async () => {
    try {
      setSchedules(await schedulesAPI.getAll());
      if (isAdmin) setTeachers(await teachersAPI.getAll());
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  // --- VIEW STUDENTS LOGIC ---
  const handleViewStudents = async (schedule) => {
    try {
      // 1. Get all students visible to this user
      const allStudents = await studentsAPI.getAll();
      
      // 2. Filter students who have this specific subject code
      const filtered = allStudents.filter(student => 
        student.enrolled_subjects && 
        student.enrolled_subjects.includes(schedule.subject_code)
      );

      // 3. Sort Alphabetically
      filtered.sort((a, b) => a.full_name.localeCompare(b.full_name));

      setEnrolledStudents(filtered);
      setSelectedSchedule(schedule);
      setShowStudentsModal(true);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to load student list', 'error');
    }
  };

  const handleDayToggle = (day) => {
    const days = formData.days.includes(day) ? formData.days.filter(d => d !== day) : [...formData.days, day];
    setFormData({ ...formData, days });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, days: formData.days.join(',') };
    try {
      if (editingId) await schedulesAPI.update(editingId, payload);
      else await schedulesAPI.create(payload);
      setShowModal(false); loadData(); resetForm();
      Swal.fire({ icon: 'success', title: 'Saved!', timer: 1500, showConfirmButton: false, background: '#FFE7D0', color: '#1B1B1B' });
    } catch (e) { Swal.fire('Error', 'Failed to save schedule', 'error'); }
  };

  const handleDelete = async (id) => {
    if ((await Swal.fire({ title: 'Delete Schedule?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#FC6E20', cancelButtonColor: '#323232', background: '#FFE7D0', color: '#1B1B1B' })).isConfirmed) {
      await schedulesAPI.delete(id); loadData();
      Swal.fire({ icon: 'success', title: 'Deleted', timer: 1500, showConfirmButton: false, background: '#FFE7D0', color: '#1B1B1B' });
    }
  };

  const handleEdit = (s) => {
    setEditingId(s.id);
    setFormData({ ...s, days: s.days ? s.days.split(',') : [], teacher_id: s.teacher_id || '' });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ subject_code: '', subject_name: '', time_start: '', time_end: '', grace_period: 0, days: [], teacher_id: '' });
    setEditingId(null);
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="p-2">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-brand-dark">{isAdmin ? 'Class Schedules' : 'My Classes'}</h1>
        {isAdmin && <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 bg-brand-orange text-white px-5 py-2.5 rounded-xl font-bold hover:bg-brand-orange/90 shadow-lg"><MdAdd size={20} /> Add Schedule</button>}
      </div>

      {schedules.length === 0 ? (
        <div className="col-span-full py-16 text-center bg-white rounded-2xl border-2 border-dashed border-brand-orange/30">
          <div className="w-16 h-16 bg-brand-beige rounded-full flex items-center justify-center mx-auto mb-4"><MdSchedule className="text-3xl text-brand-orange" /></div>
          <h3 className="text-lg font-semibold text-brand-dark">No schedules found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {schedules.map((s) => (
            <motion.div key={s.id} whileHover={{ y: -4 }} className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-brand-orange">
              <div className="flex justify-between items-start mb-3">
                <span className="px-2.5 py-1 bg-brand-charcoal text-brand-beige text-xs font-bold rounded-lg uppercase">{s.subject_code}</span>
                <div className="flex gap-2">
                  {/* View Students Button (For Teachers & Admins) */}
                  <button onClick={() => handleViewStudents(s)} className="text-brand-charcoal hover:text-brand-orange p-1" title="View Students">
                    <MdGroup size={22} />
                  </button>
                  {isAdmin && (
                    <>
                      <button onClick={() => handleEdit(s)} className="text-brand-charcoal hover:text-blue-600 p-1"><MdEdit size={20}/></button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600 p-1"><MdDelete size={20}/></button>
                    </>
                  )}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-brand-dark mb-2">{s.subject_name}</h3>
              
              <div className="flex items-center gap-2 text-brand-charcoal/70 text-sm mb-3">
                <MdAccessTime className="text-brand-orange" />
                <span>{s.time_start} - {s.time_end}</span>
              </div>
              
              <div className="flex gap-1 flex-wrap mb-4">
                {s.days?.split(',').map(d => (
                  <span key={d} className="text-[10px] font-bold bg-brand-beige text-brand-charcoal px-2 py-1 rounded">{d}</span>
                ))}
              </div>
              
              {isAdmin && (
                <div className="pt-4 border-t border-brand-beige/50 flex items-center gap-2 text-sm text-brand-charcoal/60">
                  <MdPerson />
                  <span>{s.teacher_name || 'Unassigned'}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* SCHEDULE FORM MODAL (Admin Only) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold text-brand-dark mb-4">{editingId ? 'Edit Schedule' : 'Schedule Class'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input className="p-3 border rounded-lg" placeholder="Code" value={formData.subject_code} onChange={e => setFormData({...formData, subject_code: e.target.value})} required />
                <input className="p-3 border rounded-lg" placeholder="Name" value={formData.subject_name} onChange={e => setFormData({...formData, subject_name: e.target.value})} required />
              </div>
              {isAdmin && <select className="w-full p-3 border rounded-lg" value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})}><option value="">-- Assign Teacher --</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}</select>}
              <div className="flex gap-2 flex-wrap">{daysOptions.map(day => <button type="button" key={day} onClick={() => handleDayToggle(day)} className={`px-3 py-1 rounded-lg text-sm font-bold border ${formData.days.includes(day) ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white text-brand-charcoal'}`}>{day}</button>)}</div>
              <div className="grid grid-cols-2 gap-4"><input type="time" className="p-3 border rounded-lg" value={formData.time_start} onChange={e => setFormData({...formData, time_start: e.target.value})} required /><input type="time" className="p-3 border rounded-lg" value={formData.time_end} onChange={e => setFormData({...formData, time_end: e.target.value})} required /></div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-brand-beige text-brand-charcoal rounded-xl">Cancel</button><button type="submit" className="flex-1 py-3 bg-brand-orange text-white rounded-xl font-bold">Save</button></div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW STUDENTS MODAL (Teacher & Admin) */}
      {showStudentsModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-brand-dark p-6 flex justify-between items-center">
               <div>
                  <h2 className="text-xl font-bold text-brand-beige">{selectedSchedule.subject_name}</h2>
                  <p className="text-brand-beige/60 text-sm mt-1">{selectedSchedule.subject_code} • Enrolled Students</p>
               </div>
               <button onClick={() => setShowStudentsModal(false)} className="text-brand-beige/60 hover:text-brand-orange transition-colors">
                  <MdClose size={24} />
               </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 bg-brand-beige/10">
               {enrolledStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 opacity-50">
                     <MdGroup size={48} className="mb-2"/>
                     <p>No students found enrolled in this subject.</p>
                  </div>
               ) : (
                  <div className="space-y-3">
                     {enrolledStudents.map((student) => (
                        <div key={student.id} className="bg-white p-4 rounded-xl flex items-center gap-4 shadow-sm border border-brand-charcoal/5">
                           {student.face_image_url ? (
                              <img src={student.face_image_url} alt={student.full_name} className="w-12 h-12 rounded-full object-cover border-2 border-brand-orange/20" />
                           ) : (
                              <div className="w-12 h-12 rounded-full bg-brand-beige flex items-center justify-center text-brand-orange font-bold text-lg">
                                 {student.full_name.charAt(0)}
                              </div>
                           )}
                           <div>
                              <h4 className="font-bold text-brand-dark text-lg">{student.full_name}</h4>
                              <div className="flex items-center gap-3 text-sm text-brand-charcoal/60">
                                 <span className="font-mono bg-brand-beige/50 px-1.5 rounded text-xs">{student.student_id}</span>
                                 <span>{student.course}</span>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
            
            <div className="p-4 bg-white border-t border-brand-charcoal/10 flex justify-end">
               <span className="text-sm text-brand-charcoal/60 mr-auto my-auto">Total: {enrolledStudents.length} Students</span>
               <button onClick={() => setShowStudentsModal(false)} className="px-6 py-2 bg-brand-charcoal text-white rounded-lg font-medium hover:bg-brand-dark">Close</button>
            </div>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
};

export default Schedules;