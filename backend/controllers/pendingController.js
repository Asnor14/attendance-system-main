import supabase from '../config/supabaseClient.js';

// 1. Get All Pending
export const getAllPending = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('pending_registrations')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) { next(error); }
};

// 2. Get Pending By ID
export const getPendingById = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('pending_registrations')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Pending registration not found' });
    res.json(data);
  } catch (error) { next(error); }
};

// 3. Create Pending
export const createPending = async (req, res, next) => {
  try {
    const { given_name, middle_name, surname, student_id, course, date_enrolled, cor_url, enrolled_subjects, face_image_url } = req.body;

    if (!given_name || !surname || !student_id || !course) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const { data, error } = await supabase
      .from('pending_registrations')
      .insert([{
        given_name, middle_name, surname, student_id, course, date_enrolled, 
        cor_url, face_image_url, enrolled_subjects, // Save subjects here
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { next(error); }
};

// 4. Approve Pending (FIXED)
export const approvePending = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rfid_uid } = req.body;

    if (!rfid_uid) return res.status(400).json({ error: 'RFID UID is required' });

    // 1. Get Pending Data
    const { data: pending, error: fetchError } = await supabase
      .from('pending_registrations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !pending) return res.status(404).json({ error: 'Pending registration not found' });

    const fullName = `${pending.given_name} ${pending.middle_name ? pending.middle_name + ' ' : ''}${pending.surname}`.trim();

    // 2. Insert into Students Table
    const { data: student, error: createError } = await supabase
      .from('students')
      .insert([{
        full_name: fullName,
        student_id: pending.student_id,
        course: pending.course,
        rfid_uid: rfid_uid,
        face_image_url: pending.face_image_url || pending.cor_url,
        enrolled_subjects: pending.enrolled_subjects // <--- ADDED THIS LINE
      }])
      .select()
      .single();

    if (createError) {
      console.error("Create Student Error:", createError);
      throw new Error("Failed to create student account.");
    }

    // 3. Update Pending Status
    const { error: updateError } = await supabase
      .from('pending_registrations')
      .update({ status: 'approved', rfid_uid: rfid_uid, updated_at: new Date() })
      .eq('id', id);

    if (updateError) {
      console.error("Update Pending Error:", updateError);
      throw new Error("Student created, but failed to update pending status.");
    }

    res.json({ message: 'Approved', student });
  } catch (error) { next(error); }
};

// 5. Reject Pending
export const rejectPending = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('pending_registrations')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Registration permanently deleted' });
  } catch (error) { next(error); }
};