import supabase from '../config/supabaseClient.js';

// 1. Get All Students (Filtered by Teacher's Subjects)
export const getAllStudents = async (req, res, next) => {
  try {
    const { role, id } = req.user; // Get logged-in user info from Token

    // Fetch all students first
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    // IF ADMIN: Return everyone
    if (role === 'admin') {
      return res.json(students);
    }

    // IF TEACHER: Filter based on assigned subjects
    if (role === 'teacher') {
      // 1. Get subjects this teacher is teaching
      const { data: schedules, error: schedError } = await supabase
        .from('schedules')
        .select('subject_code')
        .eq('teacher_id', id);

      if (schedError) throw schedError;

      if (!schedules || schedules.length === 0) {
        return res.json([]); // Teacher has no classes, so no students visible
      }

      // Extract subject codes (e.g., ['CPE16', 'MATH101'])
      const teacherSubjects = schedules.map(s => s.subject_code);

      // 2. Filter students who have at least one matching subject
      const filteredStudents = students.filter(student => {
        if (!student.enrolled_subjects) return false;
        
        // Check if the student's subject string contains any of the teacher's subjects
        return teacherSubjects.some(sub => student.enrolled_subjects.includes(sub));
      });

      return res.json(filteredStudents);
    }

    // Default fallback (if role is unknown)
    res.json([]);

  } catch (error) { next(error); }
};

// 2. Get Student by ID
export const getStudentById = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Student not found' });
    res.json(data);
  } catch (error) { next(error); }
};

// 3. Create Student
export const createStudent = async (req, res, next) => {
  try {
    const { full_name, student_id, course, rfid_uid, face_image_url, enrolled_subjects } = req.body;
    
    const { data, error } = await supabase
      .from('students')
      .insert([{ full_name, student_id, course, rfid_uid, face_image_url, enrolled_subjects }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { next(error); }
};

// 4. Update Student
export const updateStudent = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) { next(error); }
};

// 5. Delete Student
export const deleteStudent = async (req, res, next) => {
  try {
    const { error } = await supabase.from('students').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Student deleted successfully' });
  } catch (error) { next(error); }
};

// 6. Sync Students (For Kiosk)
export const syncStudents = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id, full_name, student_id, rfid_uid, face_image_url, enrolled_subjects');
    
    if (error) throw error;
    res.json(data);
  } catch (error) { next(error); }
};