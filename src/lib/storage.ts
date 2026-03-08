import { LucideIcon } from 'lucide-react';

// Types
export interface Student {
  student_id: string;
  name: string;
  father_name: string;
  mobile: string;
  parent_mobile: string;
  address: string;
  class_name: string;
  join_date: string;
  shift: string;
  shift_start_time?: string;
  shift_end_time?: string;
  fee_amount: number;
}

export interface FeeRecord {
  receipt_no: string;
  student_id: string;
  student_name: string;
  month: string;
  year: string;
  amount: number;
  payment_mode: string;
  payment_date: string;
  status: string;
}

export interface AttendanceRecord {
  id: number;
  student_id: string;
  student_name: string;
  date: string;
  entry_time: string;
  exit_time: string;
  total_hours: string;
}

export interface Book {
  book_id: string;
  title: string;
  author: string;
  quantity: number;
  available: number;
}

export interface DashboardStats {
  totalStudents: number;
  todayAttendance: number;
  monthlyCollection: number;
  totalRevenue: number;
  dueFees: number;
  totalBooks: number;
}

// Storage Keys
const KEYS = {
  STUDENTS: 'lib_students',
  FEES: 'lib_fees',
  ATTENDANCE: 'lib_attendance',
  BOOKS: 'lib_books',
  ARCHIVED_STUDENTS: 'lib_archived_students',
};

export interface ArchivedStudent extends Student {
  months_studied: number;
  fees_paid_count: number;
  total_fees_paid: number;
  last_payment_date: string | null;
  archived_date: string;
  attendance_records: AttendanceRecord[];
}

// ... (existing code)

// --- Archived Students ---
export const getArchivedStudents = (): ArchivedStudent[] => get(KEYS.ARCHIVED_STUDENTS);

export const archiveStudent = (studentId: string) => {
  const students = getStudents();
  const studentIndex = students.findIndex(s => s.student_id === studentId);
  
  if (studentIndex === -1) return null;
  
  const student = students[studentIndex];
  const fees = getFees().filter(f => f.student_id === studentId);
  const allAttendance = getAttendance();
  const studentAttendance = allAttendance.filter(a => a.student_id === studentId);
  const remainingAttendance = allAttendance.filter(a => a.student_id !== studentId);
  
  // Calculate stats
  const joinDate = new Date(student.join_date);
  const archiveDate = new Date();
  const monthsStudied = (archiveDate.getFullYear() - joinDate.getFullYear()) * 12 + (archiveDate.getMonth() - joinDate.getMonth()) + 1;
  
  const feesPaidCount = fees.length;
  const totalFeesPaid = fees.reduce((sum, f) => sum + f.amount, 0);
  const lastPaymentDate = fees.length > 0 ? fees[0].payment_date : null;

  const archivedStudent: ArchivedStudent = {
    ...student,
    months_studied: Math.max(1, monthsStudied), // Ensure at least 1 month
    fees_paid_count: feesPaidCount,
    total_fees_paid: totalFeesPaid,
    last_payment_date: lastPaymentDate,
    archived_date: archiveDate.toISOString(),
    attendance_records: studentAttendance
  };

  // Save to archive
  const archivedStudents = getArchivedStudents();
  set(KEYS.ARCHIVED_STUDENTS, [archivedStudent, ...archivedStudents]);

  // Remove from current students
  students.splice(studentIndex, 1);
  set(KEYS.STUDENTS, students);

  // Remove from attendance
  set(KEYS.ATTENDANCE, remainingAttendance);

  return archivedStudent;
};

// Helper to get data
const get = (key: string) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading from storage', e);
    return [];
  }
};

// Helper to set data
const set = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error writing to storage', e);
  }
};

// --- Students ---
export const getStudents = (): Student[] => get(KEYS.STUDENTS);

