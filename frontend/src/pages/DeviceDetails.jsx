import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import { devicesAPI } from '../api/devices';
import { schedulesAPI } from '../api/schedules'; // Import schedules API
import { useAuth } from '../context/AuthContext'; // Import Auth Context
import { supabase } from '../supabaseClient';
import { 
  MdArrowBack, MdDeviceHub, MdWifi, MdMeetingRoom, MdVpnKey, 
  MdCameraAlt, MdVideocamOff, MdNfc, MdHistory, MdRefresh, 
  MdSignalWifi4Bar, MdSignalWifiOff, MdSchedule, MdAdd, MdClass, MdArrowForward
} from 'react-icons/md';

const DeviceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user
  
  const [device, setDevice] = useState(null);
  const [logs, setLogs] = useState([]);
  const [kioskSchedules, setKioskSchedules] = useState([]); // Assigned schedules
  
  // Loading States
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  
  // Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');

  useEffect(() => {
    fetchDeviceDetails();
    fetchDeviceLogs();
    fetchKioskSchedules(); 

    // --- REALTIME LISTENER FOR THIS DEVICE ---
    const channel = supabase
      .channel(`device-${id}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'devices', filter: `id=eq.${id}` }, 
        (payload) => {
          setDevice(prev => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    // --- REALTIME LISTENER FOR NEW LOGS ---
    const logChannel = supabase
      .channel(`logs-${id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'attendance_logs', filter: `kiosk_id=eq.${id}` },
        (payload) => {
          setLogs(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(logChannel);
    };
  }, [id]);

  const fetchDeviceDetails = async () => {
    try {
      const data = await devicesAPI.getById(id);
      setDevice(data);
    } catch (error) {
      Swal.fire('Error', 'Device not found', 'error');
      navigate('/devices');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceLogs = async () => {
    setLogsLoading(true);
    try {
      const data = await devicesAPI.getLogs(id);
      setLogs(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLogsLoading(false);
    }
  };

  // --- FETCH ASSIGNED SCHEDULES ---
  const fetchKioskSchedules = async () => {
    try {
      const data = await schedulesAPI.getByKiosk(id);
      setKioskSchedules(data || []);
    } catch (error) {
      console.error("Failed to fetch kiosk schedules", error);
    }
  };

  // --- HANDLE SCHEDULE CLICK (ACCESS CONTROL) ---
  const handleScheduleClick = (schedule) => {
    // 1. If Admin, always allow
    if (user?.role === 'admin') {
      navigate(`/schedules/${schedule.id}`);
      return;
    }

    // 2. If Teacher, check ownership
    if (user?.role === 'teacher') {
      // Ensure we compare compatible types (e.g. both strings or both numbers)
      // eslint-disable-next-line eqeqeq
      if (schedule.teacher_id == user.id) {
        navigate(`/schedules/${schedule.id}`);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Access Denied',
          text: 'You do not have access to this class schedule.',
          confirmButtonColor: '#FC6E20',
          background: '#FFE7D0',
          color: '#1B1B1B'
        });
      }
    }
  };

  // --- HANDLE MODAL OPEN ---
  const handleOpenAssignModal = async () => {
    try {
      const all = await schedulesAPI.getAll();
      // Filter out schedules already assigned to THIS kiosk to prevent duplicates in dropdown
      const unassigned = all.filter(s => s.kiosk_id !== parseInt(id));
      setAvailableSchedules(unassigned);
      setShowAssignModal(true);
    } catch (error) {
      Swal.fire('Error', 'Could not load schedules', 'error');
    }
  };

  // --- HANDLE ASSIGN SUBMIT ---
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedScheduleId) return;

    try {
      await schedulesAPI.assignToKiosk(selectedScheduleId, id);
      Swal.fire({ icon: 'success', title: 'Assigned', timer: 1500, showConfirmButton: false });
      setShowAssignModal(false);
      setSelectedScheduleId('');
      fetchKioskSchedules(); // Refresh list
    } catch (error) {
      Swal.fire('Error', 'Failed to assign schedule', 'error');
    }
  };

  const handleToggleConfig = async (field, label) => {
    if (!device) return;
    const newValue = !device[field];
    setDevice(prev => ({ ...prev, [field]: newValue }));

    try {
      await devicesAPI.update(id, { [field]: newValue });
      const Toast = Swal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, timerProgressBar: true
      });
      Toast.fire({ icon: 'success', title: `${label} ${newValue ? 'Enabled' : 'Disabled'}` });
    } catch (error) {
      fetchDeviceDetails(); 
      Swal.fire('Error', 'Failed to update setting', 'error');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div></div>;
  if (!device) return null;

  const isOnline = device.status === 'online';

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/devices')} className="p-2 bg-white rounded-xl shadow-sm hover:bg-gray-50 text-brand-charcoal transition-colors">
          <MdArrowBack size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-brand-dark flex items-center gap-3">
            {device.device_name}
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              {device.status}
            </span>
          </h1>
          <p className="text-brand-charcoal/60 text-sm mt-1">Manage settings and view logs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: INFO & CONFIG */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-beige">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-brand-dark flex items-center gap-2"><MdDeviceHub className="text-brand-orange"/> Info</h2>
              {isOnline ? <MdSignalWifi4Bar className="text-green-500" title="Connected" /> : <MdSignalWifiOff className="text-gray-400" title="Disconnected" />}
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-brand-beige/30 rounded-xl">
                <div className="p-2 bg-white rounded-lg text-brand-orange"><MdMeetingRoom /></div>
                <div><p className="text-xs text-gray-500 uppercase font-bold">Location</p><p className="font-semibold text-brand-dark">{device.room}</p></div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brand-beige/30 rounded-xl">
                <div className="p-2 bg-white rounded-lg text-brand-orange"><MdVpnKey /></div>
                <div className="overflow-hidden w-full"><p className="text-xs text-gray-500 uppercase font-bold">Key</p><p className="font-mono text-sm truncate text-brand-dark bg-white px-2 py-1 rounded border border-gray-200 mt-1 select-all">{device.connection_key}</p></div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brand-beige/30 rounded-xl">
                <div className="p-2 bg-white rounded-lg text-brand-orange"><MdHistory /></div>
                <div><p className="text-xs text-gray-500 uppercase font-bold">Last Sync</p><p className="text-sm font-medium text-brand-dark">{device.last_sync ? new Date(device.last_sync).toLocaleString() : 'Never'}</p></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-beige">
            <h2 className="font-bold text-lg text-brand-dark mb-4">Configuration</h2>
            <div className="space-y-3">
              <button onClick={() => handleToggleConfig('camera_enabled', 'Camera')} className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${device.camera_enabled ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                <div className="flex items-center gap-3">{device.camera_enabled ? <MdCameraAlt size={24}/> : <MdVideocamOff size={24}/>}<div className="text-left"><p className="font-bold text-sm">Camera</p><p className="text-xs opacity-80">{device.camera_enabled ? 'Active' : 'Disabled'}</p></div></div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${device.camera_enabled ? 'bg-blue-500' : 'bg-gray-300'}`}><div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${device.camera_enabled ? 'left-6' : 'left-1'}`}></div></div>
              </button>
              <button onClick={() => handleToggleConfig('rfid_enabled', 'RFID Reader')} className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${device.rfid_enabled ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                <div className="flex items-center gap-3"><MdNfc size={24} /><div className="text-left"><p className="font-bold text-sm">RFID</p><p className="text-xs opacity-80">{device.rfid_enabled ? 'Active' : 'Disabled'}</p></div></div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${device.rfid_enabled ? 'bg-purple-500' : 'bg-gray-300'}`}><div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${device.rfid_enabled ? 'left-6' : 'left-1'}`}></div></div>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ASSIGNED SCHEDULES */}
          <div className="bg-white rounded-2xl shadow-sm border border-brand-beige overflow-hidden">
            <div className="p-6 border-b border-brand-beige flex justify-between items-center">
              <h2 className="font-bold text-lg text-brand-dark flex items-center gap-2">
                <MdClass className="text-brand-orange" /> Assigned Schedules
              </h2>
              {/* Only show Add button if user is Admin, or allow teachers to add if that's desired */}
              <button 
                onClick={handleOpenAssignModal}
                className="flex items-center gap-1 bg-brand-orange text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-md hover:bg-brand-orange/90 transition-colors"
              >
                <MdAdd size={18} /> Add Subject
              </button>
            </div>
            
            <div className="p-4">
              {kioskSchedules.length === 0 ? (
                <div className="text-center py-8 text-brand-charcoal/50">
                  <MdSchedule className="text-4xl mx-auto mb-2 opacity-30" />
                  <p>No subjects assigned to this kiosk yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {kioskSchedules.map(schedule => (
                    <motion.div 
                      key={schedule.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleScheduleClick(schedule)}
                      className={`bg-brand-beige/20 border border-brand-orange/10 p-4 rounded-xl cursor-pointer hover:border-brand-orange/40 hover:bg-brand-beige/40 transition-all group relative`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-bold bg-brand-charcoal text-white px-2 py-0.5 rounded uppercase tracking-wide">
                            {schedule.subject_code}
                          </span>
                          <h4 className="font-bold text-brand-dark mt-2 group-hover:text-brand-orange transition-colors">
                            {schedule.subject_name}
                          </h4>
                          <p className="text-xs text-brand-charcoal/70 mt-1 flex items-center gap-1">
                            <MdSchedule /> {schedule.time_start} - {schedule.time_end}
                          </p>
                          <p className="text-xs text-brand-charcoal/50 mt-1 truncate">
                            {schedule.days}
                          </p>
                        </div>
                        <MdArrowForward className="text-brand-orange/0 group-hover:text-brand-orange transition-all -translate-x-2 group-hover:translate-x-0" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ACTIVITY LOGS */}
          <div className="bg-white rounded-2xl shadow-sm border border-brand-beige overflow-hidden flex flex-col h-[400px]">
            <div className="p-6 border-b border-brand-beige flex justify-between items-center">
              <h2 className="font-bold text-lg text-brand-dark flex items-center gap-2">
                <MdHistory className="text-brand-orange" /> Recent Activity
              </h2>
              <button onClick={fetchDeviceLogs} className="p-2 hover:bg-gray-100 rounded-lg text-brand-charcoal transition-colors">
                <MdRefresh size={20} className={logsLoading ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-0">
              {logsLoading ? (
                 <div className="flex flex-col items-center justify-center h-full text-gray-400">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mb-2"></div>
                   <p>Loading logs...</p>
                 </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                  <p>No activity recorded yet.</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3">Time</th>
                      <th className="px-6 py-3">Student Name</th>
                      <th className="px-6 py-3">Subject</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 font-mono text-xs text-gray-500">
                          {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="px-6 py-3 font-semibold text-brand-dark">
                          {log.student_name}
                        </td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                            {log.subject_code}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${
                            log.status === 'present' ? 'bg-green-100 text-green-700' : 
                            log.status === 'late' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
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
        </div>
      </div>

      {/* ASSIGN SCHEDULE MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-brand-dark mb-4">Assign Subject</h2>
            <p className="text-sm text-gray-500 mb-4">Select a class to assign to <strong>{device.device_name}</strong>.</p>
            
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Available Classes</label>
                <select 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-orange outline-none bg-white"
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  required
                >
                  <option value="">-- Select a Subject --</option>
                  {availableSchedules.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.subject_code} - {s.subject_name} ({s.time_start}-{s.time_end})
                    </option>
                  ))}
                </select>
                {availableSchedules.length === 0 && (
                  <p className="text-xs text-red-500 mt-2">No unassigned schedules available.</p>
                )}
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 py-3 bg-brand-beige text-brand-charcoal rounded-xl">Cancel</button>
                <button 
                  type="submit" 
                  disabled={!selectedScheduleId}
                  className="flex-1 py-3 bg-brand-orange text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default DeviceDetails;