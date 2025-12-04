import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import { devicesAPI } from '../api/devices';
import { useAuth } from '../context/AuthContext';
import { 
  MdAdd, MdDeviceHub, MdWifi, MdRefresh, MdDelete, 
  MdPersonAdd, MdSignalWifi4Bar, MdSignalWifiOff, MdMeetingRoom, MdVpnKey,
  MdCameraAlt, MdNfc
} from 'react-icons/md';

const Devices = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    device_name: '',
    room: 'ER101',
    device_type: 'kiosk',
    connection_key: '',
    status: 'offline',
  });
  
  const [refreshingId, setRefreshingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 10000); 
    return () => clearInterval(interval);
  }, []);

  const fetchDevices = async () => {
    try {
      const data = await devicesAPI.getAll();
      setDevices(data);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateKey = () => {
    const key = 'kiosk_' + Math.random().toString(36).substr(2, 9);
    setFormData(prev => ({ ...prev, connection_key: key }));
  };

  const handleRefresh = async (e, id) => {
    e.stopPropagation();
    setRefreshingId(id);
    await fetchDevices();
    setTimeout(() => setRefreshingId(null), 500);
  };

  // NEW: Function to Toggle Camera/RFID Config
  const handleToggleConfig = async (e, device, field) => {
    e.stopPropagation();
    
    // 1. Calculate new value
    const newValue = !device[field];

    // 2. Optimistic UI Update (Update screen immediately)
    const updatedDevices = devices.map(d => 
        d.id === device.id ? { ...d, [field]: newValue } : d
    );
    setDevices(updatedDevices);

    try {
      // 3. Send to API (This saves to Supabase even if offline)
      await devicesAPI.update(device.id, { [field]: newValue });
      
      const Toast = Swal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, timerProgressBar: true
      });
      Toast.fire({ icon: 'success', title: `${field === 'camera_enabled' ? 'Camera' : 'RFID'} ${newValue ? 'Enabled' : 'Disabled'}` });

    } catch (error) {
      console.error("Update failed", error);
      // Revert UI if failed
      fetchDevices();
      Swal.fire('Error', 'Failed to update setting', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await devicesAPI.create(formData);
      fetchDevices();
      setShowModal(false);
      resetForm();
      Swal.fire({
        icon: 'success',
        title: 'Device Added',
        text: 'Don\'t forget to copy the Connection Key to the RPi!',
        background: '#FFE7D0',
        color: '#1B1B1B',
        confirmButtonColor: '#FC6E20'
      });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to add device' });
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: 'Delete Device?',
      text: "This cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FC6E20',
      cancelButtonColor: '#323232',
      confirmButtonText: 'Yes, Delete'
    });

    if(result.isConfirmed) {
      try {
        await devicesAPI.delete(id);
        fetchDevices();
        Swal.fire('Deleted', 'Device removed', 'success');
      } catch (error) {
        Swal.fire('Error', 'Cannot delete active device', 'error');
      }
    }
  };

  const handleRegisterClick = (e, deviceId) => {
    e.stopPropagation();
    navigate('/students', { state: { targetDeviceId: deviceId } });
  };

  const resetForm = () => {
    setFormData({ device_name: '', room: 'ER101', device_type: 'kiosk', connection_key: '', status: 'offline' });
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="p-2">
      <div className="flex justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Device Management</h1>
          <p className="text-brand-charcoal/70 mt-1">Manage Kiosks and Scanners</p>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-brand-orange text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-orange/90 shadow-lg transition-all"
          >
            <MdAdd className="text-xl" />
            <span>Add Device</span>
          </button>
        )}
      </div>

      {devices.length === 0 ? (
        <div className="col-span-full py-16 text-center bg-white rounded-2xl border-2 border-dashed border-brand-orange/30">
           <h3 className="text-lg font-semibold text-brand-dark">No devices found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {devices.map((device) => {
            const isOnline = device.status === 'online';
            return (
              <motion.div 
                key={device.id}
                whileHover={{ y: -4, scale: 1.02 }}
                onClick={() => navigate(`/devices/${device.id}`)}
                className={`group relative bg-white rounded-2xl p-6 border-2 transition-all cursor-pointer shadow-sm ${isOnline ? 'border-green-400 shadow-green-100' : 'border-transparent hover:border-brand-orange/30'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${isOnline ? 'bg-green-100 text-green-600' : 'bg-brand-beige text-brand-charcoal'}`}>
                    {device.device_type === 'kiosk' ? <MdDeviceHub size={28} /> : <MdWifi size={28} />}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    {device.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-brand-dark group-hover:text-brand-orange transition-colors">
                  {device.device_name}
                </h3>
                <div className="flex items-center gap-2 text-brand-charcoal/70 text-sm mt-1 font-medium">
                   <MdMeetingRoom /> 
                   <span>{device.room || 'Unassigned Room'}</span>
                </div>

                {/* --- NEW: CONFIG TOGGLES (Update DB even if Offline) --- */}
                {isAdmin && (
                  <div className="flex gap-2 mt-4 mb-2">
                    {/* Camera Toggle */}
                    <button
                      onClick={(e) => handleToggleConfig(e, device, 'camera_enabled')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all
                        ${device.camera_enabled 
                          ? 'bg-blue-50 border-blue-200 text-blue-600' 
                          : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                    >
                      <MdCameraAlt size={16} /> {device.camera_enabled ? 'CAM ON' : 'CAM OFF'}
                    </button>
                    
                    {/* RFID Toggle */}
                    <button
                      onClick={(e) => handleToggleConfig(e, device, 'rfid_enabled')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all
                        ${device.rfid_enabled 
                          ? 'bg-purple-50 border-purple-200 text-purple-600' 
                          : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                    >
                      <MdNfc size={16} /> {device.rfid_enabled ? 'RFID ON' : 'RFID OFF'}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-beige">
                   <div className="flex gap-2">
                      <button 
                        onClick={(e) => handleRefresh(e, device.id)}
                        className={`p-2 rounded-lg hover:bg-brand-beige ${refreshingId === device.id ? 'animate-spin text-brand-orange' : ''}`}
                      >
                        <MdRefresh size={20} />
                      </button>
                      {isAdmin && (
                        <button onClick={(e) => handleDelete(e, device.id)} className="p-2 rounded-lg hover:bg-brand-beige hover:text-red-600">
                            <MdDelete size={20} />
                        </button>
                      )}
                   </div>
                   {isOnline && (
                      <button onClick={(e) => handleRegisterClick(e, device.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-orange/10 text-brand-orange rounded-lg text-xs font-bold hover:bg-brand-orange/20">
                        <MdPersonAdd size={16} /> Register
                      </button>
                   )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      {/* Modal Code remains the same... */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4 text-brand-dark">Add New Device</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-charcoal/60 uppercase mb-1">Device Name</label>
                <input
                  type="text"
                  value={formData.device_name}
                  onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                  className="w-full px-4 py-3 border border-brand-charcoal/20 rounded-lg focus:ring-2 focus:ring-brand-orange outline-none bg-white text-brand-dark"
                  placeholder="e.g., Kiosk 1"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-brand-charcoal/60 uppercase mb-1">Location</label>
                    <select
                      value={formData.room}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      className="w-full px-4 py-3 border border-brand-charcoal/20 rounded-lg focus:ring-2 focus:ring-brand-orange outline-none bg-white text-brand-dark"
                    >
                      {['ER101', 'ER102', 'ER103', 'ER104', 'ER105', 'Gym', 'Library', 'Canteen'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-brand-charcoal/60 uppercase mb-1">Type</label>
                    <select
                      value={formData.device_type}
                      onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                      className="w-full px-4 py-3 border border-brand-charcoal/20 rounded-lg focus:ring-2 focus:ring-brand-orange outline-none bg-white text-brand-dark"
                    >
                      <option value="kiosk">Kiosk</option>
                      <option value="esp">ESP Scanner</option>
                    </select>
                 </div>
              </div>
              
              {/* Connection Key Generator */}
              <div>
                <label className="block text-xs font-bold text-brand-charcoal/60 uppercase mb-1">Connection Key (ID)</label>
                <div className="flex gap-2">
                  <input 
                    className="w-full px-4 py-3 border border-brand-charcoal/20 rounded-lg font-mono bg-brand-beige/30 text-brand-dark focus:ring-2 focus:ring-brand-orange outline-none" 
                    placeholder="Generate Key" 
                    value={formData.connection_key} 
                    readOnly 
                  />
                  <button 
                    type="button" 
                    onClick={generateKey} 
                    className="p-3 bg-brand-orange text-white rounded-lg hover:bg-brand-orange/90 transition-colors shadow-md"
                    title="Generate New Key"
                  >
                    <MdVpnKey size={20} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Copy this key to your Kiosk config file.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-4 py-3 text-brand-charcoal bg-brand-beige hover:bg-brand-charcoal/10 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-brand-orange text-white hover:bg-brand-orange/90 rounded-lg font-bold transition-colors shadow-lg shadow-brand-orange/30"
                >
                  Save Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Devices;