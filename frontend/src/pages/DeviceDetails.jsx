import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { devicesAPI } from '../api/devices';
import { schedulesAPI } from '../api/schedules';
import { 
  MdArrowBack, MdSync, MdCheckCircle, MdCancel, MdCameraAlt, 
  MdAdd, MdDelete, MdAccessTime, MdSchool,
  MdVpnKey, MdContentCopy 
} from 'react-icons/md'; // Removed MdNfc
import { useAuth } from '../context/AuthContext';

const DeviceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [device, setDevice] = useState(null);
  const [kioskSchedules, setKioskSchedules] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false); // State for sync animation
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [d, s] = await Promise.all([
        devicesAPI.getById(id),
        schedulesAPI.getByKiosk(id)
      ]);
      setDevice(d);
      setKioskSchedules(s);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  const toggleCamera = async () => {
    // 1. Optimistic Update: Switch visual state immediately for animation
    const originalState = device.camera_enabled;
    const newState = !originalState;

    setDevice(prev => ({ ...prev, camera_enabled: newState }));

    try {
      // 2. Send request to backend
      await devicesAPI.updateConfig(id, { 
        camera_enabled: newState,
        rfid_enabled: device.rfid_enabled // Keep existing rfid value
      });
      
      // Optional: Show small toast instead of blocking alert
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        background: '#FFE7D0',
        color: '#1B1B1B'
      });
      Toast.fire({
        icon: 'success',
        title: newState ? 'Camera Enabled' : 'Camera Disabled'
      });

    } catch (error) {
      // 3. Revert if error
      setDevice(prev => ({ ...prev, camera_enabled: originalState }));
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Could not update device configuration.',
        background: '#FFE7D0',
        color: '#1B1B1B',
        confirmButtonColor: '#FC6E20'
      });
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true); // Start spinning icon
    await fetchData(); // Re-fetch data from DB
    
    // Simulate a small delay if fetch is too fast, just so user sees the feedback
    setTimeout(() => {
        setIsSyncing(false); // Stop spinning
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            background: '#FFE7D0',
            color: '#1B1B1B'
        });
        Toast.fire({
            icon: 'success',
            title: 'Device Status Synced'
        });
    }, 500);
  };

  const handleCopyKey = () => {
    if (device?.connection_key) {
      navigator.clipboard.writeText(device.connection_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        background: '#FFE7D0',
        color: '#1B1B1B'
      });
      Toast.fire({
        icon: 'success',
        title: 'Key copied to clipboard'
      });
    }
  };

  const handleAssign = async (scheduleId) => {
    await schedulesAPI.assignToKiosk(scheduleId, id);
    setShowAssignModal(false);
    fetchData();
    Swal.fire({ icon: 'success', title: 'Subject Added', timer: 1500, showConfirmButton: false, background: '#FFE7D0', color: '#1B1B1B' });
  };
  
  const handleUnassign = async (e, scheduleId) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: 'Remove Subject?',
      text: "This will unassign the subject from this Kiosk.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#323232',
      confirmButtonText: 'Remove',
      background: '#FFE7D0',
      color: '#1B1B1B'
    });

    if (result.isConfirmed) {
       await schedulesAPI.assignToKiosk(scheduleId, null);
       fetchData();
       Swal.fire({ icon: 'success', title: 'Removed', timer: 1000, showConfirmButton: false, background: '#FFE7D0', color: '#1B1B1B' });
    }
  };

  const openAssignModal = async () => {
    const all = await schedulesAPI.getAll();
    const available = all.filter(s => s.kiosk_id !== parseInt(id));
    setAllSchedules(available);
    setShowAssignModal(true);
  };

  if (loading) return <div className="p-10 text-center font-bold text-brand-charcoal">Loading Device...</div>;
  if (!device) return <div className="p-10 text-center">Device not found</div>;

  return (
    <div className="space-y-6 p-2">
      {/* TOP: Status & Health Header */}
      <div className="bg-brand-dark text-brand-beige p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
           <button onClick={() => navigate('/devices')} className="p-2 hover:bg-brand-charcoal rounded-full transition-colors"><MdArrowBack size={24} /></button>
           <div>
              <h1 className="text-4xl font-bold tracking-tight">{device.device_name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-brand-beige/60">
                 <span className="bg-white/10 px-3 py-1 rounded-lg text-sm font-medium">{device.room || 'Unassigned'}</span>
                 
                 {/* Connection Key Badge */}
                 {device.connection_key && (
                    <button 
                      onClick={handleCopyKey}
                      className="group flex items-center gap-2 bg-black/30 hover:bg-brand-orange/20 border border-white/10 hover:border-brand-orange/50 px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer"
                      title="Copy Connection Key"
                    >
                      <MdVpnKey className="text-brand-orange" size={14} />
                      <span className="text-brand-beige group-hover:text-white tracking-wide">{device.connection_key}</span>
                      {copied ? <MdCheckCircle className="text-green-400" size={14} /> : <MdContentCopy className="opacity-50 group-hover:opacity-100 transition-opacity" size={14} />}
                    </button>
                 )}
                 
                 <span className="font-mono text-xs opacity-50 ml-1">#{device.id}</span>
              </div>
           </div>
        </div>
        <div className="relative z-10 flex items-center gap-3">
            <div className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-3 border ${device.status === 'online' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400'}`}>
               {device.status === 'online' ? <MdCheckCircle size={20} /> : <MdCancel size={20} />}
               {device.status.toUpperCase()}
            </div>
            
            {/* Updated Sync Button */}
            <button 
                onClick={handleForceSync} 
                className="p-3 bg-brand-beige/10 hover:bg-brand-beige/20 rounded-xl text-brand-beige transition-colors"
                title="Sync Status"
            >
                <MdSync size={24} className={isSyncing ? "animate-spin" : ""} />
            </button>
        </div>
        
        {/* Decorative blob */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      </div>

      {/* MIDDLE: Feature Toggles (RFID REMOVED) */}
      <div className="grid grid-cols-1"> {/* Changed to single column since we only have one card now */}
        
        {/* Camera Toggle - Updated Logic */}
        <div 
          onClick={toggleCamera} 
          className={`p-6 rounded-2xl cursor-pointer border-2 transition-all duration-300 shadow-sm group relative overflow-hidden ${device.camera_enabled ? 'bg-white border-green-400' : 'bg-gray-100 border-gray-300'}`}
        >
           <div className="flex justify-between items-center mb-4 relative z-10">
             <div className={`p-3 rounded-full transition-colors ${device.camera_enabled ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                <MdCameraAlt size={32} />
             </div>
             
             {/* The Switch UI */}
             <div className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${device.camera_enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${device.camera_enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
             </div>
           </div>
           <h3 className="text-xl font-bold text-brand-dark relative z-10">Face Recognition</h3>
           <p className="text-xs text-gray-500 mt-1 relative z-10">
             {device.camera_enabled ? 'Enabled' : 'Disabled'}
           </p>
        </div>

      </div>

      {/* BOTTOM: Assigned Schedules */}
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-brand-orange/20">
        <div className="flex justify-between items-center mb-6">
           <div>
             <h2 className="text-2xl font-bold text-brand-dark">Assigned Subjects</h2>
             <p className="text-sm text-brand-charcoal/60">Only these classes will appear on this Kiosk</p>
           </div>
           {isAdmin && (
             <button onClick={openAssignModal} className="flex items-center gap-2 bg-brand-beige text-brand-orange px-4 py-2 rounded-xl font-bold hover:bg-brand-orange hover:text-white transition-colors">
               <MdAdd size={20} /> Add Subject
             </button>
           )}
        </div>
        
        {kioskSchedules.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-brand-charcoal/10 rounded-2xl bg-brand-beige/20">
             <p className="text-brand-charcoal/50 font-medium">No subjects assigned to this Kiosk yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {kioskSchedules.map(s => (
              <div key={s.id} className="flex justify-between items-center p-4 bg-brand-beige/20 rounded-2xl border border-brand-beige hover:border-brand-orange/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold text-xs">
                    {s.subject_code.substring(0, 3)}
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-dark text-lg">{s.subject_name}</h4>
                    <div className="flex items-center gap-3 text-xs text-brand-charcoal/70 mt-0.5">
                      <span className="font-mono bg-white px-1.5 rounded border">{s.subject_code}</span>
                      <span className="flex items-center gap-1"><MdAccessTime size={14}/> {s.time_start} - {s.time_end}</span>
                      <span>{s.days}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-xs font-medium bg-brand-dark/5 text-brand-charcoal px-3 py-1 rounded-full flex items-center gap-1">
                      <MdSchool size={14} /> {s.admins?.full_name || 'No Teacher'}
                   </span>
                   {isAdmin && (
                      <button onClick={(e) => handleUnassign(e, s.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                          <MdDelete size={20} />
                      </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Assign Subject */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-brand-dark">Select Subject</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-brand-dark"><MdCancel size={24}/></button>
            </div>
            
            {allSchedules.length === 0 ? (
               <p className="text-center text-gray-500 py-4">No available subjects to add.</p>
            ) : (
              <div className="space-y-2">
                {allSchedules.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => handleAssign(s.id)}
                    className="w-full text-left p-4 hover:bg-brand-beige rounded-xl border border-gray-100 transition-colors flex justify-between items-center group"
                  >
                    <div>
                      <span className="font-bold text-brand-dark block">{s.subject_name}</span>
                      <span className="text-xs text-gray-500 font-mono">{s.subject_code}</span>
                    </div>
                    <MdAdd className="text-gray-300 group-hover:text-brand-orange" size={24} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceDetails;