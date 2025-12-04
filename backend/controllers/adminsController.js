import supabase from '../config/supabaseClient.js';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generatePassword = (length = 8) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};

// 1. Get All Admins
export const getAllAdmins = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id, username, full_name, email, role, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) { next(error); }
};

// 2. Create Admin
export const createAdmin = async (req, res, next) => {
  try {
    const { full_name, email, username, current_password } = req.body;
    const currentAdminId = req.user.id;

    if (!full_name || !email || !username || !current_password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Verify Current Admin
    const { data: currentAdmin, error: fetchError } = await supabase
      .from('admins')
      .select('password_hash')
      .eq('id', currentAdminId)
      .single();

    if (fetchError || !currentAdmin) return res.status(401).json({ error: 'Authorization failed' });

    const isMatch = await bcrypt.compare(current_password, currentAdmin.password_hash);
    if (!isMatch) return res.status(403).json({ error: 'Incorrect password.' });

    // Create New
    const newPlainPassword = generatePassword();
    const newPasswordHash = await bcrypt.hash(newPlainPassword, 10);

    const { data: newAdmin, error: createError } = await supabase
      .from('admins')
      .insert([{ username, password_hash: newPasswordHash, full_name, email, role: 'admin' }])
      .select()
      .single();

    if (createError) throw createError;

    // Send Email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Admin Access Granted',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Admin Access Granted</h2>
          <p>Username: <strong>${username}</strong></p>
          <p>Password: <strong>${newPlainPassword}</strong></p>
        </div>
      `
    });

    res.status(201).json({ message: 'Admin created', admin: newAdmin });
  } catch (error) { next(error); }
};

// 3. Update Admin (NEW)
export const updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, email, username, password } = req.body;

    const updates = { full_name, email, username };
    
    // Only update password if provided
    if (password && password.trim() !== "") {
      const saltRounds = 10;
      updates.password_hash = await bcrypt.hash(password, saltRounds);
    }

    const { data, error } = await supabase
      .from('admins')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) { next(error); }
};

// 4. Delete Admin
export const deleteAdmin = async (req, res, next) => {
  try {
    if (req.params.id == req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }
    const { error } = await supabase.from('admins').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Admin removed' });
  } catch (error) { next(error); }
};