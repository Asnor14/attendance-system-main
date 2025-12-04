import supabase from '../config/supabaseClient.js';

// 1. Get All Devices
export const getAllDevices = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .order('id');

    if (error) throw error;

    // Dynamic Status Check
    const now = new Date();
    const updated = data.map(d => {
      let status = d.status;
      if (d.last_sync) {
        const diff = (now - new Date(d.last_sync)) / 1000;
        if (diff > 60) status = 'offline'; // Consider offline if no heartbeat for 60s
      }
      return { ...d, status };
    });

    res.json(updated);
  } catch (error) { next(error); }
};

// 2. Create Device
export const createDevice = async (req, res, next) => {
  try {
    const { device_name, device_type, room, connection_key } = req.body;
    const finalKey = connection_key || 'kiosk_' + Math.random().toString(36).substr(2, 9);

    const { data, error } = await supabase
      .from('devices')
      .insert([{ 
        device_name, 
        device_type, 
        room: room || 'Unassigned',
        connection_key: finalKey,
        status: 'offline',
        camera_enabled: true,
        rfid_enabled: true
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) { next(error); }
};

// 3. Update Config (FIXED for Partial Updates)
export const updateDeviceConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body; 

    // Remove undefined/null fields so we don't overwrite existing data with blank
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    const { data, error } = await supabase
      .from('devices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) { next(error); }
};

// 4. Get Device By ID
export const getDeviceById = async (req, res, next) => {
  try {
    const { data: device, error } = await supabase
      .from('devices')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Device not found' });

    // Add dynamic status calculation here if needed for single view
    const now = new Date();
    let status = 'offline';
    if (device.last_sync && (now - new Date(device.last_sync)) / 1000 < 60) {
      status = 'online';
    }

    res.json({ ...device, status });
  } catch (error) { next(error); }
};

// 5. Delete Device (With Cleanup)
export const deleteDevice = async (req, res, next) => {
  try {
    const deviceId = req.params.id;
    
    // Unlink schedules
    await supabase.from('schedules').update({ kiosk_id: null }).eq('kiosk_id', deviceId);
    
    // Delete logs (Optional: Remove this if you want to keep logs)
    await supabase.from('attendance_logs').delete().eq('kiosk_id', deviceId);
    
    // Delete device
    const { error } = await supabase.from('devices').delete().eq('id', deviceId);
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) { next(error); }
};

// 6. Heartbeat
export const deviceHeartbeat = async (req, res, next) => {
  try {
    const now = new Date().toISOString();
    await supabase
      .from('devices')
      .update({ last_sync: now, status: 'online' })
      .eq('id', req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
};

// 7. Get Logs
export const getDeviceLogs = async (req, res, next) => {
  try {
    const { data } = await supabase.from('attendance_logs')
      .select('*')
      .eq('kiosk_id', req.params.id)
      .order('id', { ascending: false })
      .limit(1000);
    res.json(data);
  } catch (error) { next(error); }
};