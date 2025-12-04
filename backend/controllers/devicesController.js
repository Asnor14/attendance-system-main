import supabase from '../config/supabaseClient.js';

// 1. Get All Devices
export const getAllDevices = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .order('id');

    if (error) throw error;

    // Dynamic Status Check (Visual only, does not affect DB)
    const now = new Date();
    const updated = data.map(d => {
      let status = 'offline';
      if (d.last_sync) {
        const diff = (now - new Date(d.last_sync)) / 1000;
        if (diff < 60) status = 'online'; // Online if synced in last 60s
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
        camera_enabled: true, // Default On
        rfid_enabled: true    // Default On
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) { next(error); }
};

// 3. Update Config (FIXED)
export const updateDeviceConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body; // Catch all fields sent (camera_enabled, rfid_enabled, etc)

    // Remove undefined fields to prevent overwriting with null
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    const { data, error } = await supabase
      .from('devices')
      .update(updates) // Updates Supabase immediately, regardless of offline status
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

    // Step A: Unassign any schedules linked to this kiosk (Set kiosk_id to null)
    const { error: scheduleError } = await supabase
      .from('schedules')
      .update({ kiosk_id: null })
      .eq('kiosk_id', deviceId);

    if (scheduleError) throw scheduleError;

    // Step B: Delete attendance logs recorded by this device
    // (Alternatively, you could keep them if you make kiosk_id nullable in your database)
    const { error: logsError } = await supabase
      .from('attendance_logs')
      .delete()
      .eq('kiosk_id', deviceId);

    if (logsError) throw logsError;

    // Step C: Finally, delete the device
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', deviceId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) { 
    console.error("Delete Device Error:", error);
    next(error); 
  }
};

// 6. Heartbeat
export const deviceHeartbeat = async (req, res, next) => {
  try {
    const now = new Date().toISOString();
    await supabase.from('devices').update({ last_sync: now, status: 'online' }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
};

// 7. Get Logs
export const getDeviceLogs = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('attendance_logs').select('*').eq('kiosk_id', req.params.id).order('id', { ascending: false }).limit(1000);
    if (error) throw error;
    res.json(data);
  } catch (error) { next(error); }
};

// 8. Register (Legacy)
export const registerDevice = async (req, res, next) => {
  try {
    const { device_name } = req.body;
    const { data: existing } = await supabase.from('devices').select('*').eq('device_name', device_name).single();
    if (existing) {
      await supabase.from('devices').update({ status: 'online', last_sync: new Date().toISOString() }).eq('id', existing.id);
      return res.json({ id: existing.id });
    }
  } catch (e) { next(e); }
};