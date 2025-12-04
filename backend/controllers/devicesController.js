import supabase from '../config/supabaseClient.js';

// 1. Get All Devices
export const getAllDevices = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .order('id');

    if (error) throw error;

    // Calculate status based on last_sync time (redundant if Kiosk updates status column, but good backup)
    const now = new Date();
    const updated = data.map(d => {
      // If the DB says online, trust it. Otherwise check timestamp.
      let status = d.status; 
      if (d.last_sync) {
        const diff = (now - new Date(d.last_sync)) / 1000;
        // If older than 60 seconds, force offline
        if (diff > 60) status = 'offline'; 
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

// 3. Update Config (FIXED FOR PARTIAL UPDATES)
export const updateDeviceConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body; // Get all fields sent

    // Clean the updates object to remove undefined/null values if necessary
    // This allows sending { camera_enabled: true } without breaking rfid_enabled
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
    const { data: device, error } = await supabase.from('devices').select('*').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ error: 'Device not found' });
    res.json(device);
  } catch (error) { next(error); }
};

// 5. Delete Device (With Cleanup)
export const deleteDevice = async (req, res, next) => {
  try {
    const deviceId = req.params.id;
    // Unlink schedules first
    await supabase.from('schedules').update({ kiosk_id: null }).eq('kiosk_id', deviceId);
    // Delete logs
    await supabase.from('attendance_logs').delete().eq('kiosk_id', deviceId);
    // Delete device
    const { error } = await supabase.from('devices').delete().eq('id', deviceId);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) { next(error); }
};

// 6. Heartbeat / Logs / Register (Keep existing)
export const deviceHeartbeat = async (req, res, next) => {
  try {
    const now = new Date().toISOString();
    await supabase.from('devices').update({ last_sync: now, status: 'online' }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
};

export const getDeviceLogs = async (req, res, next) => {
  try {
    const { data } = await supabase.from('attendance_logs').select('*').eq('kiosk_id', req.params.id).order('id', { ascending: false }).limit(1000);
    res.json(data);
  } catch (error) { next(error); }
};

export const registerDevice = async (req, res, next) => {
  try {
    const { device_name } = req.body;
    const { data: existing } = await supabase.from('devices').select('*').eq('device_name', device_name).single();
    if (existing) {
      await supabase.from('devices').update({ status: 'online', last_sync: new Date().toISOString() }).eq('id', existing.id);
      return res.json({ id: existing.id });
    }
    res.status(404).json({error: "Device not found"});
  } catch (e) { next(e); }
};