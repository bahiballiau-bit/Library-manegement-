import React, { useState, useEffect, useMemo, ErrorInfo, ReactNode, Component } from 'react';
import { 
  Users, Clock, IndianRupee, AlertTriangle, 
  UserPlus, BookOpen, Menu, X, Home, Search, Moon, Sun, Archive, Trash2, TrendingUp, MessageCircle, Bell, MessageSquare, Check, ArrowRight, LogOut, WifiOff, Plus,
  User as UserIcon, Calendar, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getDashboardStats, getFees, getStudents, getAttendance, getBooks, getDueFees,
  addStudent, addFee, markAttendance, addBook, getArchivedStudents, archiveStudent,
  Student, FeeRecord, AttendanceRecord, Book, DashboardStats, ArchivedStudent,
  testConnection
} from './lib/storage';
import { sendSMS, formatFeeReminder, formatAttendanceAlert, formatFeeReceipt } from './lib/notifications';
import { auth } from './lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from 'firebase/auth';
import QRCode from "react-qr-code";

// Error Boundary
class ErrorBoundary extends Component<any, any> {
  public state: any;
  public props: any;

  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      if (this.state.error && this.state.error.message) {
        try {
          const parsedError = JSON.parse(this.state.error.message);
          errorMessage = `Firestore Error: ${parsedError.error} during ${parsedError.operationType} on ${parsedError.path}`;
        } catch (e) {
          errorMessage = this.state.error.message;
        }
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Application Error</h2>
            <p className="text-slate-600 mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

function MainApp() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    todayAttendance: 0,
    monthlyCollection: 0,
    totalRevenue: 0,
    dueFees: 0,
    totalBooks: 0
  });
  const [allFees, setAllFees] = useState<FeeRecord[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Modal States
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showSubmitFee, setShowSubmitFee] = useState(false);
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showDueFees, setShowDueFees] = useState(false);
  const [showRevenue, setShowRevenue] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthLoading(false);
      if (user) {
        fetchDashboardData();
        testConnection();
      }
    });

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const fetchDashboardData = async () => {
    if (!auth.currentUser) return;
    try {
      const statsData = await getDashboardStats();
      setStats(statsData);

      const feesData = await getFees();
      setAllFees(feesData);

      const studentsData = await getStudents();
      setAllStudents(studentsData);

      const attendanceData = await getAttendance();
      setAllAttendance(attendanceData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`max-w-md w-full p-8 rounded-2xl shadow-2xl text-center ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}
        >
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
            <BookOpen size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">LibManager</h1>
          <p className={`mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Professional Library Management System</p>
          
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 py-3 px-4 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>
          
          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Secure Cloud Access</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col lg:flex-row ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar - Hidden on mobile, shown on desktop */}
      <aside
        className={`hidden lg:flex flex-col w-64 shadow-xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'}`}
      >
        <div className="p-6 flex items-center gap-3 font-bold text-xl">
          <BookOpen className="text-indigo-400" />
          <span>LibManager</span>
        </div>
        
        <nav className="mt-6 px-4 space-y-2 flex-1">
          <NavItem icon={<Home size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} isDarkMode={isDarkMode} />
          <NavItem icon={<Users size={20} />} label="Students" active={activeTab === 'students'} onClick={() => setActiveTab('students')} isDarkMode={isDarkMode} />
          <NavItem icon={<IndianRupee size={20} />} label="Fees" active={activeTab === 'fees'} onClick={() => setActiveTab('fees')} isDarkMode={isDarkMode} />
          <NavItem icon={<Clock size={20} />} label="Attendance" active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} isDarkMode={isDarkMode} />
          <NavItem icon={<BookOpen size={20} />} label="Books" active={activeTab === 'books'} onClick={() => setActiveTab('books')} isDarkMode={isDarkMode} />
          <NavItem icon={<Archive size={20} />} label="Recycle Bin" active={activeTab === 'archived'} onClick={() => setActiveTab('archived')} isDarkMode={isDarkMode} />
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className={`shadow-sm h-16 flex items-center justify-between px-4 lg:px-6 z-40 ${isDarkMode ? 'bg-slate-800 border-b border-slate-700' : 'bg-white'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 lg:hidden">
              <BookOpen size={20} />
            </div>
            <div>
              <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                {activeTab === 'dashboard' ? 'LibManager' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
              {isOffline && (
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-500">
                  <WifiOff size={10} />
                  <span>Offline</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleDarkMode} 
              className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
              {user.photoURL ? <img src={user.photoURL} alt="User" referrerPolicy="no-referrer" /> : user.displayName?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className={`flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <DashboardContent 
                  stats={stats} 
                  fees={allFees} 
                  onAddStudent={() => setShowAddStudent(true)}
                  onSubmitFee={() => setShowSubmitFee(true)}
                  onMarkAttendance={() => setShowMarkAttendance(true)}
                  onAddBook={() => setShowAddBook(true)}
                  onShowDueFees={() => setShowDueFees(true)}
                  onShowRevenue={() => setShowRevenue(true)}
                  onSelectStudentId={setSelectedStudentId}
                  isDarkMode={isDarkMode}
                />
              )}
              {activeTab === 'students' && <StudentsList isDarkMode={isDarkMode} onUpdate={fetchDashboardData} onSelectStudent={setSelectedStudent} />}
              {activeTab === 'fees' && <FeesList isDarkMode={isDarkMode} onSelectStudentId={setSelectedStudentId} />}
              {activeTab === 'attendance' && <AttendanceList isDarkMode={isDarkMode} onSelectStudentId={setSelectedStudentId} />}
              {activeTab === 'books' && <BooksList isDarkMode={isDarkMode} />}
              {activeTab === 'archived' && <ArchivedStudentsList isDarkMode={isDarkMode} />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Floating Action Button - Mobile Only */}
        <div className="lg:hidden fixed bottom-20 right-4 z-50">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus size={28} className={`transition-transform duration-300 ${showQuickActions ? 'rotate-45' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showQuickActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="absolute bottom-16 right-0 space-y-3 w-48"
              >
                <QuickActionItem icon={<UserPlus size={18} />} label="Add Student" onClick={() => { setShowAddStudent(true); setShowQuickActions(false); }} isDarkMode={isDarkMode} />
                <QuickActionItem icon={<IndianRupee size={18} />} label="Submit Fee" onClick={() => { setShowSubmitFee(true); setShowQuickActions(false); }} isDarkMode={isDarkMode} />
                <QuickActionItem icon={<Clock size={18} />} label="Attendance" onClick={() => { setShowMarkAttendance(true); setShowQuickActions(false); }} isDarkMode={isDarkMode} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <nav className={`lg:hidden fixed bottom-0 inset-x-0 h-16 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex items-center justify-around px-2 z-50 ${isDarkMode ? 'bg-slate-800 border-t border-slate-700' : 'bg-white'}`}>
          <BottomNavItem icon={<Home size={20} />} label="Home" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} isDarkMode={isDarkMode} />
          <BottomNavItem icon={<Users size={20} />} label="Students" active={activeTab === 'students'} onClick={() => setActiveTab('students')} isDarkMode={isDarkMode} />
          <div className="w-12 h-12" /> {/* Spacer for FAB */}
          <BottomNavItem icon={<IndianRupee size={20} />} label="Fees" active={activeTab === 'fees'} onClick={() => setActiveTab('fees')} isDarkMode={isDarkMode} />
          <BottomNavItem icon={<Menu size={20} />} label="More" active={['attendance', 'books', 'archived'].includes(activeTab)} onClick={() => setActiveTab('attendance')} isDarkMode={isDarkMode} />
        </nav>
      </div>

      {/* Modals */}
      <AddStudentModal isOpen={showAddStudent} onClose={() => setShowAddStudent(false)} onSuccess={fetchDashboardData} isDarkMode={isDarkMode} />
      <SubmitFeeModal isOpen={showSubmitFee} onClose={() => setShowSubmitFee(false)} onSuccess={fetchDashboardData} isDarkMode={isDarkMode} />
      <MarkAttendanceModal isOpen={showMarkAttendance} onClose={() => setShowMarkAttendance(false)} onSuccess={fetchDashboardData} isDarkMode={isDarkMode} />
      <AddBookModal isOpen={showAddBook} onClose={() => setShowAddBook(false)} onSuccess={fetchDashboardData} isDarkMode={isDarkMode} />
      <StudentDetailsModal 
        isOpen={!!selectedStudent || !!selectedStudentId} 
        onClose={() => { setSelectedStudent(null); setSelectedStudentId(null); }} 
        student={selectedStudent} 
        studentId={selectedStudentId}
        isDarkMode={isDarkMode} 
      />
      <DueFeesModal isOpen={showDueFees} onClose={() => setShowDueFees(false)} isDarkMode={isDarkMode} />
      <RevenueModal isOpen={showRevenue} onClose={() => setShowRevenue(false)} stats={stats} isDarkMode={isDarkMode} />
    </div>
  );
}

// --- Sub-Components ---

function NavItem({ icon, label, active, onClick, isDarkMode }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, isDarkMode: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative overflow-hidden ${
        active 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
          : isDarkMode 
            ? 'text-slate-400 hover:bg-slate-800 hover:text-white' 
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      <span className="font-bold text-sm tracking-tight">{label}</span>
      {active && (
        <motion.div 
          layoutId="activeNav"
          className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
        />
      )}
    </button>
  );
}

function BottomNavItem({ icon, label, active, onClick, isDarkMode }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all relative ${
        active 
          ? 'text-indigo-600' 
          : isDarkMode ? 'text-slate-500' : 'text-slate-400'
      }`}
    >
      <div className={`transition-all duration-300 ${active ? 'scale-110 -translate-y-1' : ''}`}>
        {icon}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-60'}`}>
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="bottomNavDot"
          className="absolute -bottom-1 w-1 h-1 bg-indigo-600 rounded-full"
        />
      )}
    </button>
  );
}

