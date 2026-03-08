import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Clock, IndianRupee, AlertTriangle, 
  UserPlus, BookOpen, Menu, X, Home, Search, Moon, Sun, Archive, Trash2, TrendingUp, MessageCircle, Bell, MessageSquare, Check, ArrowRight,
  PieChart as PieChartIcon, BarChart as BarChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  getDashboardStats, getFees, getStudents, getAttendance, getBooks, getDueFees,
  addStudent, addFee, markAttendance, addBook, getArchivedStudents, archiveStudent,
  Student, FeeRecord, AttendanceRecord, Book, DashboardStats, ArchivedStudent
} from './lib/storage';
import QRCode from "react-qr-code";

// Constants

export default function App() {
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

  useEffect(() => {
    fetchDashboardData();
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const fetchDashboardData = async () => {
    try {
      const statsData = getDashboardStats();
      setStats(statsData);

      const feesData = getFees();
      setAllFees(feesData);

      const studentsData = getStudents();
      setAllStudents(studentsData);

      const attendanceData = getAttendance();
      setAllAttendance(attendanceData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <div className={`min-h-screen font-sans flex ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={`fixed inset-y-0 left-0 z-50 w-64 shadow-xl lg:static lg:translate-x-0 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'}`}
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3 font-bold text-xl">
                <BookOpen className="text-indigo-400" />
                <span>LibManager</span>
              </div>
              <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <nav className="mt-6 px-4 space-y-2">
              <NavItem icon={<Home size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} isDarkMode={isDarkMode} />
              <NavItem icon={<Users size={20} />} label="Students" active={activeTab === 'students'} onClick={() => setActiveTab('students')} isDarkMode={isDarkMode} />
              <NavItem icon={<IndianRupee size={20} />} label="Fees" active={activeTab === 'fees'} onClick={() => setActiveTab('fees')} isDarkMode={isDarkMode} />
              <NavItem icon={<Clock size={20} />} label="Attendance" active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} isDarkMode={isDarkMode} />
              <NavItem icon={<BookOpen size={20} />} label="Books" active={activeTab === 'books'} onClick={() => setActiveTab('books')} isDarkMode={isDarkMode} />
              <NavItem icon={<Archive size={20} />} label="Recycle Bin" active={activeTab === 'archived'} onClick={() => setActiveTab('archived')} isDarkMode={isDarkMode} />
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className={`shadow-sm h-16 flex items-center justify-between px-6 z-40 ${isDarkMode ? 'bg-slate-800 border-b border-slate-700' : 'bg-white'}`}>
          <button onClick={toggleSidebar} className={`lg:hidden ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <Menu size={24} />
          </button>
          <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleDarkMode} 
              className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              A
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className={`flex-1 overflow-y-auto p-6 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
          {activeTab === 'dashboard' && (
            <DashboardContent 
              stats={stats} 
              fees={allFees} 
              students={allStudents}
              attendance={allAttendance}
              onAddStudent={() => setShowAddStudent(true)}
              onSubmitFee={() => setShowSubmitFee(true)}
              onMarkAttendance={() => setShowMarkAttendance(true)}
              onAddBook={() => setShowAddBook(true)}
              onShowDueFees={() => setShowDueFees(true)}
              onShowRevenue={() => setShowRevenue(true)}
              isDarkMode={isDarkMode}
            />
          )}
          {activeTab === 'students' && <StudentsList isDarkMode={isDarkMode} onUpdate={fetchDashboardData} />}
          {activeTab === 'fees' && <FeesList isDarkMode={isDarkMode} />}
          {activeTab === 'attendance' && <AttendanceList isDarkMode={isDarkMode} />}
          {activeTab === 'books' && <BooksList isDarkMode={isDarkMode} />}
          {activeTab === 'archived' && <ArchivedStudentsList isDarkMode={isDarkMode} />}
        </main>
      </div>

      {/* Modals */}
      <AddStudentModal isOpen={showAddStudent} onClose={() => setShowAddStudent(false)} onSuccess={fetchDashboardData} isDarkMode={isDarkMode} />
      <SubmitFeeModal isOpen={showSubmitFee} onClose={() => setShowSubmitFee(false)} onSuccess={fetchDashboardData} isDarkMode={isDarkMode} />
      <MarkAttendanceModal isOpen={showMarkAttendance} onClose={() => setShowMarkAttendance(false)} onSuccess={fetchDashboardData} isDarkMode={isDarkMode} />
      <AddBookModal isOpen={showAddBook} onClose={() => setShowAddBook(false)} onSuccess={fetchDashboardData} isDarkMode={isDarkMode} />
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        active 
          ? 'bg-indigo-600 text-white' 
          : isDarkMode 
            ? 'text-slate-400 hover:bg-slate-700 hover:text-white' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function DashboardContent({ stats, fees, students, attendance, onAddStudent, onSubmitFee, onMarkAttendance, onAddBook, onShowDueFees, onShowRevenue, isDarkMode }: any) {
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

  // Chart Data Preparation
  const revenueData = useMemo(() => {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      
      const total = fees
        .filter((f: any) => {
            const fDate = new Date(f.payment_date);
            return fDate.getMonth() === d.getMonth() && fDate.getFullYear() === d.getFullYear();
        })
        .reduce((sum: number, f: any) => sum + f.amount, 0);
        
      last6Months.push({ name: month, amount: total });
    }
    return last6Months;
  }, [fees]);

  const attendanceData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('default', { day: 'numeric', month: 'short' });
      
      const count = attendance.filter((a: any) => a.date === dateStr).length;
      last7Days.push({ name: displayDate, students: count });
    }
    return last7Days;
  }, [attendance]);

  const classData = useMemo(() => {
    const counts: {[key: string]: number} = {};
    students.forEach((s: any) => {
      const cls = s.class_name || 'Unknown';
      counts[cls] = (counts[cls] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [students]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard icon={<Users className="text-blue-500" />} label="Total Students" value={stats.totalStudents} color={isDarkMode ? "bg-blue-900/30" : "bg-blue-50"} isDarkMode={isDarkMode} />
        <StatCard icon={<Clock className="text-orange-500" />} label="Today's Attendance" value={stats.todayAttendance} color={isDarkMode ? "bg-orange-900/30" : "bg-orange-50"} isDarkMode={isDarkMode} />
        <StatCard 
          icon={<AlertTriangle className="text-red-500" />} 
          label="Due Fees" 
          value={stats.dueFees} 
          color={isDarkMode ? "bg-red-900/30" : "bg-red-50"} 
          onClick={onShowDueFees}
          className="cursor-pointer hover:ring-2 hover:ring-red-200"
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className={`p-6 rounded-xl shadow-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
          <h3 className={`text-lg font-semibold mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            <BarChartIcon size={20} className="text-indigo-500" />
            Revenue Trends (6 Months)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="name" stroke={isDarkMode ? '#94a3b8' : '#64748b'} />
                <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#1e293b' : '#fff', 
                    borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                    color: isDarkMode ? '#fff' : '#000'
                  }} 
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Chart */}
        <div className={`p-6 rounded-xl shadow-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
          <h3 className={`text-lg font-semibold mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            <TrendingUp size={20} className="text-emerald-500" />
            Attendance (Last 7 Days)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="name" stroke={isDarkMode ? '#94a3b8' : '#64748b'} />
                <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#1e293b' : '#fff', 
                    borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                    color: isDarkMode ? '#fff' : '#000'
                  }} 
                />
                <Area type="monotone" dataKey="students" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Class Distribution */}
        <div className={`p-6 rounded-xl shadow-sm border lg:col-span-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
          <h3 className={`text-lg font-semibold mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            <PieChartIcon size={20} className="text-orange-500" />
            Student Distribution by Class
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={classData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {classData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#1e293b' : '#fff', 
                    borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                    color: isDarkMode ? '#fff' : '#000'
                  }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <ActionCard icon={<UserPlus />} label="Add Student" onClick={onAddStudent} isDarkMode={isDarkMode} />
          <ActionCard icon={<IndianRupee />} label="Submit Fee" onClick={onSubmitFee} isDarkMode={isDarkMode} />
          <ActionCard icon={<TrendingUp />} label="View Revenue" onClick={onShowRevenue} isDarkMode={isDarkMode} />
          <ActionCard icon={<Clock />} label="Mark Attendance" onClick={onMarkAttendance} isDarkMode={isDarkMode} />
          <ActionCard icon={<BookOpen />} label="Add Book" onClick={onAddBook} isDarkMode={isDarkMode} />
        </div>
      </div>

      {/* Recent Fees */}
      <div className={`rounded-xl shadow-sm border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Recent Fee Submissions</h2>
          <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className={`text-sm border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
          >
            <option value="latest">Latest 5</option>
            <option value="1week">Last 1 Week</option>
            <option value="1month">Last 1 Month</option>
            <option value="2months">Last 2 Months</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="12months">Last 1 Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-50 text-slate-500'}`}>
              <tr>
                <th className="px-6 py-3 font-medium">Receipt No</th>
                <th className="px-6 py-3 font-medium">Student Name</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
              {filteredFees.length > 0 ? (
                filteredFees.map((fee: any) => (
                  <tr key={fee.receipt_no} className={`${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                    <td className={`px-6 py-3 font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{fee.receipt_no}</td>
                    <td className={`px-6 py-3 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{fee.student_name}</td>
                    <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {new Date(fee.payment_date).toLocaleDateString()}
                    </td>
                    <td className={`px-6 py-3 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₹{fee.amount}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'}`}>
                        {fee.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className={`px-6 py-8 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No transactions found for this period</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, onClick, className = '', isDarkMode }: any) {
  return (
    <div 
      onClick={onClick}
      className={`p-6 rounded-xl shadow-sm border flex items-center gap-4 hover:shadow-md transition-shadow ${className} ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
    >
      <div className={`p-3 rounded-lg ${color} text-2xl`}>{icon}</div>
      <div>
        <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
        <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{value}</p>
      </div>
    </div>
  );
}

function ActionCard({ icon, label, onClick, isDarkMode }: any) {
  return (
    <button 
      onClick={onClick}
      className={`p-6 rounded-xl shadow-sm border flex flex-col items-center gap-3 hover:border-indigo-500 hover:text-indigo-600 transition-all group ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-100 text-slate-600'}`}
    >
      <div className={`p-3 rounded-full transition-colors ${isDarkMode ? 'bg-slate-700 group-hover:bg-indigo-900/30 text-slate-400 group-hover:text-indigo-400' : 'bg-slate-50 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-600'}`}>
        {React.cloneElement(icon as React.ReactElement, { size: 24 })}
      </div>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}

// Constants
const COURSE_OPTIONS = [
  "UPSC", "SSC", "Banking", "Railway", "Defense", 
  "IIT-JEE", "NEET", "CUET", "State Exams", 
  "Admission", "Other"
];

// --- Lists ---

function StudentsList({ isDarkMode, onUpdate }: any) {
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);

  useEffect(() => {
    setStudents(getStudents());
  }, []);

  const filteredStudents = students.filter(s => 
    (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     s.student_id.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (selectedClass === '' || s.class_name === selectedClass)
  );

  const handleArchive = (studentId: string) => {
    setStudentToDelete(studentId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      archiveStudent(studentToDelete);
      setStudents(getStudents());
      if (onUpdate) onUpdate();
      setShowDeleteConfirm(false);
      setStudentToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className={`flex items-center px-4 py-2 rounded-lg border shadow-sm focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-500 transition-all flex-1 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <Search className={`mr-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} size={20} />
          <input 
            type="text" 
            placeholder="Search by Name or ID..." 
            className={`w-full outline-none placeholder-slate-400 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          value={selectedClass} 
          onChange={(e) => setSelectedClass(e.target.value)}
          className={`px-4 py-2 rounded-lg border shadow-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
        >
          <option value="">All Classes</option>
          {COURSE_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className={`rounded-xl shadow-sm border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-50 text-slate-500'}`}>
              <tr>
                <th className="px-6 py-3 font-medium">ID</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Class</th>
                <th className="px-6 py-3 font-medium">Shift</th>
                <th className="px-6 py-3 font-medium">Mobile</th>
                <th className="px-6 py-3 font-medium">Address</th>
                <th className="px-6 py-3 font-medium">Join Date</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s, index) => (
                  <tr key={`${s.student_id}-${index}`} className={`${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                    <td className={`px-6 py-3 font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.student_id}</td>
                    <td className={`px-6 py-3 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{s.name}</td>
                    <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.class_name}</td>
                    <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {s.shift}
                      {s.shift_start_time && s.shift_end_time && (
                        <span className="block text-xs opacity-75">
                          {s.shift_start_time} - {s.shift_end_time}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.mobile}</td>
                    <td className={`px-6 py-3 max-w-xs truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`} title={s.address}>{s.address}</td>
                    <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.join_date}</td>
                    <td className="px-6 py-3">
                      <button 
                        onClick={() => handleArchive(s.student_id)}
                        className={`p-2 rounded-full hover:bg-red-100 text-red-500 transition-colors`}
                        title="Delete (Move to Recycle Bin)"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className={`px-6 py-8 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No students found</td>
                </tr>
              )}
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

function FeesList({ isDarkMode }: any) {
  const [fees, setFees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setFees(getFees());
  }, []);

  const filteredFees = fees.filter(f => 
    f.student_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.receipt_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className={`flex items-center px-4 py-2 rounded-lg border shadow-sm focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-500 transition-all max-w-md ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <Search className={`mr-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} size={20} />
        <input 
          type="text" 
          placeholder="Search by Student or Receipt..." 
          className={`w-full outline-none placeholder-slate-400 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={`rounded-xl shadow-sm border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-50 text-slate-500'}`}>
              <tr>
                <th className="px-6 py-3 font-medium">Receipt</th>
                <th className="px-6 py-3 font-medium">Student</th>
                <th className="px-6 py-3 font-medium">Month</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
              {filteredFees.length > 0 ? (
                filteredFees.map((f, index) => (
                  <tr key={`${f.receipt_no}-${index}`} className={`${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                    <td className={`px-6 py-3 font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{f.receipt_no}</td>
                    <td className={`px-6 py-3 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{f.student_name}</td>
                    <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{f.month} {f.year}</td>
                    <td className={`px-6 py-3 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₹{f.amount}</td>
                    <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{new Date(f.payment_date).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className={`px-6 py-8 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No fees found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AttendanceList({ isDarkMode }: any) {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setAttendance(getAttendance());
  }, []);

  const filteredAttendance = attendance.filter(a => 
    a.student_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className={`flex items-center px-4 py-2 rounded-lg border shadow-sm focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-500 transition-all max-w-md ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <Search className={`mr-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} size={20} />
        <input 
          type="text" 
          placeholder="Search by Student Name..." 
          className={`w-full outline-none placeholder-slate-400 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={`rounded-xl shadow-sm border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-50 text-slate-500'}`}>
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Student</th>
                <th className="px-6 py-3 font-medium">Entry</th>
                <th className="px-6 py-3 font-medium">Exit</th>
                <th className="px-6 py-3 font-medium">Hours</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((a, index) => (
                  <tr key={`${a.id}-${index}`} className={`${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                    <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{a.date}</td>
                    <td className={`px-6 py-3 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{a.student_name}</td>
                    <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{a.entry_time}</td>
                    <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{a.exit_time}</td>
                    <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{a.total_hours}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className={`px-6 py-8 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No attendance records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BooksList({ isDarkMode }: any) {
  const [books, setBooks] = useState<any[]>([]);

  useEffect(() => {
    setBooks(getBooks());
  }, []);

  return (
    <div className={`rounded-xl shadow-sm border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className={`${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-50 text-slate-500'}`}>
            <tr>
              <th className="px-6 py-3 font-medium">ID</th>
              <th className="px-6 py-3 font-medium">Title</th>
              <th className="px-6 py-3 font-medium">Author</th>
              <th className="px-6 py-3 font-medium">Available / Total</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
            {books.map((b, index) => (
              <tr key={`${b.book_id}-${index}`} className={`${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                <td className={`px-6 py-3 font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{b.book_id}</td>
                <td className={`px-6 py-3 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{b.title}</td>
                <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{b.author}</td>
                <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span className={`font-medium ${b.available > 0 ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>
                    {b.available}
                  </span>
                  <span className={`${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}> / {b.quantity}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ArchivedStudentsList({ isDarkMode }: any) {
  const [archivedStudents, setArchivedStudents] = useState<ArchivedStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setArchivedStudents(getArchivedStudents());
  }, []);

  const filteredStudents = archivedStudents.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.student_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className={`flex items-center px-4 py-2 rounded-lg border shadow-sm focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-500 transition-all max-w-md ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <Search className={`mr-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} size={20} />
        <input 
          type="text" 
          placeholder="Search Recycle Bin..." 
          className={`w-full outline-none placeholder-slate-400 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={`rounded-xl shadow-sm border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-50 text-slate-500'}`}>
              <tr>
                <th className="px-6 py-3 font-medium">ID</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Months Studied</th>
                <th className="px-6 py-3 font-medium">Fees Paid (Count)</th>
                <th className="px-6 py-3 font-medium">Total Paid</th>
                <th className="px-6 py-3 font-medium">Attendance (Days)</th>
                <th className="px-6 py-3 font-medium">Deleted Date</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s, index) => (
                  <tr key={`${s.student_id}-${index}`} className={`${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                    <td className={`px-6 py-3 font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.student_id}</td>
                    <td className={`px-6 py-3 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{s.name}</td>
                    <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.months_studied}</td>
                    <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.fees_paid_count}</td>
                    <td className={`px-6 py-3 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₹{s.total_fees_paid}</td>
                    <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.attendance_records?.length || 0}</td>
                    <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{new Date(s.archived_date).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className={`px-6 py-8 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No archived students found</td>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl shadow-2xl w-full max-w-lg overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}
      >
        <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'}`}>
          <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
          <button onClick={onClose} className={`${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}>
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

function RevenueModal({ isOpen, onClose, stats, isDarkMode }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl shadow-2xl w-full max-w-md overflow-hidden ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}
      >
        <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'}`}>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <TrendingUp className="text-green-500" size={20} />
            Revenue Overview
          </h3>
          <button onClick={onClose} className={`${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}>
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-green-50 border-green-100'}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'}`}>
                <IndianRupee size={20} />
              </div>
              <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Monthly Revenue</span>
            </div>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₹{stats.monthlyCollection}</p>
          </div>

          <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-emerald-50 border-emerald-100'}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                <IndianRupee size={20} />
              </div>
              <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Total Revenue</span>
            </div>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₹{stats.totalRevenue}</p>
          </div>
        </div>

        <div className={`px-6 py-4 border-t flex justify-end ${isDarkMode ? 'bg-slate-700/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AddStudentModal({ isOpen, onClose, onSuccess, isDarkMode }: any) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData) as any;

    addStudent(data);
    onSuccess();
    onClose();
  };

  const inputClass = `input-field ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : ''}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Student" isDarkMode={isDarkMode}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input name="name" placeholder="Student Name" required className={inputClass} />
          <input name="fatherName" placeholder="Father's Name" required className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input name="mobile" placeholder="Mobile" required className={inputClass} />
          <input name="parentMobile" placeholder="Parent Mobile" className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <select name="className" required className={inputClass}>
            <option value="">Select Course/Exam</option>
            {COURSE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <select name="shift" required className={inputClass}>
            <option value="">Select Shift</option>
            <option value="Morning">Morning</option>
            <option value="Evening">Evening</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Shift Start Time</label>
            <input name="shiftStartTime" type="time" className={inputClass} />
          </div>
          <div>
            <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Shift End Time</label>
            <input name="shiftEndTime" type="time" className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input name="feeAmount" type="number" placeholder="Monthly Fee Amount" defaultValue={500} className={inputClass} />
          <input name="joinDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} className={inputClass} />
        </div>
        <textarea name="address" placeholder="Address" className={inputClass} rows={2} />
        <button type="submit" className="btn-primary w-full">Save Student</button>
      </form>
    </Modal>
  );
}

function SubmitFeeModal({ isOpen, onClose, onSuccess, isDarkMode }: any) {
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) setStudents(getStudents());
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    addFee(data);
    onSuccess();
    onClose();
  };

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const inputClass = `input-field ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : ''}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Fee" isDarkMode={isDarkMode}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select name="studentId" required className={inputClass}>
          <option value="">Select Student</option>
          {students.map((s, index) => (
            <option key={`${s.student_id}-${index}`} value={s.student_id}>{s.name} ({s.class_name})</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-4">
          <select name="month" required className={inputClass} defaultValue={currentMonth}>
            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input name="year" defaultValue={new Date().getFullYear()} required className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input name="amount" type="number" defaultValue={500} required className={inputClass} />
          <select name="paymentMode" required className={inputClass}>
            <option value="Cash">Cash</option>
            <option value="Online">Online</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
        <button type="submit" className="btn-primary w-full">Submit Fee</button>
      </form>
    </Modal>
  );
}

function MarkAttendanceModal({ isOpen, onClose, onSuccess, isDarkMode }: any) {
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) setStudents(getStudents());
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

    markAttendance({ ...data, totalHours });
    onSuccess();
    onClose();
  };

  const inputClass = `input-field ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : ''}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mark Attendance" isDarkMode={isDarkMode}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select name="studentId" required className={inputClass}>
          <option value="">Select Student</option>
          {students.map((s, index) => (
            <option key={`${s.student_id}-${index}`} value={s.student_id}>{s.name}</option>
          ))}
        </select>
        <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className={inputClass} />
        <div className="grid grid-cols-2 gap-4">
          <input name="entryTime" type="time" required className={inputClass} />
          <input name="exitTime" type="time" required className={inputClass} />
        </div>
        <button type="submit" className="btn-primary w-full">Save Attendance</button>
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

    addBook(data);
    onSuccess();
    onClose();
  };

  const inputClass = `input-field ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : ''}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Book" isDarkMode={isDarkMode}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="title" placeholder="Book Title" required className={inputClass} />
        <input name="author" placeholder="Author Name" required className={inputClass} />
        <input name="quantity" type="number" placeholder="Quantity" required className={inputClass} />
        <button type="submit" className="btn-primary w-full">Add Book</button>
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

  useEffect(() => {
    if (isOpen) {
      setDueStudents(getDueFees());
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

  const handleSMS = (student: any) => {
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    const message = `Library Fee Reminder: Hello ${student.name}, your fee for ${currentMonth} is due. Pay via UPI: 8948476900@upi. Please pay ASAP.`;
    
    if (!student.mobile) {
      alert("Student mobile number is missing.");
      return;
    }

    const mobile = student.mobile.replace(/\D/g, '');
    
    // Check if the device is likely iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // iOS uses '&' for the body separator, Android uses '?'
    const separator = isIOS ? '&' : '?';
    
    const url = `sms:${mobile}${separator}body=${encodeURIComponent(message)}`;
    
    // Use window.location.href to ensure the native app opens correctly with parameters
    window.location.href = url;
  };

  const handleNotifyAll = () => {
    if (filteredDueStudents.length === 0) return;
    setIsBulkMode(true);
    setCurrentIndex(0);
  };

  const handleBulkAction = (type: 'whatsapp' | 'sms' | 'skip') => {
    if (currentIndex >= filteredDueStudents.length) return;
    
    const student = filteredDueStudents[currentIndex];
    if (type === 'whatsapp') handleNotify(student);
    else if (type === 'sms') handleSMS(student);
    
    setCurrentIndex(prev => prev + 1);
  };

  const currentStudent = filteredDueStudents[currentIndex];
  const isComplete = currentIndex >= filteredDueStudents.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isBulkMode ? "Sending Notifications" : "Students with Due Fees"} isDarkMode={isDarkMode}>
      {showQR ? (
        <div className="flex flex-col items-center justify-center space-y-6 py-8">
          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Scan to Pay</h3>
          <div className="p-4 bg-white rounded-xl shadow-lg">
            <QRCode value="upi://pay?pa=8948476900@upi&pn=Library%20Fee&cu=INR" size={200} />
          </div>
          <p className={`font-mono text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>8948476900@upi</p>
          <button 
            onClick={() => setShowQR(false)}
            className="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
          >
            Back
          </button>
        </div>
      ) : isBulkMode ? (
        <div className="space-y-6 py-4">
          {!isComplete ? (
            <>
              <div className="flex justify-between items-center text-sm text-slate-500">
                <span>Progress</span>
                <span>{currentIndex + 1} of {filteredDueStudents.length}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700">
                <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${((currentIndex) / filteredDueStudents.length) * 100}%` }}></div>
              </div>
              
              <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'} text-center space-y-4`}>
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus size={32} />
                </div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{currentStudent.name}</h3>
                <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Class: {currentStudent.className} • ID: {currentStudent.studentId}</p>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>₹{currentStudent.feeAmount || 0}</div>
                <p className="text-sm text-red-500 font-medium">Payment Overdue</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => handleBulkAction('whatsapp')}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <MessageCircle size={20} />
                  Send WhatsApp & Next
                </button>
                <button 
                  onClick={() => handleBulkAction('sms')}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <MessageSquare size={20} />
                  Send SMS & Next
                </button>
                <button 
                  onClick={() => handleBulkAction('skip')}
                  className={`flex items-center justify-center gap-2 w-full py-3 border ${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'} rounded-lg font-medium transition-colors`}
                >
                  Skip <ArrowRight size={18} />
                </button>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <button 
                  onClick={() => setShowQR(true)}
                  className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1"
                >
                  <IndianRupee size={16} /> Show QR Code
                </button>
                <button 
                  onClick={() => setIsBulkMode(false)}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Cancel Bulk Sending
                </button>
              </div>
            </>
          ) : (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <Check size={40} />
              </div>
              <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>All Done!</h3>
              <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                You have processed all {filteredDueStudents.length} students.
              </p>
              <button 
                onClick={() => { setIsBulkMode(false); onClose(); }}
                className="btn-primary w-full py-3"
              >
                Close
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className={`flex items-center px-4 py-2 rounded-lg border shadow-sm focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-500 transition-all flex-1 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <Search className={`mr-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} size={20} />
              <input 
                type="text" 
                placeholder="Search by Name or ID..." 
                className={`w-full outline-none placeholder-slate-400 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowQR(true)}
                className={`p-2 rounded-lg border ${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'} transition-colors`}
                title="Show QR Code"
              >
                <IndianRupee size={20} />
              </button>
              {filteredDueStudents.length > 0 && (
                <button 
                  onClick={handleNotifyAll}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
                >
                  <Bell size={18} />
                  <span className="hidden sm:inline">Notify All</span>
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredDueStudents.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className={`${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-50 text-slate-500'} sticky top-0`}>
                  <tr>
                    <th className="px-4 py-2 font-medium">ID</th>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Class</th>
                    <th className="px-4 py-2 font-medium">Mobile</th>
                    <th className="px-4 py-2 font-medium">Amount</th>
                    <th className="px-4 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                  {filteredDueStudents.map((s) => (
                    <tr key={s.studentId} className={`${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                      <td className={`px-4 py-2 font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.studentId}</td>
                      <td className={`px-4 py-2 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{s.name}</td>
                      <td className={`px-4 py-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.className}</td>
                      <td className={`px-4 py-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.mobile}</td>
                      <td className={`px-4 py-2 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₹{s.feeAmount || 0}</td>
                      <td className="px-4 py-2 flex gap-2">
                        <button 
                          onClick={() => handleNotify(s)}
                          className={`p-2 rounded-full hover:bg-green-100 text-green-600 transition-colors`}
                          title="Send WhatsApp Reminder"
                        >
                          <MessageCircle size={18} />
                        </button>
                        <button 
                          onClick={() => handleSMS(s)}
                          className={`p-2 rounded-full hover:bg-blue-100 text-blue-600 transition-colors`}
                          title="Send SMS Reminder"
                        >
                          <MessageSquare size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={`text-center py-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {dueStudents.length === 0 ? "No students have due fees for this month." : "No matching students found."}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
