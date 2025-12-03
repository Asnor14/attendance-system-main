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
      let status = 'offline';
      if (d.last_sync) {
        const diff = (now - new Date(d.last_sync)) / 1000;
        if (diff < 60) status = 'online';
      }
      return { ...d, status };
    });

    res.json(updated);
  } catch (error) { next(error); }
};

// 2. Create Device (Admin Only)
export const createDevice = async (req, res, next) => {
  try {
    const { device_name, device_type, room, connection_key } = req.body;
    
    const finalKey = connection_key || 'kiosk_' + Math.random().toString(36).substr(2, 9);

    const { data, error } = await supabase
      .from('devices')
      .insert([{ 
        device_name, 
        device_type, 
        room: room || 'Unassigned', // Room Added
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

// 3. Update Config (Teacher/Admin can toggle)
export const updateDeviceConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { camera_enabled, rfid_enabled } = req.body;

    const { data, error } = await supabase
      .from('devices')
      .update({ camera_enabled, rfid_enabled })
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

    const now = new Date();
    let status = 'offline';
    if (device.last_sync && (now - new Date(device.last_sync)) / 1000 < 60) {
      status = 'online';
    }

    res.json({ ...device, status });
  } catch (error) { next(error); }
};

// 5. Delete Device
export const deleteDevice = async (req, res, next) => {
  try {
    const { error } = await supabase.from('devices').delete().eq('id', req.params.id);
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
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('kiosk_id', req.params.id)
      .order('id', { ascending: false })
      .limit(1000);

    if (error) throw error;
    res.json(data);
  } catch (error) { next(error); }
};

// 8. Register (Legacy/Auto)
export const registerDevice = async (req, res, next) => {
  try {
    const { device_name } = req.body;
    const { data: existing } = await supabase.from('devices').select('*').eq('device_name', device_name).single();
    if (existing) {
      await supabase.from('devices').update({ status: 'online', last_sync: new Date().toISOString() }).eq('id', existing.id);
      return res.json({ id: existing.id });
    }
    // Create logic if needed...
  } catch (e) { next(e); }
};