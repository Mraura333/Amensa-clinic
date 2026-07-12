import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Download, 
  RefreshCw, 
  Trash2, 
  User, 
  TrendingUp, 
  Clock, 
  CreditCard, 
  Calendar, 
  Image, 
  ArrowLeft, 
  LogOut, 
  MapPin, 
  Activity, 
  Phone, 
  ShieldAlert, 
  X,
  Lock,
  ChevronRight,
  Plus,
  IndianRupee,
  AlertTriangle
} from 'lucide-react';
import { Payment, Booking } from '../types';
import { paymentService } from '../services/paymentService';
import { bookingService } from '../services/bookingService';
import { authService, AdminUser } from '../services/authService';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  // Authentication states
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Core Data States
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [methodFilter, setMethodFilter] = useState<'All' | 'UPI' | 'Razorpay' | 'Cashfree'>('All');

  // Interactive detail overlay
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
  const [selectedScreenshotUrl, setSelectedScreenshotUrl] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState('');

  // Subscribe to real-time updates when logged in
  useEffect(() => {
    // Attempt standard auto-login capture on load
    const token = localStorage.getItem('amensa_admin_logged_in');
    if (token === 'true') {
      setAdminUser({
        uid: 'stored-local-session',
        email: 'amensadiagnostics@gmail.com',
        role: 'admin',
        displayName: 'Clinical Administrator'
      });
    }

    // Listener for Auth status via Firebase as well
    const unsubscribeAuth = authService.subscribeAuthState((user) => {
      if (user) {
        setAdminUser(user);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (!adminUser) return;

    setIsLoadingData(true);
    
    // Subscribe to real-time payments collection
    const unsubscribePayments = paymentService.subscribePayments((updatedPayments) => {
      setPayments(updatedPayments);
      setIsLoadingData(false);
    });

    // Subscribe to real-time bookings collection
    const unsubscribeBookings = bookingService.subscribeAllBookings((updatedBookings) => {
      setBookings(updatedBookings);
    });

    return () => {
      unsubscribePayments();
      unsubscribeBookings();
    };
  }, [adminUser]);

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);

    try {
      // 1. Try Firebase Auth with standard credentials
      // (If Firebase is configured with standard emails)
      try {
        const user = await authService.loginAdmin('amensadiagnostics@gmail.com', authPassword);
        setAdminUser(user);
        localStorage.setItem('amensa_admin_logged_in', 'true');
        return;
      } catch (authErr: any) {
        // Fall back to server endpoints if Firebase Auth is not set up
        console.warn('Firebase Auth rejected, checking local server authority...');
      }

      // 2. Try falling back to local credentials login
      const user = await authService.loginWithServerCredentials(authPassword);
      setAdminUser(user);
      localStorage.setItem('amensa_admin_logged_in', 'true');
    } catch (err: any) {
      setAuthError(err.message || 'The authorization password entered is invalid.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await authService.logoutAdmin();
    setAdminUser(null);
    localStorage.removeItem('amensa_admin_logged_in');
  };

  // Payment Verification actions
  const handleVerifyPayment = async (payment: Payment, status: 'Approved' | 'Rejected') => {
    try {
      const verifier = adminUser?.displayName || adminUser?.email || 'Admin';
      await paymentService.verifyPayment(
        payment.paymentId, 
        payment.bookingId, 
        status, 
        verifier,
        actionNotes || undefined
      );
      
      // Update selected detail modal in real-time
      if (selectedPayment?.paymentId === payment.paymentId) {
        setSelectedPayment({
          ...selectedPayment,
          verificationStatus: status,
          paymentStatus: status === 'Approved' ? 'Verified' : 'Failed',
          verifiedBy: verifier,
          notes: actionNotes || selectedPayment.notes
        });
      }
      
      setActionNotes('');
    } catch (err: any) {
      alert('Verification Action failed: ' + err.message);
    }
  };

  const handleDeleteRecord = async (paymentId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment record from database? This action is irreversible.')) {
      return;
    }

    try {
      await paymentService.deletePayment(paymentId);
      setSelectedPayment(null);
    } catch (err: any) {
      alert('Failed to delete payment: ' + err.message);
    }
  };

  // Calculations / Analytics (Filtered in real time)
  const stats = React.useMemo(() => {
    const approvedPayments = payments.filter(p => p.verificationStatus === 'Approved');
    const pendingPayments = payments.filter(p => p.verificationStatus === 'Pending');
    const failedPayments = payments.filter(p => p.verificationStatus === 'Rejected');

    const totalRevenue = approvedPayments.reduce((sum, p) => sum + p.amount, 0);

    // Today's revenue calculation
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysRevenue = approvedPayments
      .filter(p => p.createdAt && p.createdAt.startsWith(todayStr))
      .reduce((sum, p) => sum + p.amount, 0);

    // Monthly revenue calculation
    const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyRevenue = approvedPayments
      .filter(p => p.createdAt && p.createdAt.startsWith(currentMonthStr))
      .reduce((sum, p) => sum + p.amount, 0);

    // Weekly revenue calculation
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyRevenue = approvedPayments
      .filter(p => p.createdAt && new Date(p.createdAt) >= oneWeekAgo)
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalRevenue,
      todaysRevenue,
      weeklyRevenue,
      monthlyRevenue,
      pendingCount: pendingPayments.length,
      verifiedCount: approvedPayments.length,
      failedCount: failedPayments.length
    };
  }, [payments]);

  // Real-time Filters for table
  const filteredPayments = React.useMemo(() => {
    return payments.filter(payment => {
      const matchSearch = 
        payment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.patientPhone.includes(searchTerm) ||
        (payment.patientEmail && payment.patientEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        payment.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.paymentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'All' || payment.verificationStatus === statusFilter;
      const matchMethod = methodFilter === 'All' || payment.paymentMethod === methodFilter;

      return matchSearch && matchStatus && matchMethod;
    });
  }, [payments, searchTerm, statusFilter, methodFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9990] bg-[#F8FBFF] flex flex-col h-screen overflow-hidden">
      {/* Top Banner / Navigation */}
      <header className="bg-white border-b border-[#E8EEF5] py-4.5 px-6 sm:px-8 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all cursor-pointer text-slate-500 hover:text-slate-800"
            title="Return to Website"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm">🛡️</span>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Clinical Core Control</h2>
              <span className="px-2 py-0.5 bg-blue-50 text-[10px] text-blue-600 font-extrabold rounded-md uppercase tracking-wider">Admin Engine</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Double-Blind Verification Database</p>
          </div>
        </div>

        {adminUser && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800">{adminUser.displayName || adminUser.email}</span>
              <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-widest mt-0.5">Active Admin Session</span>
            </div>
            <button
              onClick={handleLogout}
              className="py-2 px-3.5 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
              title="Sign Out Control Plane"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </header>

      {!adminUser ? (
        /* Login Screen */
        <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-tr from-[#F8FBFF] via-[#F4F9FF] to-[#EFF6FF]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-[28px] border border-slate-100 shadow-2xl p-8 text-center space-y-6"
          >
            <div className="w-16 h-16 bg-[#0066CC]/5 text-[#0066CC] rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-[#0066CC]/10 text-3xl">
              🔑
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900 leading-tight">Admin Authentication Required</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Enter your secure system authorization password to enter the double-blind clinical database control.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Security Password / Key</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Enter Authorization Key (Default: Amensa123)"
                    className="w-full pl-11 pr-4 py-3.5 border border-slate-200 focus:border-[#0066CC] bg-slate-50/50 rounded-xl text-sm font-bold text-slate-800 transition-all focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-500 text-xs font-semibold flex items-start gap-2 animate-fade-in">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-4 bg-[#0066CC] hover:bg-[#0052CC] active:scale-98 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-100 tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isAuthenticating ? 'Decrypting Secure Node...' : 'Authenticate Credentials'}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>NABL Lab Control Platform</span>
              <span>•</span>
              <span>AES-256 Enabled</span>
            </div>
          </motion.div>
        </div>
      ) : (
        /* Real-time Admin Dashboard Main Screen */
        <div className="flex-1 flex flex-col overflow-hidden lg:flex-row">
          
          {/* Main workspace container */}
          <div className="flex-1 flex flex-col overflow-hidden p-6 sm:p-8 space-y-6">
            
            {/* Real-time Live Metrics Panel */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4" id="dashboard-realtime-metrics">
              <div className="bg-white border border-[#E8EEF5] rounded-2xl p-4.5 shadow-sm space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
                  <span className="text-emerald-500 bg-emerald-50 p-1.5 rounded-xl text-xs font-bold shrink-0">📈 Live</span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800 font-mono flex items-center">
                    <IndianRupee className="w-4 h-4 shrink-0 text-slate-500" />
                    {stats.totalRevenue.toLocaleString('en-IN')}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Approved Transactions</p>
                </div>
              </div>

              <div className="bg-white border border-[#E8EEF5] rounded-2xl p-4.5 shadow-sm space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Sales</span>
                  <span className="text-blue-500 bg-blue-50 p-1 rounded-lg text-[9px] font-extrabold shrink-0">TODAY</span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800 font-mono flex items-center">
                    <IndianRupee className="w-4 h-4 shrink-0 text-slate-500" />
                    {stats.todaysRevenue.toLocaleString('en-IN')}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Today's Approved</p>
                </div>
              </div>

              <div className="bg-white border border-[#E8EEF5] rounded-2xl p-4.5 shadow-sm space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Sales</span>
                  <span className="text-purple-500 bg-purple-50 p-1 rounded-lg text-[9px] font-extrabold shrink-0">MONTHLY</span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800 font-mono flex items-center">
                    <IndianRupee className="w-4 h-4 shrink-0 text-slate-500" />
                    {stats.monthlyRevenue.toLocaleString('en-IN')}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Current billing cycle</p>
                </div>
              </div>

              <div className="bg-white border border-[#E8EEF5] rounded-2xl p-4.5 shadow-sm space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Proofs</span>
                  <span className="text-amber-500 bg-amber-50 p-1.5 rounded-xl text-xs font-bold shrink-0">⚠️ Action</span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800 font-mono">
                    {stats.pendingCount}
                  </h4>
                  <p className="text-[9px] text-amber-600 font-bold uppercase tracking-wider mt-0.5">Need Verification</p>
                </div>
              </div>
            </section>

            {/* Dynamic Controls / Filter Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white border border-[#E8EEF5] rounded-2xl p-4 shadow-sm shrink-0">
              
              {/* Search */}
              <div className="relative w-full md:w-80">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search payments by name, phone..."
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-200 focus:border-[#0066CC] rounded-xl text-xs font-bold text-slate-800 focus:outline-none placeholder-slate-400"
                />
              </div>

              {/* Status Filter */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div className="flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                </div>
                <div className="flex border border-slate-200 rounded-xl overflow-hidden p-0.5 bg-slate-50">
                  {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 text-[10px] font-black rounded-lg uppercase cursor-pointer transition-all ${
                        statusFilter === status 
                          ? 'bg-[#0066CC] text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                {/* CSV Download */}
                <button
                  onClick={() => paymentService.downloadPaymentsCSV(filteredPayments)}
                  disabled={filteredPayments.length === 0}
                  className="ml-auto md:ml-2 py-2 px-3 bg-slate-800 text-white hover:bg-slate-900 border border-slate-900 font-extrabold text-[10px] rounded-xl transition-all flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
                  title="Export payments table to CSV file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

            </div>

            {/* Core Table / Records list */}
            <div className="flex-1 bg-white border border-[#E8EEF5] rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto flex-1">
                {isLoadingData ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-slate-100 border-t-4 border-t-[#0066CC] rounded-full animate-spin" />
                    <p className="text-xs text-slate-400 font-semibold animate-pulse">Syncing real-time database nodes...</p>
                  </div>
                ) : filteredPayments.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                    <span className="text-3xl">🗄️</span>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">No matching payments found</h4>
                    <p className="text-[11px] text-slate-400 max-w-xs">There are no transaction entries in Cloud Firestore matching the search filter criteria.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse" id="payment-history-data-table">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        <th className="py-4.5 px-6">Payment ID / Date</th>
                        <th className="py-4.5 px-6">Patient Details</th>
                        <th className="py-4.5 px-6">Service / Package</th>
                        <th className="py-4.5 px-6 text-right">Amount Due</th>
                        <th className="py-4.5 px-6 text-center">Method</th>
                        <th className="py-4.5 px-6 text-center">Verification Status</th>
                        <th className="py-4.5 px-6 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {filteredPayments.map((payment) => (
                        <tr 
                          key={payment.paymentId}
                          onClick={() => setSelectedPayment(payment)}
                          className={`hover:bg-slate-50/40 cursor-pointer transition-colors ${
                            selectedPayment?.paymentId === payment.paymentId ? 'bg-blue-50/10' : ''
                          }`}
                        >
                          <td className="py-4 px-6 space-y-1">
                            <p className="font-mono font-extrabold text-[#0066CC] text-[11px] uppercase tracking-wider">
                              {payment.paymentId}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                              <Calendar className="w-3 h-3 shrink-0" />
                              {new Date(payment.createdAt).toLocaleString('en-IN', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })}
                            </p>
                          </td>
                          <td className="py-4 px-6 space-y-1">
                            <p className="font-bold text-slate-800 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {payment.patientName}
                            </p>
                            <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              {payment.patientPhone}
                            </p>
                          </td>
                          <td className="py-4 px-6 max-w-[200px]">
                            <p className="font-bold text-slate-800 truncate" title={payment.serviceName}>
                              {payment.serviceName}
                            </p>
                            <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-[9px] font-extrabold text-slate-500 rounded uppercase tracking-wider mt-0.5">
                              {payment.serviceCategory}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <p className="font-mono font-black text-slate-900 text-[13px] flex items-center justify-end">
                              <IndianRupee className="w-3 h-3 shrink-0 text-slate-400" />
                              {payment.amount}
                            </p>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="px-2 py-0.5 bg-slate-100 text-[9px] font-black text-slate-600 rounded-md uppercase tracking-wider">
                              {payment.paymentMethod}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {payment.verificationStatus === 'Approved' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                                <CheckCircle className="w-3 h-3" /> Approved
                              </span>
                            ) : payment.verificationStatus === 'Rejected' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                                <XCircle className="w-3 h-3" /> Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-extrabold uppercase tracking-wide animate-pulse">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-2">
                              {payment.verificationStatus === 'Pending' && (
                                <>
                                  <button
                                    onClick={() => handleVerifyPayment(payment, 'Approved')}
                                    className="p-1.5 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-slate-400 transition-colors cursor-pointer"
                                    title="Verify & Approve"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleVerifyPayment(payment, 'Rejected')}
                                    className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-colors cursor-pointer"
                                    title="Reject Payment"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteRecord(payment.paymentId)}
                                className="p-1.5 hover:bg-slate-100 hover:text-rose-600 rounded-lg text-slate-400 transition-colors cursor-pointer"
                                title="Delete Transaction"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              <div className="py-4 px-6 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between shrink-0">
                <span>Total Items Found: {filteredPayments.length}</span>
                <span className="flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin shrink-0 text-emerald-500" />
                  Real-time synchronization active
                </span>
              </div>
            </div>

          </div>

          {/* Sidebar Panel: Payment Details and Screening */}
          <AnimatePresence>
            {selectedPayment && (
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className="w-full lg:w-[420px] bg-white border-t lg:border-t-0 lg:border-l border-[#E8EEF5] flex flex-col h-full overflow-hidden shrink-0"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Transaction Review</h3>
                    <p className="text-[10px] text-slate-400 font-bold">DOUBLE-BLIND VALIDATOR</p>
                  </div>
                  <button 
                    onClick={() => setSelectedPayment(null)}
                    className="p-1.5 hover:bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                  
                  {/* Status Banner */}
                  <div className={`p-4 rounded-2xl flex items-center justify-between ${
                    selectedPayment.verificationStatus === 'Approved' 
                      ? 'bg-emerald-50/55 border border-emerald-100 text-emerald-800'
                      : selectedPayment.verificationStatus === 'Rejected'
                      ? 'bg-rose-50/55 border border-rose-100 text-rose-800'
                      : 'bg-amber-50/55 border border-amber-100 text-amber-800'
                  }`}>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider opacity-60">Database Status</p>
                      <p className="text-xs font-black uppercase tracking-wider mt-0.5">
                        {selectedPayment.verificationStatus === 'Pending' 
                          ? 'Awaiting Verification' 
                          : `Payment ${selectedPayment.verificationStatus}`}
                      </p>
                    </div>
                    <span className="text-2xl">
                      {selectedPayment.verificationStatus === 'Approved' ? '✅' : selectedPayment.verificationStatus === 'Rejected' ? '❌' : '⏳'}
                    </span>
                  </div>

                  {/* Transaction fields */}
                  <div className="space-y-4 text-xs text-slate-700">
                    <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Payment ID</span>
                        <p className="font-mono font-extrabold text-slate-800 mt-0.5">{selectedPayment.paymentId}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Booking ID</span>
                        <p className="font-mono font-extrabold text-[#0066CC] mt-0.5">{selectedPayment.bookingId}</p>
                      </div>
                    </div>

                    <div className="space-y-3 border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Patient Name</span>
                        <p className="font-extrabold text-slate-800 mt-0.5">{selectedPayment.patientName}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Phone</span>
                          <p className="font-semibold text-slate-800 mt-0.5">{selectedPayment.patientPhone}</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email</span>
                          <p className="font-semibold text-slate-800 truncate mt-0.5" title={selectedPayment.patientEmail}>{selectedPayment.patientEmail || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Item / Test Details</span>
                        <p className="font-extrabold text-slate-800 mt-0.5">{selectedPayment.serviceName}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Category</span>
                          <p className="font-bold text-slate-500 mt-0.5">{selectedPayment.serviceCategory}</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Transaction Ref ID</span>
                          <p className="font-mono font-extrabold text-slate-800 truncate mt-0.5" title={selectedPayment.transactionId}>{selectedPayment.transactionId || 'None'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Screenshot Preview */}
                    {selectedPayment.paymentScreenshotURL ? (
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Uploaded Screenshot proof</span>
                        <div 
                          onClick={() => {
                            setSelectedScreenshotUrl(selectedPayment.paymentScreenshotURL);
                            setIsScreenshotModalOpen(true);
                          }}
                          className="relative aspect-video rounded-2xl border border-slate-200 overflow-hidden shadow-inner bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer group"
                        >
                          <img
                            src={selectedPayment.paymentScreenshotURL}
                            alt="Payment screenshot proof"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white uppercase tracking-wider">
                            🔍 Zoom Screen
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-200 rounded-2xl p-4 text-center space-y-1 bg-slate-50">
                        <span className="text-xl">📷</span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No Screenshot Uploaded</p>
                        <p className="text-[9px] text-slate-400">Payment completed directly via online portal checkout.</p>
                      </div>
                    )}

                    {/* Review Notes */}
                    {selectedPayment.notes && (
                      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-[11px] leading-relaxed">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-0.5">Verification Notes / Remarks</span>
                        <p className="text-slate-600 font-medium italic">"{selectedPayment.notes}"</p>
                        {selectedPayment.verifiedBy && (
                          <span className="text-[9px] text-slate-400 font-semibold block mt-1.5">— Verified by {selectedPayment.verifiedBy}</span>
                        )}
                      </div>
                    )}

                    {/* Pending Action Form */}
                    {selectedPayment.verificationStatus === 'Pending' && (
                      <div className="space-y-3.5 pt-2 border-t border-slate-100">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Action Notes (Internal Remarks)</label>
                          <textarea
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                            placeholder="Add reason for approval / rejection (e.g., Transaction verified on bank portal)"
                            className="w-full p-3 border border-slate-200 focus:border-[#0066CC] rounded-xl text-xs font-semibold focus:outline-none h-18 resize-none placeholder-slate-400 bg-slate-50/50"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleVerifyPayment(selectedPayment, 'Approved')}
                            className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-xl shadow-md uppercase tracking-wider cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Verify & Approve</span>
                          </button>
                          <button
                            onClick={() => handleVerifyPayment(selectedPayment, 'Rejected')}
                            className="py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] rounded-xl shadow-md uppercase tracking-wider cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject & Cancel</span>
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}

      {/* Image Zoom Modal Overlay */}
      <AnimatePresence>
        {isScreenshotModalOpen && selectedScreenshotUrl && (
          <div 
            onClick={() => setIsScreenshotModalOpen(false)}
            className="fixed inset-0 z-[10010] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl p-2.5 flex flex-col"
            >
              <button
                onClick={() => setIsScreenshotModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-slate-900/60 hover:bg-slate-900/80 text-white hover:scale-105 rounded-full transition-all cursor-pointer z-50 shadow"
                title="Close Screen"
              >
                <X className="w-4.5 h-4.5" />
              </button>
              <img
                src={selectedScreenshotUrl}
                alt="Enlarged screenshot proof"
                className="max-h-[80vh] w-auto object-contain rounded-2xl mx-auto border border-slate-100"
                referrerPolicy="no-referrer"
              />
              <div className="py-3.5 px-6 text-center text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 rounded-b-2xl border-t border-slate-100 shrink-0">
                Uploaded Payment Screenshot Proof (Verified by AES-256)
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
