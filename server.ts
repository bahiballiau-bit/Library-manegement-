import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Database
const db = new Database('library.db');

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    student_id TEXT PRIMARY KEY,
    name TEXT,
    father_name TEXT,
    mobile TEXT,
    parent_mobile TEXT,
    address TEXT,
    class_name TEXT,
    join_date TEXT,
    shift TEXT,
    shift_start_time TEXT,
    shift_end_time TEXT,
    fee_amount INTEGER
  );

  CREATE TABLE IF NOT EXISTS fees (
    receipt_no TEXT PRIMARY KEY,
    student_id TEXT,
    student_name TEXT,
    month TEXT,
    year TEXT,
    amount INTEGER,
    payment_mode TEXT,
    payment_date TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    student_name TEXT,
    date TEXT,
    entry_time TEXT,
    exit_time TEXT,
    total_hours TEXT
  );

  CREATE TABLE IF NOT EXISTS books (
    book_id TEXT PRIMARY KEY,
    title TEXT,
    author TEXT,
    quantity INTEGER,
    available INTEGER
  );

  CREATE TABLE IF NOT EXISTS book_issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id TEXT,
    student_id TEXT,
    issue_date TEXT,
    return_date TEXT
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Endpoints

  // --- Students ---
  app.get('/api/students', (req, res) => {
    const stmt = db.prepare('SELECT * FROM students');
    const students = stmt.all();
    res.json(students);
  });

  app.post('/api/students', (req, res) => {
    const { name, fatherName, mobile, parentMobile, address, className, joinDate, shift, shiftStartTime, shiftEndTime, feeAmount } = req.body;
    
    // Generate Student ID
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM students');
    const result = countStmt.get() as { count: number };
    const studentId = "LIB" + (result.count + 1).toString().padStart(4, '0');

    const stmt = db.prepare(`
      INSERT INTO students (student_id, name, father_name, mobile, parent_mobile, address, class_name, join_date, shift, shift_start_time, shift_end_time, fee_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(studentId, name, fatherName, mobile, parentMobile, address, className, joinDate, shift, shiftStartTime, shiftEndTime, feeAmount || 500);
      res.json({ success: true, message: "Student added successfully!", studentId });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- Fees ---
  app.get('/api/fees', (req, res) => {
    const stmt = db.prepare('SELECT * FROM fees ORDER BY payment_date DESC');
    const fees = stmt.all();
    res.json(fees);
  });

  app.post('/api/fees', (req, res) => {
    const { studentId, month, year, amount, paymentMode } = req.body;
    
    const studentStmt = db.prepare('SELECT name FROM students WHERE student_id = ?');
    const student = studentStmt.get(studentId) as { name: string };
    const studentName = student ? student.name : 'Unknown';

    const receiptNo = "RCP" + new Date().getTime();
    const paymentDate = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO fees (receipt_no, student_id, student_name, month, year, amount, payment_mode, payment_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(receiptNo, studentId, studentName, month, year, amount, paymentMode, paymentDate, "Paid");
      res.json({ success: true, message: "Fee submitted successfully!", receiptNo });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/due-fees', (req, res) => {
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    const currentYear = new Date().getFullYear().toString();

    const studentsStmt = db.prepare('SELECT * FROM students');
    const students = studentsStmt.all() as any[];

    const feesStmt = db.prepare('SELECT * FROM fees WHERE month = ? AND year = ?');
    const paidFees = feesStmt.all(currentMonth, currentYear) as any[];

    const paidStudentIds = new Set(paidFees.map(f => f.student_id));

    const dueStudents = students.filter(s => !paidStudentIds.has(s.student_id)).map(s => ({
      studentId: s.student_id,
      name: s.name,
      mobile: s.mobile,
      parentMobile: s.parent_mobile,
      className: s.class_name
    }));

    res.json(dueStudents);
  });

  // --- Attendance ---
  app.get('/api/attendance', (req, res) => {
    const { date } = req.query;
    let stmt;
    if (date) {
      stmt = db.prepare('SELECT * FROM attendance WHERE date = ?');
      res.json(stmt.all(date));
    } else {
      stmt = db.prepare('SELECT * FROM attendance ORDER BY date DESC, entry_time DESC');
      res.json(stmt.all());
    }
  });

  app.post('/api/attendance', (req, res) => {
    const { studentId, date, entryTime, exitTime, totalHours } = req.body;

    const studentStmt = db.prepare('SELECT name FROM students WHERE student_id = ?');
    const student = studentStmt.get(studentId) as { name: string };
    const studentName = student ? student.name : 'Unknown';

    const stmt = db.prepare(`
      INSERT INTO attendance (student_id, student_name, date, entry_time, exit_time, total_hours)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(studentId, studentName, date, entryTime, exitTime, totalHours);
      res.json({ success: true, message: "Attendance marked successfully!" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- Books ---
  app.get('/api/books', (req, res) => {
    const stmt = db.prepare('SELECT * FROM books');
    res.json(stmt.all());
  });

  app.post('/api/books', (req, res) => {
    const { title, author, quantity } = req.body;
    const bookId = "BK" + new Date().getTime().toString().slice(-6);

    const stmt = db.prepare(`
      INSERT INTO books (book_id, title, author, quantity, available)
      VALUES (?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(bookId, title, author, quantity, quantity);
      res.json({ success: true, message: "Book added successfully!", bookId });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/books/issue', (req, res) => {
    const { bookId, studentId } = req.body;

    const bookStmt = db.prepare('SELECT available FROM books WHERE book_id = ?');
    const book = bookStmt.get(bookId) as { available: number };

    if (!book || book.available <= 0) {
      return res.status(400).json({ success: false, message: "Book not available or not found!" });
    }

    const updateBook = db.prepare('UPDATE books SET available = available - 1 WHERE book_id = ?');
    const insertIssue = db.prepare('INSERT INTO book_issues (book_id, student_id, issue_date) VALUES (?, ?, ?)');

    const transaction = db.transaction(() => {
      updateBook.run(bookId);
      insertIssue.run(bookId, studentId, new Date().toISOString());
    });

    try {
      transaction();
      res.json({ success: true, message: "Book issued successfully!" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- Dashboard Stats ---
  app.get('/api/dashboard-stats', (req, res) => {
    const studentsCount = (db.prepare('SELECT COUNT(*) as count FROM students').get() as any).count;
    
    const today = new Date().toISOString().split('T')[0]; // Simple YYYY-MM-DD check might need refinement based on how date is stored
    // Actually, let's just match the string format stored in attendance
    // In React app we will send YYYY-MM-DD
    const attendanceCount = (db.prepare('SELECT COUNT(*) as count FROM attendance WHERE date = ?').get(today) as any).count;

    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    const currentYear = new Date().getFullYear().toString();
    const collectionResult = db.prepare('SELECT SUM(amount) as total FROM fees WHERE month = ? AND year = ?').get(currentMonth, currentYear) as any;
    const monthlyCollection = collectionResult.total || 0;

    const totalRevenueResult = db.prepare('SELECT SUM(amount) as total FROM fees').get() as any;
    const totalRevenue = totalRevenueResult.total || 0;

    // Due fees calculation (simplified reuse of logic)
    // For performance, we could optimize, but reusing the logic is safer for consistency
    const students = db.prepare('SELECT student_id FROM students').all() as any[];
    const paidFees = db.prepare('SELECT student_id FROM fees WHERE month = ? AND year = ?').all(currentMonth, currentYear) as any[];
    const paidIds = new Set(paidFees.map(f => f.student_id));
    const dueFeesCount = students.length - paidIds.size;

    res.json({
      totalStudents: studentsCount,
      todayAttendance: attendanceCount,
      monthlyCollection,
      totalRevenue,
      dueFees: dueFeesCount,
      totalBooks: (db.prepare('SELECT COUNT(*) as count FROM books').get() as any).count
    });
  });


  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
