import supabase from '../config/supabaseClient.js';

// Get Schedules for a Specific Kiosk
export const getSchedulesByKiosk = async (req, res, next) => {
  try {
    const { kioskId } = req.params;
    
    const { data, error } = await supabase
      .from('schedules')
      .select(`*, admins:teacher_id(full_name)`)
      .eq('kiosk_id', kioskId)
      .order('time_start');

    if (error) throw error;
    res.json(data);
  } catch (error) { next(error); }
};

// Assign Schedule to Kiosk
export const assignScheduleToKiosk = async (req, res, next) => {
  try {
    const { scheduleId, kioskId } = req.body;
    
    const { error } = await supabase
      .from('schedules')
      .update({ kiosk_id: kioskId })
      .eq('id', scheduleId);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) { next(error); }
};

// Standard Get All
export const getAllSchedules = async (req, res, next) => {
  try {
    const { role, id } = req.user;
    let query = supabase.from('schedules').select(`*, admins:teacher_id ( full_name )`).order('time_start');
    if (role === 'teacher') query = query.eq('teacher_id', id);
    const { data, error } = await query;
    if (error) throw error;
    const formatted = data.map(s => ({ ...s, teacher_name: s.admins?.full_name || 'Unassigned' }));
    res.json(formatted);
  } catch (error) { next(error); }
};

// Sync for Kiosk
export const syncSchedules = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('subject_code, time_start, time_end, days, grace_period, kiosk_id');
    if (error) throw error;
    res.json(data);
  } catch (error) { next(error); }
};

export const createSchedule = async (req, res, next) => {
  try {
    const { subject_code, subject_name, time_start, time_end, days, grace_period, teacher_id } = req.body;
    if (!subject_code || !subject_name || !time_start || !time_end) return res.status(400).json({ error: "Missing required fields" });
    const { data, error } = await supabase
      .from('schedules')
      .insert([{ 
        subject_code, subject_name, time_start, time_end, days, 
        grace_period: parseInt(grace_period) || 0, 
        teacher_id: teacher_id || null 
      }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { next(error); }
};

export const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subject_code, subject_name, time_start, time_end, days, grace_period, teacher_id } = req.body;
    const { error } = await supabase.from('schedules').update({ subject_code, subject_name, time_start, time_end, days, grace_period: parseInt(grace_period) || 0, teacher_id: teacher_id || null }).eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) { next(error); }
};

export const deleteSchedule = async (req, res, next) => {
  try {
    const { error } = await supabase.from('schedules').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) { next(error); }
};