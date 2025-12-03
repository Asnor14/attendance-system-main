import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { schedulesAPI } from '../api/schedules';
import { studentsAPI } from '../api/students';
import { useAuth } from '../context/AuthContext';
import { 
  MdArrowBack, MdDateRange, MdGroup, MdList, 
  MdDelete 
} from 'react-icons/md';

const ScheduleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // State
  const [schedule, setSchedule] = useState(null);
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' or 'students'
  const [logs, setLogs] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]); // Default Today
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'logs' && schedule) {
      fetchLogs();
    }
  }, [activeTab, dateFilter, schedule]);

  const fetchInitialData = async () => {
    try {
      // 1. Get Schedule Details
      const allSchedules = await schedulesAPI.getAll(); 
      const found = allSchedules.find(s => s.id === parseInt(id));
      
      if (!found) {
        navigate('/schedules');
        return;
      }
      setSchedule(found);

      // 2. Get Enrolled Students
      const allStudents = await studentsAPI.getAll();
      const filteredStudents = allStudents.filter(student => 
        student.enrolled_subjects && 
        student.enrolled_subjects.includes(found.subject_code)
      );
      setEnrolled(filteredStudents);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await schedulesAPI.getLogs(id, dateFilter);
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Delete Schedule?',
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FC6E20',
      cancelButtonColor: '#323232',
      confirmButtonText: 'Yes, Delete'
    });

    if (result.isConfirmed) {
      await schedulesAPI.delete(id);
      navigate('/schedules');
    }
  };

  if (loading || !schedule) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-orange/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/schedules')} className="p-2 hover:bg-brand-beige rounded-full transition-colors">
            <MdArrowBack size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">{schedule.subject_name}</h1>
            <div className="flex items-center gap-3 text-brand-charcoal/60 text-sm mt-1">
              <span className="font-mono bg-brand-charcoal text-brand-beige px-2 rounded">{schedule.subject_code}</span>
              <span>{schedule.time_start} - {schedule.time_end}</span>
              <span>•</span>
              <span>{schedule.days}</span>
            </div>
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2">
             <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium">
               <MdDelete /> Delete Class
             </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-brand-charcoal/10 pb-1">
        <button 
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 pb-3 px-2 font-semibold transition-all ${activeTab === 'logs' ? 'text-brand-orange border-b-2 border-brand-orange' : 'text-brand-charcoal/50 hover:text-brand-charcoal'}`}
        >
          <MdList size={20} /> View Attendance Logs
        </button>
        <button 
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 pb-3 px-2 font-semibold transition-all ${activeTab === 'students' ? 'text-brand-orange border-b-2 border-brand-orange' : 'text-brand-charcoal/50 hover:text-brand-charcoal'}`}
        >
          <MdGroup size={20} /> Enrolled Students ({enrolled.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        
        {/* --- ATTENDANCE LOGS SECTION --- */}
        {activeTab === 'logs' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Date Picker Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 w-fit">
              <MdDateRange className="text-brand-orange text-xl" />
              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-bold text-brand-charcoal/50">Select Date</label>
                <input 
                  type="date" 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="outline-none font-medium text-brand-dark bg-transparent"
                />
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl shadow-lg border border-brand-orange/10 overflow-hidden">
              {logs.length === 0 ? (
                <div className="p-12 text-center text-brand-charcoal/50">
                  <p>No attendance records found for this date.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-brand-charcoal text-brand-beige">
                    <tr>
                      <th className="p-4">Time</th>
                      <th className="p-4">Student Name</th>
                      <th className="p-4">ID</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-beige">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-brand-beige/20">
                        <td className="p-4 font-mono text-sm">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4 font-medium">{log.student_name}</td>
                        <td className="p-4 text-sm text-brand-charcoal/60">{log.student_id}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${log.status === 'late' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* --- ENROLLED STUDENTS SECTION --- */}
        {activeTab === 'students' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {enrolled.map((student) => (
              <div key={student.id} className="bg-white p-4 rounded-xl shadow-sm border border-brand-orange/10 flex items-center gap-4 hover:border-brand-orange/40 transition-colors">
                
                {/* Profile Image Logic */}
                {student.face_image_url ? (
                  <img 
                    src={student.face_image_url} 
                    alt={student.full_name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-brand-orange/20"
                  />
                ) : (
                  <div className="w-12 h-12 bg-brand-beige rounded-full flex items-center justify-center text-brand-orange font-bold text-lg">
                    {student.full_name.charAt(0)}
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-brand-dark">{student.full_name}</h4>
                  <div className="flex items-center gap-2 text-xs text-brand-charcoal/60">
                    <span className="font-mono bg-brand-charcoal/5 px-1 rounded">{student.student_id}</span>
                    <span>{student.course}</span>
                  </div>
                </div>
              </div>
            ))}
            {enrolled.length === 0 && (
              <p className="col-span-full text-center py-10 text-brand-charcoal/50">No students enrolled yet.</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ScheduleDetails;