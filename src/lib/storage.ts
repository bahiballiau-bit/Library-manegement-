import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  deleteDoc, 
  setDoc, 
  getDoc,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from './firebase';

// Types
export interface Student {
  id?: string;
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
  uid: string;
}

export interface FeeRecord {
  id?: string;
  receipt_no: string;
  student_id: string;
  student_name: string;
  month: string;
  year: string;
  amount: number;
  payment_mode: string;
  payment_date: string;
  status: string;
  uid: string;
}

export interface AttendanceRecord {
  id?: string;
  student_id: string;
  student_name: string;
  date: string;
  entry_time: string;
  exit_time: string;
  total_hours: string;
  uid: string;
}

export interface Book {
  id?: string;
  book_id: string;
  title: string;
  author: string;
  quantity: number;
  available: number;
  uid: string;
}

export interface DashboardStats {
  totalStudents: number;
  todayAttendance: number;
  monthlyCollection: number;
  totalRevenue: number;
  dueFees: number;
  totalBooks: number;
}

export interface ArchivedStudent extends Student {
  months_studied: number;
  fees_paid_count: number;
  total_fees_paid: number;
  last_payment_date: string | null;
  archived_date: string;
  attendance_records: AttendanceRecord[];
}

// Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Connection Test ---
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}

// --- Students ---
export const getStudents = async (): Promise<Student[]> => {
  if (!auth.currentUser) return [];
  const path = 'students';
  try {
    const q = query(collection(db, path), where('uid', '==', auth.currentUser.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const addStudent = async (data: any) => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  const path = 'students';
  try {
    const students = await getStudents();
    const maxId = students.reduce((max, student) => {
      const idPart = parseInt(student.student_id.replace('LIB', ''), 10);
      return !isNaN(idPart) && idPart > max ? idPart : max;
    }, 0);
    
    const nextId = maxId + 1;
    const student_id = `LIB${nextId.toString().padStart(4, '0')}`;
    
    const newStudent: Omit<Student, 'id'> = {
      student_id,
      name: data.name,
      father_name: data.fatherName,
      mobile: data.mobile,
      parent_mobile: data.parentMobile,
      address: data.address,
      class_name: data.className,
      join_date: data.joinDate,
      shift: data.shift,
      shift_start_time: data.shiftStartTime || '',
      shift_end_time: data.shiftEndTime || '',
      fee_amount: Number(data.feeAmount || 0),
      uid: auth.currentUser.uid
    };
    
    const docRef = await addDoc(collection(db, path), newStudent);
    return { id: docRef.id, ...newStudent };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

// --- Fees ---
export const getFees = async (): Promise<FeeRecord[]> => {
  if (!auth.currentUser) return [];
  const path = 'fees';
  try {
    const q = query(
      collection(db, path), 
      where('uid', '==', auth.currentUser.uid),
      orderBy('payment_date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeeRecord));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const addFee = async (data: any) => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  const path = 'fees';
  try {
    const students = await getStudents();
    const student = students.find(s => s.student_id === data.studentId);
    
    const newFee: Omit<FeeRecord, 'id'> = {
      receipt_no: `RCP${Date.now()}`,
      student_id: data.studentId,
      student_name: student ? student.name : 'Unknown',
      month: data.month,
      year: data.year,
      amount: Number(data.amount),
      payment_mode: data.paymentMode,
      payment_date: new Date().toISOString(),
      status: 'Paid',
      uid: auth.currentUser.uid
    };
    
    const docRef = await addDoc(collection(db, path), newFee);
    return { id: docRef.id, ...newFee };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const getDueFees = async () => {
  const students = await getStudents();
  const fees = await getFees();
  
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
export const getAttendance = async (): Promise<AttendanceRecord[]> => {
  if (!auth.currentUser) return [];
  const path = 'attendance';
  try {
    const q = query(
      collection(db, path), 
      where('uid', '==', auth.currentUser.uid),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const markAttendance = async (data: any) => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  const path = 'attendance';
  try {
    const students = await getStudents();
    const student = students.find(s => s.student_id === data.studentId);

    const newRecord: Omit<AttendanceRecord, 'id'> = {
      student_id: data.studentId,
      student_name: student ? student.name : 'Unknown',
      date: data.date,
      entry_time: data.entryTime,
      exit_time: data.exitTime,
      total_hours: data.totalHours,
      uid: auth.currentUser.uid
    };

    const docRef = await addDoc(collection(db, path), newRecord);
    return { id: docRef.id, ...newRecord };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

// --- Books ---
export const getBooks = async (): Promise<Book[]> => {
  if (!auth.currentUser) return [];
  const path = 'books';
  try {
    const q = query(collection(db, path), where('uid', '==', auth.currentUser.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const addBook = async (data: any) => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  const path = 'books';
  try {
    const book_id = `BK${Date.now().toString().slice(-6)}`;
    const newBook: Omit<Book, 'id'> = {
      book_id,
      title: data.title,
      author: data.author,
      quantity: Number(data.quantity),
      available: Number(data.quantity),
      uid: auth.currentUser.uid
    };
    const docRef = await addDoc(collection(db, path), newBook);
    return { id: docRef.id, ...newBook };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

// --- Archived Students ---
export const getArchivedStudents = async (): Promise<ArchivedStudent[]> => {
  if (!auth.currentUser) return [];
  const path = 'archived_students';
  try {
    const q = query(collection(db, path), where('uid', '==', auth.currentUser.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArchivedStudent));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const archiveStudent = async (studentId: string) => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  try {
    const students = await getStudents();
    const student = students.find(s => s.student_id === studentId);
    
    if (!student || !student.id) return null;
    
    const fees = (await getFees()).filter(f => f.student_id === studentId);
    const studentAttendance = (await getAttendance()).filter(a => a.student_id === studentId);
    
    // Calculate stats
    const joinDate = new Date(student.join_date);
    const archiveDate = new Date();
    const monthsStudied = (archiveDate.getFullYear() - joinDate.getFullYear()) * 12 + (archiveDate.getMonth() - joinDate.getMonth()) + 1;
    
    const feesPaidCount = fees.length;
    const totalFeesPaid = fees.reduce((sum, f) => sum + f.amount, 0);
    const lastPaymentDate = fees.length > 0 ? fees[0].payment_date : null;

    const archivedStudent: Omit<ArchivedStudent, 'id'> = {
      ...student,
      months_studied: Math.max(1, monthsStudied),
      fees_paid_count: feesPaidCount,
      total_fees_paid: totalFeesPaid,
      last_payment_date: lastPaymentDate,
      archived_date: archiveDate.toISOString(),
      attendance_records: studentAttendance,
      uid: auth.currentUser.uid
    };

    // Save to archive
    await addDoc(collection(db, 'archived_students'), archivedStudent);

    // Remove from current students
    await deleteDoc(doc(db, 'students', student.id));

    // Remove attendance records (one by one for simplicity in this context)
    for (const record of studentAttendance) {
      if (record.id) {
        await deleteDoc(doc(db, 'attendance', record.id));
      }
    }

    return archivedStudent;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'archive');
  }
};

// --- Dashboard ---
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const students = await getStudents();
  const fees = await getFees();
  const attendance = await getAttendance();
  const books = await getBooks();

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter((a: AttendanceRecord) => a.date === today).length;

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const currentYear = new Date().getFullYear().toString();

  const monthlyCollection = fees
    .filter((f: FeeRecord) => f.month === currentMonth && f.year === currentYear)
    .reduce((sum: number, f: FeeRecord) => sum + f.amount, 0);

  const totalRevenue = fees.reduce((sum: number, f: FeeRecord) => sum + f.amount, 0);

  const dueFees = (await getDueFees()).length;

  return {
    totalStudents: students.length,
    todayAttendance,
    monthlyCollection,
    totalRevenue,
    dueFees,
    totalBooks: books.length
  };
};