function QuickActionItem({ icon, label, onClick, isDarkMode }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl shadow-lg border transition-all active:scale-95 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' 
          : 'bg-white border-slate-100 text-slate-800 hover:bg-slate-50'
      }`}
    >
      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
        {icon}
      </div>
      <span className="font-semibold text-sm">{label}</span>
    </button>
  );
}

function DashboardContent({ stats, fees, onAddStudent, onSubmitFee, onMarkAttendance, onAddBook, onShowDueFees, onShowRevenue, onSelectStudentId, isDarkMode }: any) {
  const [timeFilter, setTimeFilter] = useState('latest');

  const filteredFees = useMemo(() => {
    if (timeFilter === 'latest') return fees.slice(0, 5);
    
    const now = new Date();
    const filterDate = new Date();
    
    switch(timeFilter) {
        case '1week': filterDate.setDate(now.getDate() - 7); break;
        case '1month': filterDate.setMonth(now.getMonth() - 1); break;
        case '2months': filterDate.setMonth(now.getMonth() - 2); break;
        case '3months': filterDate.setMonth(now.getMonth() - 3); break;
        case '6months': filterDate.setMonth(now.getMonth() - 6); break;
        case '12months': filterDate.setMonth(now.getMonth() - 12); break;
        case 'all': return fees;
        default: return fees.slice(0, 5);
    }
    
    return fees.filter((f: any) => new Date(f.payment_date) >= filterDate);
  }, [fees, timeFilter]);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className={`text-3xl font-black tracking-tight leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Welcome Back!</h2>
          <p className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Here's what's happening today.</p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-100 text-slate-500'}`}>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live System
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <StatCard 
          icon={<Users size={24} />} 
          label="Total Students" 
          value={stats.totalStudents} 
          color="from-indigo-500 to-indigo-600" 
          isDarkMode={isDarkMode} 
        />
        <StatCard 
          icon={<Clock size={24} />} 
          label="Today Attendance" 
          value={stats.todayAttendance} 
          color="from-amber-500 to-amber-600" 
          isDarkMode={isDarkMode} 
        />
        <StatCard 
          icon={<AlertTriangle size={24} />} 
          label="Due Fees" 
          value={stats.dueFees} 
          color="from-red-500 to-red-600" 
          onClick={onShowDueFees}
          isDarkMode={isDarkMode}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Quick Actions - Horizontal Scroll on Mobile */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Quick Actions</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
          <ActionCard icon={<UserPlus size={20} />} label="Add Student" onClick={onAddStudent} isDarkMode={isDarkMode} />
          <ActionCard icon={<IndianRupee size={20} />} label="Submit Fee" onClick={onSubmitFee} isDarkMode={isDarkMode} />
          <ActionCard icon={<TrendingUp size={20} />} label="Revenue" onClick={onShowRevenue} isDarkMode={isDarkMode} />
          <ActionCard icon={<Clock size={20} />} label="Attendance" onClick={onMarkAttendance} isDarkMode={isDarkMode} />
          <ActionCard icon={<BookOpen size={20} />} label="Add Book" onClick={onAddBook} isDarkMode={isDarkMode} />
        </div>
      </div>

      {/* Desktop Quick Actions */}
      <div className="hidden lg:block">
        <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Quick Actions</h3>
        <div className="grid grid-cols-5 gap-4">
          <ActionCard icon={<UserPlus />} label="Add Student" onClick={onAddStudent} isDarkMode={isDarkMode} />
          <ActionCard icon={<IndianRupee />} label="Submit Fee" onClick={onSubmitFee} isDarkMode={isDarkMode} />
          <ActionCard icon={<TrendingUp />} label="View Revenue" onClick={onShowRevenue} isDarkMode={isDarkMode} />
          <ActionCard icon={<Clock />} label="Mark Attendance" onClick={onMarkAttendance} isDarkMode={isDarkMode} />
          <ActionCard icon={<BookOpen />} label="Add Book" onClick={onAddBook} isDarkMode={isDarkMode} />
        </div>
      </div>

      {/* Recent Fees */}
      <div className={`rounded-3xl shadow-sm border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className={`px-5 py-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Recent Activity</h2>
          <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className={`text-[10px] font-black uppercase tracking-widest border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
          >
            <option value="latest">Latest 5</option>
            <option value="1week">Last 1 Week</option>
            <option value="1month">Last 1 Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
        
        {/* Mobile List View */}
        <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-700">
          {filteredFees.length > 0 ? (
            filteredFees.map((fee: any, index: number) => (
              <motion.div 
                key={fee.receipt_no} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 flex items-center justify-between active:bg-slate-50 dark:active:bg-slate-700/50 transition-colors cursor-pointer"
                onClick={() => onSelectStudentId(fee.student_id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                    <IndianRupee size={20} />
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{fee.student_name}</h4>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      {new Date(fee.payment_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} • #{fee.receipt_no}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₹{fee.amount}</p>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'}`}>Paid</span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className={`p-12 text-center space-y-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                <Clock size={32} className="text-slate-300 dark:text-slate-600" />
              </div>
              <p className="font-medium">No activity found</p>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className={`${isDarkMode ? 'bg-slate-700/30 text-slate-500' : 'bg-slate-50 text-slate-400'} text-[10px] font-black uppercase tracking-widest`}>
              <tr>
                <th className="px-6 py-4">Receipt</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
              {filteredFees.map((fee: any) => (
                <tr key={fee.receipt_no} className={`${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'} transition-colors group`}>
                  <td className={`px-6 py-4 font-mono text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>#{fee.receipt_no}</td>
                  <td 
                    className={`px-6 py-4 font-bold cursor-pointer group-hover:text-indigo-600 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                    onClick={() => onSelectStudentId(fee.student_id)}
                  >
                    {fee.student_name}
                  </td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {new Date(fee.payment_date).toLocaleDateString()}
                  </td>
                  <td className={`px-6 py-4 font-black text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₹{fee.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'}`}>
                      {fee.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, onClick, className = '', isDarkMode }: any) {
  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative overflow-hidden p-6 rounded-[32px] shadow-sm border transition-all cursor-pointer ${className} ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 rounded-full opacity-10 bg-gradient-to-br ${color}`} />
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} text-white flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/10`}>
          {icon}
        </div>
        <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
        <h3 className={`text-3xl font-black mt-1 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{value}</h3>
      </div>
    </motion.div>
  );
}

function ActionCard({ icon, label, onClick, isDarkMode }: any) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex-shrink-0 w-32 lg:w-auto p-5 rounded-[28px] shadow-sm border flex flex-col items-center gap-3 transition-all ${
        isDarkMode 
          ? 'bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700' 
          : 'bg-white border-slate-100 text-slate-800 hover:bg-slate-50'
      }`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${isDarkMode ? 'bg-slate-700 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
        {icon}
      </div>
      <span className="font-black text-[10px] uppercase tracking-widest text-center leading-tight">{label}</span>
    </motion.button>
  );
}

// Constants
const COURSE_OPTIONS = [
  "UPSC", "SSC", "Banking", "Railway", "Defense", 
  "IIT-JEE", "NEET", "CUET", "State Exams", 
  "Admission", "Other"
];

// --- Lists ---

function StudentsList({ isDarkMode, onUpdate, onSelectStudent }: any) {
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      const data = await getStudents();
      setStudents(data);
      setIsLoading(false);
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s => 
    (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     s.student_id.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (selectedClass === '' || s.class_name === selectedClass)
  );

  const handleArchive = (e: React.MouseEvent, studentId: string) => {
    e.stopPropagation();
    setStudentToDelete(studentId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (studentToDelete) {
      await archiveStudent(studentToDelete);
      const data = await getStudents();
      setStudents(data);
      if (onUpdate) onUpdate();
      setShowDeleteConfirm(false);
      setStudentToDelete(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className={`flex items-center px-4 py-3 rounded-2xl border shadow-sm focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-500 transition-all flex-1 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <Search className={`mr-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} size={20} />
          <input 
            type="text" 
            placeholder="Search by Name or ID..." 
            className={`w-full outline-none placeholder-slate-400 text-sm ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          value={selectedClass} 
          onChange={(e) => setSelectedClass(e.target.value)}
          className={`px-4 py-3 rounded-2xl border shadow-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all text-sm font-bold ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
        >
          <option value="">All Classes</option>
          {COURSE_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((s, index) => (
            <motion.div
              key={`${s.student_id}-${index}`}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectStudent(s)}
              className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{s.name}</h4>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    ID: {s.student_id} • {s.class_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => handleArchive(e, s.student_id)}
                  className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500"
                >
                  <Trash2 size={18} />
                </button>
                <ArrowRight size={18} className="text-slate-300" />
              </div>
            </motion.div>
          ))
        ) : (
          <div className={`p-8 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No students found</div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className={`hidden lg:block rounded-[32px] shadow-sm border overflow-hidden ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`${isDarkMode ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
              <tr>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">ID</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Name</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Class</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Shift</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Mobile</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
              {filteredStudents.map((s, index) => (
                <tr 
                  key={`${s.student_id}-${index}`} 
                  className={`cursor-pointer group ${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'} transition-colors`}
                  onClick={() => onSelectStudent(s)}
                >
                  <td className="px-8 py-5 font-mono text-xs text-slate-500">{s.student_id}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs">
                        {s.name.charAt(0)}
                      </div>
                      <span className="font-bold tracking-tight">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                      {s.class_name}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-slate-500 font-medium">{s.shift}</td>
                  <td className="px-8 py-5 text-slate-500 font-medium">{s.mobile}</td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={(e) => handleArchive(e, s.student_id)}
                      className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Confirm Delete" isDarkMode={isDarkMode}>
        <div className="space-y-4">
          <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Are you sure you want to delete this student? They will be moved to the Recycle Bin.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className={`px-4 py-2 rounded-lg border ${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FeesList({ isDarkMode, onSelectStudentId }: any) {
  const [fees, setFees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFees = async () => {
      const data = await getFees();
      setFees(data);
      setIsLoading(false);
    };
    fetchFees();
  }, []);

  const filteredFees = fees.filter(f => 
    f.student_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.receipt_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-center px-4 py-3 rounded-2xl border shadow-sm focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-500 transition-all max-w-md ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <Search className={`mr-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} size={20} />
        <input 
          type="text" 
          placeholder="Search by Student or Receipt..." 
          className={`w-full outline-none placeholder-slate-400 text-sm ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredFees.length > 0 ? (
          filteredFees.map((f, index) => (
            <motion.div
              key={`${f.receipt_no}-${index}`}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 
                    className={`font-bold text-sm cursor-pointer hover:text-indigo-600 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}
                    onClick={() => onSelectStudentId(f.student_id)}
                  >
                    {f.student_name}
                  </h4>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    Receipt: {f.receipt_no}
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-bold text-xs">
                  ₹{f.amount}
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                  <Calendar size={12} />
                  {f.month} {f.year}
                </div>
                <div className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {new Date(f.payment_date).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className={`p-8 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No fees found</div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className={`hidden lg:block rounded-[32px] shadow-sm border overflow-hidden ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`${isDarkMode ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
              <tr>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Receipt</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Student</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Month</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Amount</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Date</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
              {filteredFees.map((f, index) => (
                <tr key={`${f.receipt_no}-${index}`} className={`${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'} transition-colors`}>
                  <td className="px-8 py-5 font-mono text-xs text-slate-500">{f.receipt_no}</td>
                  <td className="px-8 py-5">
                    <div 
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => onSelectStudentId(f.student_id)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs">
                        {f.student_name.charAt(0)}
                      </div>
                      <span className="font-bold tracking-tight group-hover:text-indigo-600 transition-colors">{f.student_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                      {f.month} {f.year}
                    </span>
                  </td>
                  <td className="px-8 py-5 font-black text-green-600 dark:text-green-400">₹{f.amount}</td>
                  <td className="px-8 py-5 text-slate-500 font-medium">{new Date(f.payment_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AttendanceList({ isDarkMode, onSelectStudentId }: any) {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      const data = await getAttendance();
      setAttendance(data);
      setIsLoading(false);
    };
    fetchAttendance();
  }, []);

  const filteredAttendance = attendance.filter(a => 
    a.student_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-center px-4 py-3 rounded-2xl border shadow-sm focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-500 transition-all max-w-md ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <Search className={`mr-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} size={20} />
        <input 
          type="text" 
          placeholder="Search by Student Name..." 
          className={`w-full outline-none placeholder-slate-400 text-sm ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredAttendance.length > 0 ? (
          filteredAttendance.map((a, index) => (
            <motion.div
              key={`${a.id}-${index}`}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 
                    className={`font-bold text-sm cursor-pointer hover:text-indigo-600 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}
                    onClick={() => onSelectStudentId(a.student_id)}
                  >
                    {a.student_name}
                  </h4>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    Date: {a.date}
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  {a.total_hours} hrs
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase">
                    <Clock size={12} />
                    In: {a.entry_time}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase">
                    <Clock size={12} />
                    Out: {a.exit_time}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className={`p-8 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No attendance records found</div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className={`hidden lg:block rounded-[32px] shadow-sm border overflow-hidden ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`${isDarkMode ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
              <tr>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Date</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Student</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Entry</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Exit</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Hours</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
              {filteredAttendance.map((a, index) => (
                <tr key={`${a.id}-${index}`} className={`${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'} transition-colors`}>
                  <td className="px-8 py-5 font-bold text-slate-500">{a.date}</td>
                  <td className="px-8 py-5">
                    <div 
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => onSelectStudentId(a.student_id)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs">
                        {a.student_name.charAt(0)}
                      </div>
                      <span className="font-bold tracking-tight group-hover:text-indigo-600 transition-colors">{a.student_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-green-600 dark:text-green-400 font-medium">{a.entry_time}</td>
                  <td className="px-8 py-5 text-red-600 dark:text-red-400 font-medium">{a.exit_time}</td>
                  <td className="px-8 py-5 font-black">{a.total_hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BooksList({ isDarkMode }: any) {
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      const data = await getBooks();
      setBooks(data);
      setIsLoading(false);
    };
    fetchBooks();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {books.length > 0 ? (
          books.map((b, index) => (
            <motion.div
              key={`${b.book_id}-${index}`}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{b.title}</h4>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    ID: {b.book_id} • {b.author}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full font-bold text-xs ${b.available > 0 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {b.available} / {b.quantity}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className={`p-8 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No books found</div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className={`hidden lg:block rounded-[32px] shadow-sm border overflow-hidden ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`${isDarkMode ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
              <tr>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">ID</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Title</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Author</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Availability</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
              {books.map((b, index) => (
                <tr key={`${b.book_id}-${index}`} className={`${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'} transition-colors`}>
                  <td className="px-8 py-5 font-mono text-xs text-slate-500">{b.book_id}</td>
                  <td className="px-8 py-5 font-bold tracking-tight">{b.title}</td>
                  <td className="px-8 py-5 text-slate-500 font-medium">{b.author}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <span className={`font-black text-lg ${b.available > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {b.available}
                      </span>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">/ {b.quantity} Available</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ArchivedStudentsList({ isDarkMode }: any) {
  const [archivedStudents, setArchivedStudents] = useState<ArchivedStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArchived = async () => {
      const data = await getArchivedStudents();
      setArchivedStudents(data);
      setIsLoading(false);
    };
    fetchArchived();
  }, []);

  const filteredStudents = archivedStudents.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.student_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-center px-4 py-3 rounded-2xl border shadow-sm focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-500 transition-all max-w-md ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <Search className={`mr-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} size={20} />
        <input 
          type="text" 
          placeholder="Search Recycle Bin..." 
          className={`w-full outline-none placeholder-slate-400 text-sm ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((s, index) => (
            <motion.div
              key={`${s.student_id}-${index}`}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{s.name}</h4>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    ID: {s.student_id} • Deleted {new Date(s.archived_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs">
                  ₹{s.total_fees_paid}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="text-center">
                  <p className="text-[8px] font-bold uppercase text-slate-400">Months</p>
                  <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>{s.months_studied}</p>
                </div>
                <div className="text-center border-x border-slate-100 dark:border-slate-700">
                  <p className="text-[8px] font-bold uppercase text-slate-400">Fees</p>
                  <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>{s.fees_paid_count}</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] font-bold uppercase text-slate-400">Attendance</p>
                  <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>{s.attendance_records?.length || 0}</p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className={`p-8 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Recycle bin is empty</div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className={`hidden lg:block rounded-2xl shadow-sm border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`${isDarkMode ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">ID</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Name</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Months</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Fees</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Total Paid</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Attendance</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Deleted Date</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s, index) => (
                  <tr key={`${s.student_id}-${index}`} className={`${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'} transition-colors`}>
                    <td className={`px-6 py-4 font-mono text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.student_id}</td>
                    <td className={`px-6 py-4 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{s.name}</td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.months_studied}</td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.fees_paid_count}</td>
                    <td className={`px-6 py-4 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₹{s.total_fees_paid}</td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.attendance_records?.length || 0}</td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{new Date(s.archived_date).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className={`px-6 py-12 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Recycle bin is empty</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Modals ---

function Modal({ isOpen, onClose, title, children, isDarkMode }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={`rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}
      >
        <div className={`px-8 py-6 flex justify-between items-center ${isDarkMode ? 'border-b border-slate-800' : 'border-b border-slate-50'}`}>
          <h3 className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-slate-500 hover:bg-slate-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-8">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

function StudentDetailsModal({ isOpen, onClose, student: initialStudent, studentId, isDarkMode }: any) {
  const [student, setStudent] = useState<Student | null>(initialStudent || null);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('fees');

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoading(true);
        
        let currentStudent = initialStudent;
        if (!currentStudent && studentId) {
          const allStudents = await getStudents();
          currentStudent = allStudents.find(s => s.student_id === studentId) || null;
          setStudent(currentStudent);
        } else if (initialStudent) {
          setStudent(initialStudent);
        }

        if (currentStudent) {
          const allFees = await getFees();
          const allAttendance = await getAttendance();
          setFees(allFees.filter(f => f.student_id === currentStudent.student_id));
          setAttendance(allAttendance.filter(a => a.student_id === currentStudent.student_id));
        }
        
        setIsLoading(false);
      };
      fetchData();
    } else {
      setStudent(null);
      setFees([]);
      setAttendance([]);
    }
  }, [isOpen, initialStudent, studentId]);

  if (!isOpen) return null;
  if (isLoading && !student) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }
  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col ${isDarkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-900'}`}
      >
        <div className={`px-8 py-6 flex justify-between items-center ${isDarkMode ? 'border-b border-slate-800' : 'border-b border-slate-50'}`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-3xl shadow-inner">
              {student.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-black text-2xl tracking-tight leading-none mb-1">{student.name}</h3>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                  ID: {student.student_id}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                  {student.class_name}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-slate-500 hover:bg-slate-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50/50 border-slate-100'}`}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                  <UserIcon size={14} />
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Personal Info</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Father</span>
                  <span className="text-sm font-bold">{student.father_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Mobile</span>
                  <span className="text-sm font-bold">{student.mobile}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Parent</span>
                  <span className="text-sm font-bold">{student.parent_mobile}</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`p-5 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50/50 border-slate-100'}`}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <BookOpen size={14} />
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Course Info</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Shift</span>
                  <span className="text-sm font-bold">{student.shift}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Joined</span>
                  <span className="text-sm font-bold">{new Date(student.join_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Fees</span>
                  <span className="text-sm font-black text-green-600 dark:text-green-400">₹{student.fee_amount}</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`p-5 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50/50 border-slate-100'}`}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <MapPin size={14} />
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Address</p>
              </div>
              <p className="text-sm font-medium leading-relaxed">{student.address || 'No address provided'}</p>
            </motion.div>
          </div>

          <div className="flex gap-8 border-b border-slate-100 dark:border-slate-800 mb-8">
            <button 
              onClick={() => setActiveSubTab('fees')}
              className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeSubTab === 'fees' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Fee History
              {activeSubTab === 'fees' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
            </button>
            <button 
              onClick={() => setActiveSubTab('attendance')}
              className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeSubTab === 'attendance' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Attendance
              {activeSubTab === 'attendance' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {activeSubTab === 'fees' ? (
                <div className={`rounded-2xl border overflow-hidden shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
                  <table className="w-full text-left text-sm">
                    <thead className={`${isDarkMode ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                      <tr>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Receipt</th>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Month</th>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Amount</th>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Date</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                      {fees.length > 0 ? (
                        fees.map((f, index) => (
                          <tr key={`${f.receipt_no}-${index}`} className={`${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'} transition-colors`}>
                            <td className="px-6 py-4 font-mono text-xs text-slate-500">{f.receipt_no}</td>
                            <td className="px-6 py-4 font-bold">{f.month} {f.year}</td>
                            <td className="px-6 py-4 font-black text-green-600 dark:text-green-400">₹{f.amount}</td>
                            <td className="px-6 py-4 text-slate-500">{new Date(f.payment_date).toLocaleDateString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic">No fee records found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={`rounded-2xl border overflow-hidden shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
                  <table className="w-full text-left text-sm">
                    <thead className={`${isDarkMode ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                      <tr>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Date</th>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Entry</th>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Exit</th>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Hours</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                      {attendance.length > 0 ? (
                        attendance.map((a, index) => (
                          <tr key={`${a.id}-${index}`} className={`${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'} transition-colors`}>
                            <td className="px-6 py-4 font-bold">{a.date}</td>
                            <td className="px-6 py-4 text-green-600 dark:text-green-400 font-medium">{a.entry_time}</td>
                            <td className="px-6 py-4 text-red-600 dark:text-red-400 font-medium">{a.exit_time}</td>
                            <td className="px-6 py-4 font-black">{a.total_hours}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic">No attendance records found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`px-8 py-6 border-t flex justify-end ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
          <button
            onClick={onClose}
            className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-sm ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'}`}
          >
            Close Details
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function RevenueModal({ isOpen, onClose, stats, isDarkMode }: any) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Revenue Overview" isDarkMode={isDarkMode}>
      <div className="space-y-5 py-2">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-green-50/50 border-green-100'}`}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'}`}>
              <IndianRupee size={24} />
            </div>
            <div className="space-y-0.5">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Monthly Collection</span>
              <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₹{stats.monthlyCollection}</p>
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '75%' }}
              className="bg-green-500 h-full rounded-full"
            />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-6 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-indigo-50/50 border-indigo-100'}`}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
              <TrendingUp size={24} />
            </div>
            <div className="space-y-0.5">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Total Revenue</span>
              <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₹{stats.totalRevenue}</p>
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '90%' }}
              className="bg-indigo-500 h-full rounded-full"
            />
          </div>
        </motion.div>

        <button
          onClick={onClose}
          className={`w-full py-4 rounded-2xl font-bold transition-all transform active:scale-[0.98] ${isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          Close Overview
        </button>
      </div>
    </Modal>
  );
}

function AddStudentModal({ isOpen, onClose, onSuccess, isDarkMode }: any) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData) as any;

    await addStudent(data);
    onSuccess();
    onClose();
  };

  const inputClass = `w-full px-4 py-3 rounded-2xl border shadow-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400'}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Student" isDarkMode={isDarkMode}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Student Name</label>
            <input name="name" placeholder="Full Name" required className={inputClass} />
          </div>
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Father's Name</label>
            <input name="fatherName" placeholder="Father's Name" required className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Mobile Number</label>
            <input name="mobile" placeholder="Mobile" required className={inputClass} />
          </div>
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Parent Mobile</label>
            <input name="parentMobile" placeholder="Parent Mobile" className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Course / Exam</label>
            <select name="className" required className={inputClass}>
              <option value="">Select Course</option>
              {COURSE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Shift</label>
            <select name="shift" required className={inputClass}>
              <option value="">Select Shift</option>
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Start Time</label>
            <input name="shiftStartTime" type="time" className={inputClass} />
          </div>
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>End Time</label>
            <input name="shiftEndTime" type="time" className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Monthly Fee</label>
            <input name="feeAmount" type="number" placeholder="Amount" defaultValue={500} className={inputClass} />
          </div>
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Join Date</label>
            <input name="joinDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} className={inputClass} />
          </div>
        </div>
        <div className="space-y-1">
          <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Address</label>
          <textarea name="address" placeholder="Address" className={inputClass} rows={2} />
        </div>
        <button type="submit" className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all transform active:scale-[0.98]">
          Save Student
        </button>
      </form>
    </Modal>
  );
}

function SubmitFeeModal({ isOpen, onClose, onSuccess, isDarkMode }: any) {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchStudents = async () => {
        setIsLoading(true);
        const data = await getStudents();
        setStudents(data);
        setIsLoading(false);
      };
      fetchStudents();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    const result = await addFee(data);
    if (result) {
      const student = students.find(s => s.student_id === data.studentId);
      if (student && student.parent_mobile) {
        const message = formatFeeReceipt(student.name, Number(data.amount), result.receipt_no);
        await sendSMS({ to: student.parent_mobile, message });
      }
    }
    onSuccess();
    onClose();
  };

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const inputClass = `w-full px-4 py-3 rounded-2xl border shadow-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400'}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Fee" isDarkMode={isDarkMode}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Select Student</label>
          <select name="studentId" required className={inputClass}>
            <option value="">Select Student</option>
            {students.map((s, index) => (
              <option key={`${s.student_id}-${index}`} value={s.student_id}>{s.name} ({s.class_name})</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Month</label>
            <select name="month" required className={inputClass} defaultValue={currentMonth}>
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Year</label>
            <input name="year" defaultValue={new Date().getFullYear()} required className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Amount</label>
            <input name="amount" type="number" defaultValue={500} required className={inputClass} />
          </div>
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Payment Mode</label>
            <select name="paymentMode" required className={inputClass}>
              <option value="Cash">Cash</option>
              <option value="Online">Online</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
        </div>
        <button type="submit" className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all transform active:scale-[0.98]">
          Submit Fee
        </button>
      </form>
    </Modal>
  );
}

function MarkAttendanceModal({ isOpen, onClose, onSuccess, isDarkMode }: any) {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchStudents = async () => {
        setIsLoading(true);
        const data = await getStudents();
        setStudents(data);
        setIsLoading(false);
      };
      fetchStudents();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData) as any;
    
    // Calculate hours
    const start = new Date(`2000-01-01T${data.entryTime}`);
    const end = new Date(`2000-01-01T${data.exitTime}`);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const totalHours = diff > 0 ? diff.toFixed(1) : '0';

    await markAttendance({ ...data, totalHours });
    
    const student = students.find(s => s.student_id === data.studentId);
    if (student && student.parent_mobile) {
      const message = formatAttendanceAlert(student.name, data.date, data.entryTime);
      await sendSMS({ to: student.parent_mobile, message });
    }

    onSuccess();
    onClose();
  };

  const inputClass = `w-full px-4 py-3 rounded-2xl border shadow-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400'}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mark Attendance" isDarkMode={isDarkMode}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Select Student</label>
          <select name="studentId" required className={inputClass}>
            <option value="">Select Student</option>
            {students.map((s, index) => (
              <option key={`${s.student_id}-${index}`} value={s.student_id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Date</label>
          <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Entry Time</label>
            <input name="entryTime" type="time" required className={inputClass} />
          </div>
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Exit Time</label>
            <input name="exitTime" type="time" required className={inputClass} />
          </div>
        </div>
        <button type="submit" className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all transform active:scale-[0.98]">
          Save Attendance
        </button>
      </form>
    </Modal>
  );
}

function AddBookModal({ isOpen, onClose, onSuccess, isDarkMode }: any) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    await addBook(data);
    onSuccess();
    onClose();
  };

  const inputClass = `w-full px-4 py-3 rounded-2xl border shadow-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400'}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Book" isDarkMode={isDarkMode}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Book Title</label>
          <input name="title" placeholder="Title" required className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Author Name</label>
          <input name="author" placeholder="Author" required className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Quantity</label>
          <input name="quantity" type="number" placeholder="Quantity" required className={inputClass} />
        </div>
        <button type="submit" className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all transform active:scale-[0.98]">
          Add Book
        </button>
      </form>
    </Modal>
  );
}

function DueFeesModal({ isOpen, onClose, isDarkMode }: any) {
  const [dueStudents, setDueStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchDueFees = async () => {
        setIsLoading(true);
        const data = await getDueFees();
        setDueStudents(data);
        setIsLoading(false);
      };
      fetchDueFees();
      setIsBulkMode(false);
      setCurrentIndex(0);
      setShowQR(false);
    }
  }, [isOpen]);

  const filteredDueStudents = dueStudents.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNotify = (student: any) => {
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    const message = `*Library Fee Reminder*\n\nHello ${student.name},\nThis is a reminder that your library fee for ${currentMonth} is due.\n\n*Pay Online via UPI:*\nUPI ID: 8948476900@upi\n\nPlease pay as soon as possible.`;
    
    if (!student.mobile) {
      alert("Student mobile number is missing.");
      return;
    }

    // Assuming mobile numbers are 10 digits, prepend 91 for India if not present
    const mobile = student.mobile.replace(/\D/g, '');
    const formattedMobile = mobile.length === 10 ? `91${mobile}` : mobile;
    const url = `https://wa.me/${formattedMobile}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSMS = async (student: any) => {
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    const message = formatFeeReminder(student.name, currentMonth, student.feeAmount || 500);
    
    if (!student.mobile && !student.parentMobile) {
      alert("Student/Parent mobile number is missing.");
      return;
    }

    const mobile = (student.parentMobile || student.mobile).replace(/\D/g, '');
    const to = mobile.length === 10 ? `+91${mobile}` : `+${mobile}`;
    
    const result = await sendSMS({ to, message });
    if (result.success) {
      alert(`SMS sent successfully to ${student.name}'s parent!`);
    } else {
      alert(`Failed to send SMS: ${result.message}`);
    }
  };

  const handleNotifyAll = () => {
    if (filteredDueStudents.length === 0) return;
    setIsBulkMode(true);
    setCurrentIndex(0);
  };

  const handleBulkAction = async (type: 'whatsapp' | 'sms' | 'skip') => {
    if (currentIndex >= filteredDueStudents.length) return;
    
    const student = filteredDueStudents[currentIndex];
    if (type === 'whatsapp') handleNotify(student);
    else if (type === 'sms') await handleSMS(student);
    
    setCurrentIndex(prev => prev + 1);
  };

  const currentStudent = filteredDueStudents[currentIndex];
  const isComplete = currentIndex >= filteredDueStudents.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isBulkMode ? "Sending Notifications" : "Students with Due Fees"} isDarkMode={isDarkMode}>
      {showQR ? (
        <div className="flex flex-col items-center justify-center space-y-8 py-10">
          <div className="text-center space-y-2">
            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Scan to Pay</h3>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Use any UPI app to scan and pay</p>
          </div>
          <div className="p-6 bg-white rounded-3xl shadow-2xl shadow-indigo-100 dark:shadow-none border-4 border-indigo-50">
            <QRCode value="upi://pay?pa=8948476900@upi&pn=Library%20Fee&cu=INR" size={220} />
          </div>
          <div className={`px-6 py-3 rounded-2xl font-mono text-xl font-bold tracking-wider ${isDarkMode ? 'bg-slate-800 text-indigo-400' : 'bg-indigo-50 text-indigo-700'}`}>
            8948476900@upi
          </div>
          <button 
            onClick={() => setShowQR(false)}
            className={`w-full py-4 rounded-2xl font-bold transition-all ${isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Back to List
          </button>
        </div>
      ) : isBulkMode ? (
        <div className="space-y-6 py-4">
          {!isComplete ? (
            <>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>Progress</span>
                  <span>{currentIndex + 1} of {filteredDueStudents.length}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 dark:bg-slate-800 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex) / filteredDueStudents.length) * 100}%` }}
                    className="bg-indigo-600 h-full rounded-full"
                  />
                </div>
              </div>
              
              <motion.div 
                key={currentStudent.studentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-8 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'} text-center space-y-5`}
              >
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <UserPlus size={40} />
                </div>
                <div className="space-y-1">
                  <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{currentStudent.name}</h3>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Class: {currentStudent.className} • ID: {currentStudent.studentId}</p>
                </div>
                <div className="space-y-1">
                  <div className={`text-4xl font-black ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>₹{currentStudent.feeAmount || 0}</div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Payment Overdue</p>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => handleBulkAction('whatsapp')}
                  className="flex items-center justify-center gap-3 w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold shadow-lg shadow-green-100 dark:shadow-none transition-all transform active:scale-[0.98]"
                >
                  <MessageCircle size={22} />
                  Send WhatsApp & Next
                </button>
                <button 
                  onClick={() => handleBulkAction('sms')}
                  className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 dark:shadow-none transition-all transform active:scale-[0.98]"
                >
                  <MessageSquare size={22} />
                  Send SMS & Next
                </button>
                <button 
                  onClick={() => handleBulkAction('skip')}
                  className={`flex items-center justify-center gap-3 w-full py-4 border rounded-2xl font-bold transition-all transform active:scale-[0.98] ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Skip Student <ArrowRight size={20} />
                </button>
              </div>
              
              <div className="flex justify-between items-center pt-4">
                <button 
                  onClick={() => setShowQR(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  <IndianRupee size={18} /> Show QR Code
                </button>
                <button 
                  onClick={() => setIsBulkMode(false)}
                  className="text-sm text-slate-500 hover:text-red-500 font-bold px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
                >
                  Cancel Bulk
                </button>
              </div>
            </>
          ) : (
            <div className="text-center space-y-8 py-10">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Check size={48} />
              </div>
              <div className="space-y-2">
                <h3 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>All Done!</h3>
                <p className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  You have processed all {filteredDueStudents.length} students.
                </p>
              </div>
              <button 
                onClick={() => { setIsBulkMode(false); onClose(); }}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100 dark:shadow-none transition-all transform active:scale-[0.98]"
              >
                Close & Finish
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div className={`flex items-center px-4 py-3 rounded-2xl border shadow-sm focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-500 transition-all flex-1 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <Search className={`mr-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
              <input 
                type="text" 
                placeholder="Search by Name or ID..." 
                className={`w-full outline-none text-sm placeholder-slate-400 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowQR(true)}
                className={`p-3 rounded-2xl border transition-all transform active:scale-[0.95] ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'} shadow-sm`}
                title="Show QR Code"
              >
                <IndianRupee size={20} />
              </button>
              {filteredDueStudents.length > 0 && (
                <button 
                  onClick={handleNotifyAll}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none font-bold transform active:scale-[0.95] flex-1 sm:flex-none"
                >
                  <Bell size={18} />
                  <span>Notify All</span>
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto pr-1 -mr-1 space-y-3 custom-scrollbar">
            {filteredDueStudents.length > 0 ? (
              <>
                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-3 lg:hidden">
                  {filteredDueStudents.map((s, index) => (
                    <motion.div 
                      key={`${s.studentId}-${index}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{s.name}</h4>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">ID: {s.studentId} • Class: {s.className}</p>
                          </div>
                        </div>
                        <div className={`text-sm font-black ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>₹{s.feeAmount || 500}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => handleNotify(s)}
                          className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${isDarkMode ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                        >
                          <MessageCircle size={14} /> WhatsApp
                        </button>
                        <button 
                          onClick={() => handleSMS(s)}
                          className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${isDarkMode ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                        >
                          <MessageSquare size={14} /> SMS
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <table className="w-full text-left text-sm border-separate border-spacing-y-2">
                    <thead className={`${isDarkMode ? 'text-slate-500' : 'text-slate-400'} text-[10px] font-bold uppercase tracking-widest`}>
                      <tr>
                        <th className="px-4 py-2">ID</th>
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Class</th>
                        <th className="px-4 py-2">Amount</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDueStudents.map((s, index) => (
                        <tr key={`${s.studentId}-${index}`} className={`${isDarkMode ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'} transition-colors group`}>
                          <td className="px-4 py-3 first:rounded-l-2xl font-mono text-xs">{s.studentId}</td>
                          <td className="px-4 py-3 font-bold">{s.name}</td>
                          <td className="px-4 py-3 text-slate-500">{s.className}</td>
                          <td className="px-4 py-3 font-black text-green-600 dark:text-green-400">₹{s.feeAmount || 500}</td>
                          <td className="px-4 py-3 last:rounded-r-2xl text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleNotify(s)}
                                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                title="WhatsApp"
                              >
                                <MessageCircle size={16} />
                              </button>
                              <button 
                                onClick={() => handleSMS(s)}
                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                title="SMS"
                              >
                                <MessageSquare size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-full flex items-center justify-center mx-auto">
                  <Search size={32} />
                </div>
                <p className={`${isDarkMode ? 'text-slate-500' : 'text-slate-400'} font-medium`}>
                  {dueStudents.length === 0 ? "No students have due fees for this month." : "No matching students found."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
