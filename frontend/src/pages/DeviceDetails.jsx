import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import { devicesAPI } from '../api/devices';
import { supabase } from '../supabaseClient';
import { 
  MdArrowBack, MdDeviceHub, MdWifi, MdMeetingRoom, MdVpnKey, 
  MdCameraAlt, MdVideocamOff, MdNfc, MdHistory, MdRefresh, 
  MdSignalWifi4Bar, MdSignalWifiOff 
} from 'react-icons/md';

const DeviceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [device, setDevice] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    fetchDeviceDetails();
    fetchDeviceLogs();

    // --- REALTIME LISTENER FOR THIS DEVICE ---
    const channel = supabase
      .channel(`device-${id}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'devices', filter: `id=eq.${id}` }, 
        (payload) => {
          console.log("Realtime Update:", payload.new);
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

  // --- TOGGLE HANDLERS ---
  const handleToggleConfig = async (field, label) => {
    if (!device) return;
    const newValue = !device[field];

    // Optimistic Update
    setDevice(prev => ({ ...prev, [field]: newValue }));

    try {
      await devicesAPI.update(id, { [field]: newValue });
      
      const Toast = Swal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, timerProgressBar: true
      });
      Toast.fire({ icon: 'success', title: `${label} ${newValue ? 'Enabled' : 'Disabled'}` });

    } catch (error) {
      console.error(error);
      fetchDeviceDetails(); // Revert
      Swal.fire('Error', 'Failed to update setting', 'error');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div></div>;
  if (!device) return null;

  const isOnline = device.status === 'online';

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 max-w-6xl mx-auto">
      
      {/* HEADER & BACK BUTTON */}
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
        
        {/* LEFT COLUMN: INFO & SETTINGS */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* 1. DEVICE INFO CARD */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-beige">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-brand-dark flex items-center gap-2"><MdDeviceHub className="text-brand-orange"/> Info</h2>
              {isOnline ? <MdSignalWifi4Bar className="text-green-500" title="Connected" /> : <MdSignalWifiOff className="text-gray-400" title="Disconnected" />}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-brand-beige/30 rounded-xl">
                <div className="p-2 bg-white rounded-lg text-brand-orange"><MdMeetingRoom /></div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Location</p>
                  <p className="font-semibold text-brand-dark">{device.room}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-brand-beige/30 rounded-xl">
                <div className="p-2 bg-white rounded-lg text-brand-orange"><MdVpnKey /></div>
                <div className="overflow-hidden w-full">
                  <p className="text-xs text-gray-500 uppercase font-bold">Connection Key</p>
                  <p className="font-mono text-sm truncate text-brand-dark bg-white px-2 py-1 rounded border border-gray-200 mt-1 select-all">
                    {device.connection_key}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-brand-beige/30 rounded-xl">
                <div className="p-2 bg-white rounded-lg text-brand-orange"><MdHistory /></div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Last Sync</p>
                  <p className="text-sm font-medium text-brand-dark">
                    {device.last_sync ? new Date(device.last_sync).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. SETTINGS CARD (TOGGLES) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-beige">
            <h2 className="font-bold text-lg text-brand-dark mb-4">Configuration</h2>
            
            <div className="space-y-3">
              {/* Camera Toggle */}
              <button
                onClick={() => handleToggleConfig('camera_enabled', 'Camera')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                  device.camera_enabled 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  {device.camera_enabled ? <MdCameraAlt size={24}/> : <MdVideocamOff size={24}/>}
                  <div className="text-left">
                    <p className="font-bold text-sm">Camera Detection</p>
                    <p className="text-xs opacity-80">{device.camera_enabled ? 'Active' : 'Disabled'}</p>
                  </div>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${device.camera_enabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${device.camera_enabled ? 'left-6' : 'left-1'}`}></div>
                </div>
              </button>

              {/* RFID Toggle */}
              <button
                onClick={() => handleToggleConfig('rfid_enabled', 'RFID Reader')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                  device.rfid_enabled 
                    ? 'border-purple-500 bg-purple-50 text-purple-700' 
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MdNfc size={24} />
                  <div className="text-left">
                    <p className="font-bold text-sm">RFID Reader</p>
                    <p className="text-xs opacity-80">{device.rfid_enabled ? 'Active' : 'Disabled'}</p>
                  </div>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${device.rfid_enabled ? 'bg-purple-500' : 'bg-gray-300'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${device.rfid_enabled ? 'left-6' : 'left-1'}`}></div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVITY LOGS */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-brand-beige overflow-hidden flex flex-col h-[600px]">
            <div className="p-6 border-b border-brand-beige flex justify-between items-center">
              <h2 className="font-bold text-lg text-brand-dark">Recent Activity Logs</h2>
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
                  <MdHistory size={48} className="mb-2 opacity-20"/>
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
                          {new Date(log.created_at).toLocaleString()}
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
    </motion.div>
  );
};

export default DeviceDetails;