export const addStudent = (data: any) => {
  const students = getStudents();
  
  // Find the maximum ID number from existing students
  const maxId = students.reduce((max, student) => {
    const idPart = parseInt(student.student_id.replace('LIB', ''), 10);
    return !isNaN(idPart) && idPart > max ? idPart : max;
  }, 0);
  
  const nextId = maxId + 1;
  const student_id = `LIB${nextId.toString().padStart(4, '0')}`;
  
  const newStudent: Student = {
    student_id,
    name: data.name,
    father_name: data.fatherName,
    mobile: data.mobile,
    parent_mobile: data.parentMobile,
    address: data.address,
    class_name: data.className,
    join_date: data.joinDate,
    shift: data.shift,
    shift_start_time: data.shiftStartTime,
    shift_end_time: data.shiftEndTime,
    fee_amount: Number(data.feeAmount || 0)
  };
  set(KEYS.STUDENTS, [...students, newStudent]);
  return newStudent;
};

// --- Fees ---
export const getFees = (): FeeRecord[] => {
  const fees = get(KEYS.FEES);
  return fees.sort((a: FeeRecord, b: FeeRecord) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
};

export const addFee = (data: any) => {
  const fees = getFees();
  const students = getStudents();
  const student = students.find(s => s.student_id === data.studentId);
  
  const newFee: FeeRecord = {
    receipt_no: `RCP${Date.now()}`,
    student_id: data.studentId,
    student_name: student ? student.name : 'Unknown',
    month: data.month,
    year: data.year,
    amount: Number(data.amount),
    payment_mode: data.paymentMode,
    payment_date: new Date().toISOString(),
    status: 'Paid'
  };
  
  set(KEYS.FEES, [newFee, ...fees]); // Add to beginning
  return newFee;
};

export const getDueFees = () => {
  const students = getStudents();
  const fees = getFees();
  
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const currentYear = new Date().getFullYear().toString();
  
  const paidStudentIds = new Set(
    fees
      .filter((f: FeeRecord) => f.month === currentMonth && f.year === currentYear)
      .map((f: FeeRecord) => f.student_id)
  );

  return students
    .filter(s => !paidStudentIds.has(s.student_id))
    .map(s => ({
      studentId: s.student_id,
      name: s.name,
      mobile: s.mobile,
      parentMobile: s.parent_mobile,
      className: s.class_name,
      feeAmount: s.fee_amount
    }));
};

// --- Attendance ---
export const getAttendance = (): AttendanceRecord[] => {
  const attendance = get(KEYS.ATTENDANCE);
  return attendance.sort((a: AttendanceRecord, b: AttendanceRecord) => 
    new Date(b.date + 'T' + b.entry_time).getTime() - new Date(a.date + 'T' + a.entry_time).getTime()
  );
};

export const markAttendance = (data: any) => {
  const attendance = getAttendance();
  const students = getStudents();
  const student = students.find(s => s.student_id === data.studentId);

  const newRecord: AttendanceRecord = {
    id: Date.now(),
    student_id: data.studentId,
    student_name: student ? student.name : 'Unknown',
    date: data.date,
    entry_time: data.entryTime,
    exit_time: data.exitTime,
    total_hours: data.totalHours
  };

  set(KEYS.ATTENDANCE, [newRecord, ...attendance]);
  return newRecord;
};

// --- Books ---
export const getBooks = (): Book[] => get(KEYS.BOOKS);

export const addBook = (data: any) => {
  const books = getBooks();
  const book_id = `BK${Date.now().toString().slice(-6)}`;
  const newBook: Book = {
    book_id,
    title: data.title,
    author: data.author,
    quantity: Number(data.quantity),
    available: Number(data.quantity)
  };
  set(KEYS.BOOKS, [...books, newBook]);
  return newBook;
};

// --- Dashboard ---
export const getDashboardStats = (): DashboardStats => {
  const students = getStudents();
  const fees = getFees();
  const attendance = getAttendance();
  const books = getBooks();

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter((a: AttendanceRecord) => a.date === today).length;

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const currentYear = new Date().getFullYear().toString();

  const monthlyCollection = fees
    .filter((f: FeeRecord) => f.month === currentMonth && f.year === currentYear)
    .reduce((sum: number, f: FeeRecord) => sum + f.amount, 0);

  const totalRevenue = fees.reduce((sum: number, f: FeeRecord) => sum + f.amount, 0);

  const dueFees = getDueFees().length;

  return {
    totalStudents: students.length,
    todayAttendance,
    monthlyCollection,
    totalRevenue,
    dueFees,
    totalBooks: books.length
  };
};
