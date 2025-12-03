import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import { schedulesAPI } from '../api/schedules';
import { teachersAPI } from '../api/teachers';
import { useAuth } from '../context/AuthContext';
import { 
  MdAdd, MdSchedule, MdPerson, MdAccessTime 
} from 'react-icons/md';

const daysOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Schedules = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
  
  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  
  // Data States
  const [formData, setFormData] = useState({ subject_code: '', subject_name: '', time_start: '', time_end: '', grace_period: 0, days: [], teacher_id: '' });

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

  const handleDayToggle = (day) => {
    const days = formData.days.includes(day) ? formData.days.filter(d => d !== day) : [...formData.days, day];
    setFormData({ ...formData, days });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, days: formData.days.join(',') };
    try {
      await schedulesAPI.create(payload);
      setShowModal(false); loadData(); resetForm();
      Swal.fire({ icon: 'success', title: 'Saved!', timer: 1500, showConfirmButton: false, background: '#FFE7D0', color: '#1B1B1B' });
    } catch (e) { Swal.fire('Error', 'Failed to save schedule', 'error'); }
  };

  const resetForm = () => {
    setFormData({ subject_code: '', subject_name: '', time_start: '', time_end: '', grace_period: 0, days: [], teacher_id: '' });
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
            <motion.div 
              key={s.id} 
              whileHover={{ y: -4, scale: 1.02 }} 
              onClick={() => navigate(`/schedules/${s.id}`)}
              className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-brand-orange cursor-pointer hover:shadow-lg transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="px-2.5 py-1 bg-brand-charcoal text-brand-beige text-xs font-bold rounded-lg uppercase">{s.subject_code}</span>
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

      {/* SCHEDULE FORM MODAL (Create only here) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold text-brand-dark mb-4">Schedule Class</h2>
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
    </motion.div>
  );
};

export default Schedules;