import { dbRun } from '../database/db.js';

export const up = async () => {
  // We ensure subject_code and date exist for easier filtering
  await dbRun(`
    CREATE TABLE IF NOT EXISTS attendance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      subject_code TEXT NOT NULL,
      room TEXT,
      device_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      date TEXT, 
      status TEXT DEFAULT 'present',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log('✅ Attendance logs table created/verified');
};

export const down = async () => {
  await dbRun('DROP TABLE IF EXISTS attendance_logs');
};