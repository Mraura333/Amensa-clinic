import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getWhatsAppBookingUrl } from '../utils/whatsapp';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  LogOut, 
  CheckCircle, 
  AlertCircle, 
  ClipboardList, 
  Clock, 
  FileText, 
  Download, 
  Settings, 
  Bell, 
  ChevronRight, 
  Plus, 
  Search, 
  Filter, 
  Camera, 
  UserCheck,
  ShieldCheck,
  RefreshCw,
  X,
  MapPin,
  HelpCircle,
  Activity,
  Grid,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { Booking, HealthPackage, Test, RadiologyService, LocationCard, Payment } from '../types';
import { getStoredPackages, getStoredTests, getStoredRadiology, getStoredLocations } from '../utils/storageHelper';
import { db, collection, query, where, onSnapshot } from '../lib/firebase';

interface PatientPortalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingAdded: () => void;
}

interface PatientProfile {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  dob: string;
  gender: string;
  address: string;
  profileImage: string;
  status: 'active' | 'disabled';
}

export default function PatientPortal({ isOpen, onClose, onBookingAdded }: PatientPortalProps) {
  // Auth Modes: 'login' | 'signup' | 'forgot' | 'reset' | 'dashboard'
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'reset' | 'dashboard'>('login');
  const [activeTab, setActiveTab] = useState<'overview' | 'book' | 'history' | 'payments' | 'reports' | 'profile'>('overview');
  
  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [debugToken, setDebugToken] = useState(''); // Shown on forgot-password request for easy testing
  
  // Logged-in Patient profile
  const [patient, setPatient] = useState<PatientProfile | null>(null);

  // Authentication Forms State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Signup Form State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupDOB, setSignupDOB] = useState('');
  const [signupGender, setSignupGender] = useState('Male');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // Password Reset Forms State
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  // Dashboard Data State
  const [dashboardStats, setDashboardStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedTests: 0,
    reportsAvailable: 0
  });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [patientPayments, setPatientPayments] = useState<Payment[]>([]);

  // Filtering & Search
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('All');
  const [historyDateFilter, setHistoryDateFilter] = useState('');

  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');

  // Profile Edit Form State
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editDOB, setEditDOB] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [editAddress, setEditAddress] = useState('');
  const [editProfilePhoto, setEditProfilePhoto] = useState('');

  // Diagnostics Booking wizard state (Inside Portal)
  const [packages, setPackages] = useState<HealthPackage[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [radiology, setRadiology] = useState<RadiologyService[]>([]);
  const [locations, setLocations] = useState<LocationCard[]>([]);
  
  const [bookItemType, setBookItemType] = useState<'Package' | 'RoutineTest' | 'Radiology'>('Package');
  const [bookItemId, setBookItemId] = useState('');
  const [bookBookingType, setBookBookingType] = useState<'HomeCollection' | 'CenterVisit'>('HomeCollection');
  const [bookDate, setBookDate] = useState('');
  const [bookTimeSlot, setBookTimeSlot] = useState('05:00 PM');
  const [bookAddress, setBookAddress] = useState('');
  const [bookLocationId, setBookLocationId] = useState('loc-mulund-east-primary');
  const [bookPrice, setBookPrice] = useState(0);

  // Load diagnostic catalogs
  useEffect(() => {
    setPackages(getStoredPackages());
    setTests(getStoredTests());
    setRadiology(getStoredRadiology());
    setLocations(getStoredLocations());
    
    // Set default selected items
    const pkgs = getStoredPackages();
    if (pkgs.length > 0) {
      setBookItemId(pkgs[0].id);
      setBookPrice(pkgs[0].price);
    }

    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  // Sync pricing in Booking tab when selection changes
  useEffect(() => {
    if (bookItemType === 'Package') {
      const match = packages.find(p => p.id === bookItemId);
      if (match) setBookPrice(match.price);
    } else if (bookItemType === 'RoutineTest') {
      const match = tests.find(t => t.id === bookItemId);
      if (match) setBookPrice(match.price);
    } else if (bookItemType === 'Radiology') {
      const match = radiology.find(r => r.id === bookItemId);
      if (match) setBookPrice(match.price);
    }
  }, [bookItemType, bookItemId, packages, tests, radiology]);

  // Check authentication on load
  useEffect(() => {
    if (isOpen) {
      checkSession();
    }
  }, [isOpen]);

  // Real-time Firestore Sync for Patient Dashboard
  useEffect(() => {
    if (!isOpen || !patient || !patient.id) return;

    let unsubscribeAppts: (() => void) | null = null;
    let unsubscribeNotifs: (() => void) | null = null;
    let unsubscribeReports: (() => void) | null = null;
    let unsubscribePayments: (() => void) | null = null;

    try {
      // 1. Listen to patient's appointments in real-time
      const apptsQuery = query(
        collection(db, 'appointments'),
        where('patientId', '==', patient.id)
      );
      unsubscribeAppts = onSnapshot(apptsQuery, (snapshot) => {
        const list: Booking[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Booking);
        });
        // Sort by createdAt desc
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setAppointments(list);
        console.log(`[Patient] Synced ${list.length} appointments in real-time`);
      }, (err) => {
        console.warn('Patient appts listener error, bypassing:', err);
      });

      // 2. Listen to patient's notifications in real-time
      const notifsQuery = query(
        collection(db, 'notifications'),
        where('patientId', '==', patient.id)
      );
      unsubscribeNotifs = onSnapshot(notifsQuery, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data());
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setNotifications(list);
        console.log(`[Patient] Synced ${list.length} notifications in real-time`);
      }, (err) => {
        console.warn('Patient notifications listener error, bypassing:', err);
      });

      // 3. Listen to patient's reports in real-time
      const reportsQuery = query(
        collection(db, 'reports'),
        where('patientId', '==', patient.id)
      );
      unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data());
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setReports(list);
        console.log(`[Patient] Synced ${list.length} reports in real-time`);
      }, (err) => {
        console.warn('Patient reports listener error, bypassing:', err);
      });

      // 4. Listen to patient's payments in real-time (by phone number)
      if (patient.mobile) {
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('patientPhone', '==', patient.mobile)
        );
        unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
          const list: Payment[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as Payment);
          });
          list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setPatientPayments(list);
          console.log(`[Patient] Synced ${list.length} payments in real-time`);
        }, (err) => {
          console.warn('Patient payments listener error, bypassing:', err);
        });
      }

    } catch (e) {
      console.warn('Patient real-time Firestore sync error:', e);
    }

    return () => {
      if (unsubscribeAppts) unsubscribeAppts();
      if (unsubscribeNotifs) unsubscribeNotifs();
      if (unsubscribeReports) unsubscribeReports();
      if (unsubscribePayments) unsubscribePayments();
    };
  }, [isOpen, patient?.id]);

  // Toast Helper
  const showToast = (err: string, succ = '') => {
    setErrorMessage(err);
    setSuccessMessage(succ);
    if (err || succ) {
      const timer = setTimeout(() => {
        setErrorMessage('');
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  };

  const checkSession = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setPatient(data);
        syncDashboardData();
        setAuthMode('dashboard');
        // Pre-populate edit form
        setEditName(data.fullName);
        setEditMobile(data.mobile);
        setEditDOB(data.dob);
        setEditGender(data.gender);
        setEditAddress(data.address || '');
        setEditProfilePhoto(data.profileImage || '');
        setBookAddress(data.address || '');
      } else {
        setPatient(null);
        setAuthMode('login');
      }
    } catch (err) {
      console.error("Session check error:", err);
      setAuthMode('login');
    } finally {
      setIsLoading(false);
    }
  };

  const syncDashboardData = async () => {
    try {
      const res = await fetch('/api/patient/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboardStats(data.stats);
        setAppointments(data.appointments);
        setNotifications(data.notifications);
        setReports(data.reports);
      }
    } catch (err) {
      console.error("Dashboard synchronization failure:", err);
    }
  };

  // Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    showToast('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          rememberMe
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPatient(data.patient);
        // Pre-populate edits
        setEditName(data.patient.fullName);
        setEditMobile(data.patient.mobile);
        setEditDOB(data.patient.dob);
        setEditGender(data.patient.gender);
        setEditAddress(data.patient.address || '');
        setEditProfilePhoto(data.patient.profileImage || '');
        setBookAddress(data.patient.address || '');
        
        await syncDashboardData();
        setAuthMode('dashboard');
        setActiveTab('overview');
        showToast('', 'Sign-in authorized successfully.');
      } else {
        showToast(data.error || 'Authentication check failed.');
      }
    } catch (err) {
      showToast('Connection to clinical backend node interrupted.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    showToast('');

    if (signupPassword !== signupConfirmPassword) {
      showToast('Verify Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: signupName,
          email: signupEmail,
          mobile: signupMobile,
          dob: signupDOB,
          gender: signupGender,
          password: signupPassword,
          confirmPassword: signupConfirmPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPatient(data.patient);
        setEditName(data.patient.fullName);
        setEditMobile(data.patient.mobile);
        setEditDOB(data.patient.dob);
        setEditGender(data.patient.gender);
        setEditAddress('');
        setBookAddress('');
        
        await syncDashboardData();
        setAuthMode('dashboard');
        setActiveTab('overview');
        showToast('', 'Patient registration active. Welcome!');
      } else {
        showToast(data.error || 'Registration failed.');
      }
    } catch (err) {
      showToast('Failed to contact clinical server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    showToast('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('', data.message);
        if (data.debugToken) {
          setDebugToken(data.debugToken);
          setResetToken(data.debugToken); // Auto-fill code for convenience
        }
        setAuthMode('reset');
      } else {
        showToast(data.error || 'Password reset request failed.');
      }
    } catch (err) {
      showToast('Internal Server Error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    showToast('');

    if (resetNewPassword !== resetConfirmPassword) {
      showToast('New passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword: resetNewPassword,
          confirmPassword: resetConfirmPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('', data.message);
        setAuthMode('login');
        setDebugToken('');
      } else {
        showToast(data.error || 'Failed to verify reset code.');
      }
    } catch (err) {
      showToast('Reset action failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    showToast('');

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editName,
          mobile: editMobile,
          dob: editDOB,
          gender: editGender,
          address: editAddress,
          profileImage: editProfilePhoto
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPatient(data.patient);
        showToast('', 'Profile updated successfully.');
        syncDashboardData();
      } else {
        showToast(data.error || 'Failed to modify profile records.');
      }
    } catch (err) {
      showToast('Network error while saving profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    showToast('');

    let selectedItemName = '';
    if (bookItemType === 'Package') {
      selectedItemName = packages.find(p => p.id === bookItemId)?.name || 'Package';
    } else if (bookItemType === 'RoutineTest') {
      selectedItemName = tests.find(t => t.id === bookItemId)?.name || 'Routine Pathology';
    } else if (bookItemType === 'Radiology') {
      selectedItemName = radiology.find(r => r.id === bookItemId)?.name || 'Radiology Scan';
    }

    try {
      const res = await fetch('/api/patient/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedItemType: bookItemType,
          selectedItemId: bookItemId,
          selectedItemName,
          bookingType: bookBookingType,
          preferredDate: bookDate,
          preferredTimeSlot: bookTimeSlot,
          address: bookBookingType === 'HomeCollection' ? bookAddress : undefined,
          locationId: bookBookingType === 'CenterVisit' ? bookLocationId : undefined,
          pricePaid: bookPrice
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('', 'Appointment scheduled! Confirmation alert sent.');
        await syncDashboardData();
        setActiveTab('overview');
        onBookingAdded(); // Trigger localstorage / state sync in host
      } else {
        showToast(data.error || 'Fulfillment request failed.');
      }
    } catch (err) {
      showToast('Failed to queue clinical booking.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setPatient(null);
      setAuthMode('login');
      showToast('', 'Signed out of patient session.');
    } catch (err) {
      showToast('Logout connection issue.');
    } finally {
      setIsLoading(false);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const res = await fetch('/api/patient/notifications/read', { method: 'POST' });
      if (res.ok) {
        syncDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filters for Appointment History
  const filteredAppointments = appointments.filter(appt => {
    const matchesSearch = appt.selectedItemName.toLowerCase().includes(historySearch.toLowerCase()) || 
                          appt.id.toLowerCase().includes(historySearch.toLowerCase());
    
    const matchesStatus = historyStatusFilter === 'All' || appt.status === historyStatusFilter;
    const matchesDate = !historyDateFilter || appt.preferredDate === historyDateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Filters for Payments & Receipts
  const filteredPayments = patientPayments.filter(pay => {
    const pName = pay.packageName || pay.serviceName || '';
    const matchesSearch = pName.toLowerCase().includes(paymentSearch.toLowerCase()) || 
                          pay.paymentId.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                          pay.transactionId.toLowerCase().includes(paymentSearch.toLowerCase());
    
    const matchesStatus = paymentStatusFilter === 'All' || 
                          pay.paymentStatus === paymentStatusFilter || 
                          pay.verificationStatus === paymentStatusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 font-sans">
      <div className="bg-[#FAFBFD] w-full max-w-7xl h-[95vh] sm:h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-200">
        
        {/* Header Ribbon */}
        <div className="bg-[#0066CC] px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-[#0066CC] flex items-center justify-center font-black text-xs tracking-wider shadow-md">
              AMS
            </div>
            <div>
              <h2 className="text-white text-sm font-black tracking-wide flex items-center gap-2">
                Amensa Patient Portal
                <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-300 bg-white/10 border border-white/20 px-2 py-0.5 rounded">
                  Secure Server Node
                </span>
              </h2>
              <p className="text-white/80 text-[10px] mt-0.5 font-bold">
                {patient ? `Secure Patient Session: ${patient.fullName} (${patient.id})` : 'Access Restricted to Registered Patients'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {authMode === 'dashboard' && patient && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-rose-600/20 text-white border border-white/20 hover:border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Logout Session"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Floating Toast Notification inside Modal */}
        {(errorMessage || successMessage) && (
          <div className="px-4 sm:px-6 py-2 shrink-0">
            {errorMessage ? (
              <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2.5 animate-slide-in">
                <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2.5 animate-slide-in">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Content body switcher */}
        {authMode === 'login' && (
          /* Login Dialog */
          <div className="flex-1 flex items-center justify-center p-4 bg-slate-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#E8EEF5] rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full space-y-6"
            >
              <div className="text-center">
                <Lock className="w-10 h-10 text-[#0066CC] mx-auto mb-3 stroke-[1.5]" />
                <h3 className="font-black text-slate-800 text-lg">Sign In to Your Account</h3>
                <p className="text-slate-400 text-xs mt-1 font-semibold">
                  Track bookings, view blood assay logs, and retrieve diagnostic reports.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. patient@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0066CC] focus:bg-white rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase">Security Password</label>
                    <button 
                      type="button" 
                      onClick={() => setAuthMode('forgot')}
                      className="text-[11px] font-bold text-[#0066CC] hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0066CC] focus:bg-white rounded-xl text-xs font-semibold text-slate-800"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <label className="flex items-center gap-2 font-semibold text-slate-600 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-[#0066CC] focus:ring-[#0066CC]" 
                    />
                    <span>Remember Me</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#0066CC] hover:bg-[#0052CC] text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-lg transition-all flex justify-center items-center gap-2"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Authorize & Sign In'}
                </button>
              </form>

              <div className="text-center pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-semibold">
                  New Patient?{' '}
                  <button 
                    onClick={() => setAuthMode('signup')}
                    className="font-black text-[#0066CC] hover:underline cursor-pointer"
                  >
                    Register Clinical Account
                  </button>
                </p>
                <p className="text-[10px] text-slate-400 font-bold mt-3 leading-relaxed">
                  Demo Client Node: <strong>patient@example.com</strong> / Password: <strong>amensa2026</strong>
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {authMode === 'signup' && (
          /* Sign Up Dialog */
          <div className="flex-1 flex items-center justify-center p-4 bg-slate-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#E8EEF5] rounded-2xl shadow-xl p-6 sm:p-8 max-w-lg w-full space-y-5 my-4"
            >
              <div className="text-center">
                <UserCheck className="w-10 h-10 text-[#0066CC] mx-auto mb-2 stroke-[1.5]" />
                <h3 className="font-black text-slate-800 text-lg">Create Patient Account</h3>
                <p className="text-slate-400 text-xs mt-0.5 font-semibold">
                  Complete your patient profile to establish secure clinical records.
                </p>
              </div>

              <form onSubmit={handleSignup} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Name (As on ID)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Aman Kumar"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0066CC] focus:bg-white rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    placeholder="e.g. patient@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0066CC] focus:bg-white rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mobile Contact Number</label>
                  <input 
                    type="tel" 
                    required
                    pattern="[0-9]{10}"
                    placeholder="10-digit mobile number"
                    value={signupMobile}
                    onChange={(e) => setSignupMobile(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0066CC] focus:bg-white rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date of Birth</label>
                  <input 
                    type="date" 
                    required
                    value={signupDOB}
                    onChange={(e) => setSignupDOB(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0066CC] focus:bg-white rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gender</label>
                  <select 
                    value={signupGender}
                    onChange={(e) => setSignupGender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0066CC] focus:bg-white rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="Min 6 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0066CC] focus:bg-white rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Confirm Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="Repeat password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0066CC] focus:bg-white rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#0066CC] hover:bg-[#0052CC] text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-lg transition-all flex justify-center items-center gap-2"
                  >
                    {isLoading ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : 'Register & Create Account'}
                  </button>
                </div>
              </form>

              <div className="text-center pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-semibold">
                  Already have a registered file?{' '}
                  <button 
                    onClick={() => setAuthMode('login')}
                    className="font-black text-[#0066CC] hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {authMode === 'forgot' && (
          /* Forgot Password Dialog */
          <div className="flex-1 flex items-center justify-center p-4 bg-slate-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#E8EEF5] rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full space-y-6"
            >
              <div className="text-center">
                <Unlock className="w-10 h-10 text-[#0066CC] mx-auto mb-3 stroke-[1.5]" />
                <h3 className="font-black text-slate-800 text-lg">Reset Password</h3>
                <p className="text-slate-400 text-xs mt-1 font-semibold">
                  Enter your registered clinical email to receive a password reset token.
                </p>
              </div>

              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Clinical Account Email</label>
                  <input 
                    type="email" 
                    required
                    placeholder="e.g. patient@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0066CC] focus:bg-white rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#0066CC] hover:bg-[#0052CC] text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-lg transition-all flex justify-center items-center gap-2"
                >
                  {isLoading ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : 'Request Security Code'}
                </button>
              </form>

              <div className="text-center pt-2">
                <button 
                  onClick={() => setAuthMode('login')}
                  className="text-xs font-black text-slate-500 hover:text-[#0066CC] cursor-pointer"
                >
                  Back to login
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {authMode === 'reset' && (
          /* Reset Password Dialog */
          <div className="flex-1 flex items-center justify-center p-4 bg-slate-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#E8EEF5] rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full space-y-6"
            >
              <div className="text-center">
                <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto mb-3 stroke-[1.5]" />
                <h3 className="font-black text-slate-800 text-lg">Enter Security Code</h3>
                <p className="text-slate-400 text-xs mt-1 font-semibold">
                  Provide the security reset code and set your new account password.
                </p>
              </div>

              {debugToken && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs font-semibold leading-relaxed">
                  🔒 <strong>Clinical Simulation Code:</strong> {debugToken}<br/>
                  We have prefilled this in the token box below for your convenience.
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 font-mono">Reset Code Token</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. AMS-RST-123456"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0066CC] focus:bg-white rounded-xl text-xs font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">New Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="At least 6 characters"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0066CC] focus:bg-white rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="Repeat new password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0066CC] focus:bg-white rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#0066CC] hover:bg-[#0052CC] text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-lg transition-all flex justify-center items-center gap-2"
                >
                  {isLoading ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : 'Update Secure Password'}
                </button>
              </form>

              <div className="text-center">
                <button 
                  onClick={() => setAuthMode('login')}
                  className="text-xs font-bold text-slate-500 hover:text-[#0066CC] cursor-pointer"
                >
                  Back to login
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {authMode === 'dashboard' && patient && (
          /* Main Bento Dashboard Split View */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Left Nav Rails */}
            <div className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-row md:flex-col justify-between shrink-0 overflow-hidden">
              <div className="p-2 sm:p-4 flex flex-row md:flex-col flex-nowrap md:flex-wrap items-center md:items-stretch gap-1.5 w-full overflow-x-auto md:overflow-x-visible scrollbar-visible-dark pb-3 md:pb-4">
                
                {/* Patient Capsule profile info */}
                <div className="hidden md:flex items-center gap-3 p-3.5 mb-4 bg-slate-800/40 rounded-xl border border-slate-700/20">
                  <div className="relative group shrink-0">
                    <img 
                      src={patient.profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop"} 
                      alt="Profile Avatar"
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#0066CC]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-white font-black text-xs truncate">{patient.fullName}</h4>
                    <p className="text-slate-400 text-[10px] font-bold tracking-tight uppercase truncate">ID: {patient.id}</p>
                  </div>
                </div>

                {[
                  { id: 'overview' as const, label: 'Bento Overview', icon: Grid },
                  { id: 'book' as const, label: 'Schedule Pathology', icon: Plus },
                  { id: 'history' as const, label: 'Appointment Records', icon: ClipboardList },
                  { id: 'payments' as const, label: 'Payments & Receipts', icon: CreditCard },
                  { id: 'reports' as const, label: 'Lab Reports Cabinet', icon: FileText },
                  { id: 'profile' as const, label: 'My Profile settings', icon: Settings }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all shrink-0 md:w-full ${
                        activeTab === tab.id
                          ? 'bg-[#0066CC] text-white shadow-lg shadow-blue-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5 shrink-0" />
                      <span className="hidden md:inline">{tab.label}</span>
                    </button>
                  );
                })}

                {/* Logout button for mobile only inside the tab rail */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all shrink-0 md:hidden text-rose-400 hover:text-white hover:bg-rose-950/40 border border-transparent hover:border-rose-900/20"
                  title="Logout Session"
                >
                  <LogOut className="w-4.5 h-4.5 shrink-0" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-slate-800 hidden md:block">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 font-extrabold text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700/30 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout Session</span>
                </button>
              </div>
            </div>

            {/* Active Sub-Workspace */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#F5F7FA]">
              
              {activeTab === 'overview' && (
                /* Bento Overview Tab */
                <div className="space-y-6">
                  
                  {/* Top clinical welcome */}
                  <div className="bg-white border border-[#E8EEF5] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <h3 className="font-black text-slate-800 text-lg sm:text-xl">Good day, {patient.fullName}!</h3>
                      <p className="text-slate-500 text-xs mt-1 font-semibold">
                        Your electronic clinical reference panel is fully active. Access certified laboratory diagnostics safely.
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('book')}
                      className="px-4 py-2.5 bg-[#0066CC] hover:bg-[#0052CC] text-white text-xs font-black rounded-xl cursor-pointer shadow-md flex items-center justify-center gap-1.5 shrink-0 transition-transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Book Diagnostic Test</span>
                    </button>
                  </div>

                  {/* Core Statistics bento grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Bookings', value: dashboardStats.totalBookings, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { label: 'Pending Bookings', value: dashboardStats.pendingBookings, color: 'text-amber-600', bg: 'bg-amber-50' },
                      { label: 'Completed Tests', value: dashboardStats.completedTests, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { label: 'Reports Available', value: dashboardStats.reportsAvailable, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-white border border-[#E8EEF5] p-4.5 rounded-2xl shadow-sm flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                          <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
                        </div>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.bg}`}>
                          <ClipboardList className={`w-4.5 h-4.5 ${stat.color}`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dynamic split panels: appointments vs notifications */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left 2 cols: Upcoming appointments */}
                    <div className="lg:col-span-2 bg-white border border-[#E8EEF5] rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-4.5 h-4.5 text-[#0066CC]" />
                          Scheduled Pathology Sessions
                        </h4>
                        <button 
                          onClick={() => setActiveTab('history')}
                          className="text-[10px] font-bold text-[#0066CC] hover:underline"
                        >
                          View All
                        </button>
                      </div>

                      <div className="space-y-3">
                        {appointments.slice(0, 3).length > 0 ? (
                          appointments.slice(0, 3).map((appt) => (
                            <div key={appt.id} className="p-3.5 border border-slate-100 bg-slate-50/50 rounded-xl flex items-center justify-between text-xs hover:border-[#0066CC]/20 transition-all">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-[#0066CC]">{appt.id}</span>
                                  <span className="text-[10px] text-slate-400">•</span>
                                  <span className="text-slate-400 font-semibold">{appt.preferredDate}</span>
                                </div>
                                <strong className="text-slate-800 block mt-1.5 text-[13px]">{appt.selectedItemName}</strong>
                                <span className="text-slate-500 block mt-1 font-semibold text-[11px]">
                                  {appt.bookingType === 'HomeCollection' ? '🏠 Home Blood Draw' : '🏢 Centre Visit'} • Slot: {appt.preferredTimeSlot}
                                </span>
                              </div>
                              <div>
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                  appt.status === 'Completed' || appt.status === 'Report Ready' ? 'bg-emerald-50 text-emerald-700' : 
                                  appt.status === 'Cancelled' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                                }`}>
                                  {appt.status}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-slate-400">
                            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
                            <p className="text-xs font-semibold">No pathology appointments scheduled.</p>
                            <button 
                              onClick={() => setActiveTab('book')}
                              className="text-xs text-[#0066CC] font-bold hover:underline mt-1"
                            >
                              Schedule blood test now
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right col: Notifications Alerts */}
                    <div className="bg-white border border-[#E8EEF5] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Bell className="w-4.5 h-4.5 text-[#00A884]" />
                            Fulfillment Alerts
                          </h4>
                          {notifications.some(n => !n.read) && (
                            <button 
                              onClick={markAllNotificationsAsRead}
                              className="text-[10px] font-bold text-emerald-600 hover:underline"
                            >
                              Clear Alerts
                            </button>
                          )}
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                          {notifications.length > 0 ? (
                            notifications.map((notif) => (
                              <div key={notif.id} className={`p-3 rounded-xl border transition-all text-xs ${notif.read ? 'bg-slate-50/50 border-slate-100 text-slate-600' : 'bg-emerald-50/20 border-emerald-100 text-slate-800'}`}>
                                <div className="flex justify-between items-start">
                                  <strong className="font-bold text-[12px] text-slate-800">{notif.title}</strong>
                                  <span className="text-[9px] text-slate-400 font-bold shrink-0">{new Date(notif.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-[11px] mt-1 text-slate-500 font-semibold leading-relaxed">{notif.message}</p>
                              </div>
                            ))
                          ) : (
                            <div className="py-12 text-center text-slate-400">
                              <Bell className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                              <p className="text-xs font-semibold">No medical alerts.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {activeTab === 'book' && (
                /* Interactive Booking tab inside portal */
                <div className="bg-white border border-[#E8EEF5] rounded-2xl p-6 shadow-sm flex flex-col items-center text-center max-w-xl mx-auto space-y-6 my-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
                    <Activity className="w-8 h-8 text-[#00A884]" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-lg">
                      Schedule Diagnostics on WhatsApp
                    </h3>
                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                      To provide a smoother scheduling experience, Amensa Diagnostics now accepts bookings directly through WhatsApp! 
                    </p>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Our clinical coordinator will instantly confirm your slot and phlebotomist assignment.
                    </p>
                  </div>
                  <a
                    href={getWhatsAppBookingUrl('Patient Portal Health Test')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#45b02f] text-white text-xs font-black rounded-xl hover:bg-[#3ca128] transition-all cursor-pointer shadow-md shadow-emerald-100 w-full"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span>Connect & Book on WhatsApp</span>
                  </a>
                </div>
              )}

              {activeTab === 'history' && (
                /* Booking History tab with filtering */
                <div className="bg-white border border-[#E8EEF5] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-black text-slate-800 text-base">Fulfillment Order History</h3>
                      <p className="text-slate-400 text-xs mt-0.5 font-semibold">Track pathology, specimen collection, and report statuses.</p>
                    </div>
                  </div>

                  {/* Filters block */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search by test name or ID..."
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-[#0066CC] rounded-lg text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <select 
                        value={historyStatusFilter}
                        onChange={(e) => setHistoryStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-[#0066CC] rounded-lg text-xs font-bold text-slate-600 cursor-pointer"
                      >
                        <option value="All">All Fulfillment Statuses</option>
                        <option value="Pending">Pending Assignment</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Sample Collected">Sample Collected</option>
                        <option value="Processing">In-Lab Processing</option>
                        <option value="Report Ready">Report Ready</option>
                        <option value="Completed">Completed & Dispatched</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <input 
                        type="date" 
                        value={historyDateFilter}
                        onChange={(e) => setHistoryDateFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-[#0066CC] rounded-lg text-xs font-semibold text-slate-600"
                      />
                    </div>
                  </div>

                  {/* Table or Cards */}
                  <div className="space-y-3.5">
                    {filteredAppointments.length > 0 ? (
                      filteredAppointments.map((appt) => (
                        <div key={appt.id} className="p-4 border border-[#E8EEF5] bg-white rounded-xl hover:shadow-sm transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-xs text-[#0066CC]">{appt.id}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[11px] font-bold text-slate-400 uppercase">{appt.preferredDate} ({appt.preferredTimeSlot})</span>
                            </div>
                            <h4 className="font-black text-slate-800 text-[14px] mt-1.5">{appt.selectedItemName}</h4>
                            <p className="text-[11px] text-slate-500 font-semibold mt-1">
                              Fulfillment: {appt.bookingType === 'HomeCollection' ? '🏠 Home specimen collection' : '🏢 Centre visit walk-in'}
                            </p>
                            {appt.bookingType === 'HomeCollection' && (
                              <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate max-w-lg">Address: {appt.address}</p>
                            )}
                          </div>

                          <div className="flex sm:flex-col items-start sm:items-end gap-3 shrink-0 justify-between sm:justify-start">
                            <span className="font-mono font-extrabold text-emerald-600 text-sm">₹{appt.pricePaid}</span>
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                              appt.status === 'Completed' || appt.status === 'Report Ready' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              appt.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                              'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                              {appt.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 text-slate-400">
                        <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-xs font-bold text-slate-500">No matching diagnostic records located.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'payments' && (
                /* Payments & Receipts Tab */
                <div className="bg-white border border-[#E8EEF5] rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="font-black text-slate-800 text-base">Payments & Receipts Ledger</h3>
                      <p className="text-slate-400 text-xs mt-0.5 font-semibold">Verify digital UPI submissions, check verification states, and view transactional logs.</p>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Search by ID, transaction ref, package..."
                        value={paymentSearch}
                        onChange={(e) => setPaymentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#FAFBFD] border border-[#E8EEF5] rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#0066CC] focus:bg-white transition-all"
                      />
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={paymentStatusFilter}
                          onChange={(e) => setPaymentStatusFilter(e.target.value)}
                          className="pl-9 pr-8 py-2.5 bg-[#FAFBFD] border border-[#E8EEF5] rounded-xl text-xs font-black text-slate-600 appearance-none focus:outline-none focus:border-[#0066CC] focus:bg-white cursor-pointer transition-all text-ellipsis overflow-hidden"
                        >
                          <option value="All">All Statuses</option>
                          <option value="Pending">Verification Pending</option>
                          <option value="Approved">Verified / Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Paid">Paid</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Payments list */}
                  <div className="space-y-4">
                    {filteredPayments.length > 0 ? (
                      filteredPayments.map((pay) => (
                        <div 
                          key={pay.paymentId} 
                          className="p-5 border border-[#E8EEF5] bg-[#FAFBFD]/30 rounded-xl hover:border-blue-100 transition-all flex flex-col md:flex-row justify-between items-start gap-4"
                        >
                          <div className="space-y-2.5 flex-1 min-w-0 w-full">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-black text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">
                                PAYMENT ID: {pay.paymentId}
                              </span>
                              <span className="text-[11px] text-slate-400 font-bold">
                                {pay.createdAt ? new Date(pay.createdAt).toLocaleString() : 'N/A'}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-black text-slate-800 text-sm truncate">
                                {pay.packageName || pay.serviceName || 'Diagnostic pathology profile'}
                              </h4>
                              {pay.bookingId && (
                                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                                  Linked Booking ID: <span className="font-mono text-slate-600 font-bold">{pay.bookingId}</span>
                                </p>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4 border-t border-slate-100/70 pt-2.5 mt-1">
                              <div className="text-[11px]">
                                <span className="text-slate-400 font-bold">Method:</span>{' '}
                                <span className="text-slate-700 font-extrabold capitalize">{pay.paymentMethod}</span>
                              </div>
                              <div className="text-[11px]">
                                <span className="text-slate-400 font-bold">Transaction Ref:</span>{' '}
                                <span className="font-mono text-slate-700 font-extrabold break-all">{pay.transactionId || 'Manual verification'}</span>
                              </div>
                              {pay.serviceCategory && (
                                <div className="text-[11px]">
                                  <span className="text-slate-400 font-bold">Category:</span>{' '}
                                  <span className="text-slate-700 font-extrabold capitalize">{pay.serviceCategory}</span>
                                </div>
                              )}
                            </div>

                            {pay.notes && (
                              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-slate-600 text-[11px] font-semibold">
                                <span className="font-bold text-slate-800">Note:</span> {pay.notes}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-row md:flex-col items-end justify-between md:justify-start gap-4 shrink-0 w-full md:w-auto border-t md:border-t-0 border-slate-100/70 pt-3 md:pt-0">
                            <div className="text-right flex flex-col items-start md:items-end gap-1">
                              <span className="font-mono font-black text-emerald-600 text-base">₹{pay.amount}</span>
                              
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                pay.verificationStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                pay.verificationStatus === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                {pay.verificationStatus === 'Approved' ? 'Verified / Approved' :
                                 pay.verificationStatus === 'Rejected' ? 'Rejected' :
                                 'Verification Pending'}
                              </span>
                            </div>

                            {pay.paymentScreenshotURL && (
                              <a 
                                href={pay.paymentScreenshotURL}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-[10px] font-black rounded-lg border border-slate-200 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Receipt Screenshot</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 text-slate-400">
                        <CreditCard className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-xs font-bold text-slate-500">No payment transaction records located.</p>
                        <p className="text-[11px] text-slate-400 mt-1">Submit bookings with UPI checkout screenshots on WhatsApp or online to view invoice histories.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                /* Medical reports cabinet */
                <div className="bg-white border border-[#E8EEF5] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
                  <div>
                    <h3 className="font-black text-slate-800 text-base">Certified Lab Reports Cabinet</h3>
                    <p className="text-slate-400 text-xs mt-0.5 font-semibold">Review double-blind validated digital health assays, and print PDF receipts.</p>
                  </div>

                  <div className="space-y-4">
                    {reports.length > 0 ? (
                      reports.map((rep) => (
                        <div key={rep.id} className="p-4 border border-[#E8EEF5] bg-slate-50/30 rounded-xl hover:border-blue-200 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{rep.id}</span>
                              <span className="text-[11px] text-slate-400 font-bold">{new Date(rep.date).toLocaleDateString()}</span>
                            </div>
                            <h4 className="font-black text-slate-800 text-[14px]">{rep.testName}</h4>
                            <p className="text-[11px] text-slate-400 font-semibold italic">Lab Note: {rep.notes || 'Double-blind verified biochemical assay completed.'}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                            <a 
                              href={`/api/patient/reports/download/${rep.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2 bg-[#0066CC] hover:bg-[#0052CC] text-white text-xs font-black rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all w-full sm:w-auto"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download PDF Report</span>
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 text-slate-400">
                        <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-xs font-bold text-slate-500">No laboratory test reports filed yet.</p>
                        <p className="text-[11px] text-slate-400 mt-1">Once reports are uploaded by our clinical team, they will populate here instantly.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                /* My Profile Edit Settings */
                <div className="bg-white border border-[#E8EEF5] rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="font-black text-slate-800 text-base">Patient Profile Coordinates</h3>
                    <p className="text-slate-400 text-xs mt-0.5 font-semibold">Update your clinical coordinates. Core accounts credentials are locked for identity verification safety.</p>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-5">
                    
                    {/* Avatar photo row */}
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                      <div className="relative shrink-0">
                        <img 
                          src={editProfilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop"} 
                          alt="Patient Avatar" 
                          className="w-16 h-16 rounded-full object-cover border-2 border-[#0066CC]"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-slate-900 text-white p-1 rounded-full border border-white cursor-pointer hover:bg-[#0066CC] transition-colors">
                          <Camera className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Avatar Image URL</label>
                        <input 
                          type="text" 
                          placeholder="Paste image address..."
                          value={editProfilePhoto}
                          onChange={(e) => setEditProfilePhoto(e.target.value)}
                          className="w-full sm:w-96 px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-[#0066CC] rounded-lg text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0066CC] rounded-lg text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Registered Email (Locked)</label>
                        <input 
                          type="email" 
                          disabled
                          value={patient.email}
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 cursor-not-allowed"
                          title="Please contact clinical support to change emails."
                        />
                        <p className="text-[9px] text-slate-400 mt-0.5 font-bold">Email changes require 2FA clinical verification.</p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mobile Contact Number</label>
                        <input 
                          type="tel" 
                          required
                          pattern="[0-9]{10}"
                          value={editMobile}
                          onChange={(e) => setEditMobile(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0066CC] rounded-lg text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date of Birth</label>
                        <input 
                          type="date" 
                          required
                          value={editDOB}
                          onChange={(e) => setEditDOB(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0066CC] rounded-lg text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gender Identification</label>
                        <select 
                          value={editGender}
                          onChange={(e) => setEditGender(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0066CC] rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Home Collection Address</label>
                        <textarea 
                          rows={2}
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0066CC] rounded-lg text-xs font-semibold"
                          placeholder="e.g. Flat B-201, Green Meadows, LBS Marg, Mulund West"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-3 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-5 py-2.5 bg-[#0066CC] hover:bg-[#0052CC] text-white text-xs font-black rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
                      >
                        {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        <span>Save Clinical Coordinates</span>
                      </button>
                    </div>

                  </form>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
