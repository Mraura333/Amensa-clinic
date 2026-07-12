import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

const DB_FILE = path.join(process.cwd(), 'db.json');
const JWT_SECRET = process.env.JWT_SECRET || 'amensa_clinical_secure_key_2026';

// Config path for Firebase Applet Config
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let adminDb: Firestore | null = null;

if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    let app;
    if (getApps().length === 0) {
      app = initializeApp({
        projectId: config.projectId,
      });
    } else {
      app = getApps()[0];
    }
    adminDb = getFirestore(app, config.firestoreDatabaseId || '(default)');
    console.log('Firebase Admin SDK initialized successfully with project:', config.projectId);
  } catch (err) {
    console.error('Failed to initialize Firebase Admin SDK:', err);
  }
} else {
  console.warn('firebase-applet-config.json not found, falling back to default ADC initialization.');
  try {
    let app;
    if (getApps().length === 0) {
      app = initializeApp();
    } else {
      app = getApps()[0];
    }
    adminDb = getFirestore(app);
  } catch (err) {
    console.error('Firebase Admin default init failed:', err);
  }
}

export interface Patient {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  passwordHash: string;
  dob: string;
  gender: string;
  address: string;
  profileImage: string;
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  mobile: string;
  email: string;
  selectedItemType: 'Package' | 'RoutineTest' | 'Radiology';
  selectedItemId: string;
  selectedItemName: string;
  bookingType: 'HomeCollection' | 'CenterVisit';
  preferredDate: string;
  preferredTimeSlot: string;
  address?: string;
  locationId?: string;
  pricePaid: number;
  status: 'Pending' | 'Confirmed' | 'Sample Collected' | 'Processing' | 'Report Ready' | 'Completed' | 'Cancelled' | 'Paid';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  patientId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface Report {
  id: string;
  patientId: string;
  bookingId: string;
  testName: string;
  date: string;
  pdfUrl: string;
  notes?: string;
  createdAt: string;
}

export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
  branch: string;
  lastSyncTime?: string;
  lastCommitHash?: string;
  status: 'Connected' | 'Disconnected';
}

export interface SchedulingConfig {
  openingTime: string; // e.g. "08:00"
  closingTime: string; // e.g. "21:00"
  interval: number; // e.g. 15 | 30 | 60
  holidayClosures: string[]; // list of dates (YYYY-MM-DD)
  unavailableTimeSlots: string[]; // list of times (HH:MM)
}

interface DatabaseSchema {
  patients: Patient[];
  appointments: Appointment[];
  notifications: Notification[];
  reports: Report[];
  payments?: any[];
  passwordResetTokens: { [token: string]: { email: string; expires: number } };
  githubConfig?: GitHubConfig;
  adminPasswordHash?: string;
  schedulingConfig?: SchedulingConfig;
}

// Memory-based rate limiter
const loginAttempts: { [key: string]: { count: number; lockUntil: number } } = {};

export function checkRateLimit(identifier: string): { allowed: boolean; waitTimeMinutes?: number } {
  const now = Date.now();
  const attempt = loginAttempts[identifier];
  
  if (attempt && attempt.lockUntil > now) {
    const waitTimeMs = attempt.lockUntil - now;
    return {
      allowed: false,
      waitTimeMinutes: Math.ceil(waitTimeMs / 60000)
    };
  }
  
  return { allowed: true };
}

export function registerFailedLoginAttempt(identifier: string) {
  const now = Date.now();
  if (!loginAttempts[identifier]) {
    loginAttempts[identifier] = { count: 1, lockUntil: 0 };
  } else {
    loginAttempts[identifier].count += 1;
    if (loginAttempts[identifier].count >= 5) {
      // Lock for 15 minutes
      loginAttempts[identifier].lockUntil = now + 15 * 60 * 1000;
    }
  }
}

export function resetLoginAttempts(identifier: string) {
  if (loginAttempts[identifier]) {
    delete loginAttempts[identifier];
  }
}

// Load DB
export function getDB(): DatabaseSchema {
  const defaultScheduling: SchedulingConfig = {
    openingTime: "08:00",
    closingTime: "21:00",
    interval: 30,
    holidayClosures: [],
    unavailableTimeSlots: []
  };

  if (!fs.existsSync(DB_FILE)) {
    const initialDB: DatabaseSchema = {
      patients: [],
      appointments: [],
      notifications: [],
      reports: [],
      passwordResetTokens: {},
      schedulingConfig: defaultScheduling
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf-8');
    return initialDB;
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data) as DatabaseSchema;
    if (!parsed.schedulingConfig) {
      parsed.schedulingConfig = defaultScheduling;
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch (err) {
    console.error('Error reading database file, resetting database:', err);
    const initialDB: DatabaseSchema = {
      patients: [],
      appointments: [],
      notifications: [],
      reports: [],
      passwordResetTokens: {},
      schedulingConfig: defaultScheduling
    };
    return initialDB;
  }
}

// Save DB (Saves locally and triggers background sync to Firestore)
export function saveDB(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to database file:', err);
  }

  // Trigger Async Firestore write sync
  if (adminDb) {
    syncToFirestore(db).catch(err => {
      console.error('Async background Firestore synchronization failed:', err);
    });
  }
}

// Password utility
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// JWT helper
export function generateToken(patientId: string, email: string): string {
  return jwt.sign({ id: patientId, email }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Add system-level notification trigger
export function addNotification(patientId: string, title: string, message: string) {
  const db = getDB();
  const newNotif: Notification = {
    id: `AMS-N${Math.floor(100000 + Math.random() * 900000)}`,
    patientId,
    title,
    message,
    createdAt: new Date().toISOString(),
    read: false
  };
  db.notifications.unshift(newNotif);
  saveDB(db);
}

// Asynchronous background writer to Firestore
export async function syncToFirestore(db: DatabaseSchema) {
  if (!adminDb) return;
  
  try {
    // 1. Sync Patients
    const currentPatients = db.patients || [];
    for (const patient of currentPatients) {
      await adminDb.collection('patients').doc(patient.id).set(patient);
    }
    const localPatientIds = new Set(currentPatients.map(p => p.id));
    const firestorePatients = await adminDb.collection('patients').get();
    for (const doc of firestorePatients.docs) {
      if (!localPatientIds.has(doc.id)) {
        await doc.ref.delete();
        console.log(`Deleted orphaned patient document ${doc.id} from Firestore`);
      }
    }
    
    // 2. Sync Appointments
    const currentAppointments = db.appointments || [];
    for (const appt of currentAppointments) {
      await adminDb.collection('appointments').doc(appt.id).set(appt);
    }
    const localApptIds = new Set(currentAppointments.map(a => a.id));
    const firestoreAppts = await adminDb.collection('appointments').get();
    for (const doc of firestoreAppts.docs) {
      if (!localApptIds.has(doc.id)) {
        await doc.ref.delete();
        console.log(`Deleted orphaned appointment document ${doc.id} from Firestore`);
      }
    }
    
    // 3. Sync Notifications
    const currentNotifs = db.notifications || [];
    for (const notif of currentNotifs) {
      await adminDb.collection('notifications').doc(notif.id).set(notif);
    }
    const localNotifIds = new Set(currentNotifs.map(n => n.id));
    const firestoreNotifs = await adminDb.collection('notifications').get();
    for (const doc of firestoreNotifs.docs) {
      if (!localNotifIds.has(doc.id)) {
        await doc.ref.delete();
        console.log(`Deleted orphaned notification document ${doc.id} from Firestore`);
      }
    }
    
    // 4. Sync Reports
    const currentReports = db.reports || [];
    for (const rep of currentReports) {
      await adminDb.collection('reports').doc(rep.id).set(rep);
    }
    const localReportIds = new Set(currentReports.map(r => r.id));
    const firestoreReports = await adminDb.collection('reports').get();
    for (const doc of firestoreReports.docs) {
      if (!localReportIds.has(doc.id)) {
        await doc.ref.delete();
        console.log(`Deleted orphaned report document ${doc.id} from Firestore`);
      }
    }

    // Sync Payments
    const currentPayments = db.payments || [];
    for (const pay of currentPayments) {
      await adminDb.collection('payments').doc(pay.paymentId).set(pay);
    }
    const localPaymentIds = new Set(currentPayments.map(p => p.paymentId));
    const firestorePayments = await adminDb.collection('payments').get();
    for (const doc of firestorePayments.docs) {
      if (!localPaymentIds.has(doc.id)) {
        await doc.ref.delete();
        console.log(`Deleted orphaned payment document ${doc.id} from Firestore`);
      }
    }

    // 5. Sync Scheduling Config
    if (db.schedulingConfig) {
      await adminDb.collection('cms').doc('schedulingConfig').set(db.schedulingConfig);
    }
    
    // 6. Sync Admin Password
    if (db.adminPasswordHash) {
      await adminDb.collection('cms').doc('adminAuth').set({ passwordHash: db.adminPasswordHash });
    }
    
    console.log('Background sync to Firestore succeeded.');
  } catch (err) {
    const isPermissionError = err instanceof Error && err.message.includes('PERMISSION_DENIED');
    if (isPermissionError) {
      console.log('Background cloud database synchronization is currently running in local offline mode.');
    } else {
      console.log('Background sync to Firestore was skipped:', err instanceof Error ? err.message : String(err));
    }
  }
}

// Server Startup Firestore Loader and Seeder
export async function initializeAndSyncFirestore() {
  if (!adminDb) {
    console.warn('Firestore database is not initialized. Skipping cloud sync.');
    return;
  }

  try {
    console.log('Synchronizing Firestore database...');

    // 1. Check if the "cms" collection has been seeded
    const settingsDoc = await adminDb.collection('cms').doc('settings').get();
    if (!settingsDoc.exists) {
      console.log('Firestore CMS is empty. Seeding CMS from default clinical data...');
      
      // Load local data structures from default data
      // To bypass ES Module loading issues, define default structures
      const { healthPackages, routineTests, radiologyServices, locations, testimonials, faqItems } = await import('./src/data');
      
      const DEFAULT_SETTINGS = {
        logoText: 'AMENSA',
        brandColor: 'blue',
        contactPhone: '+91 70393 94488',
        whatsappNumber: '+91 70393 94488',
        email: 'amensadiagnostics@gmail.com',
        operatingHours: 'Mon-Sun: 8:00 AM - 9:00 PM',
        googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3768.4237731773094!2d72.95107577583689!3d19.176718449100806!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b9015bcbc3d1%3A0xe21ba681b95b871!2sSarojini%20Naidu%20Rd%2C%20Tambe%20Nagar%2C%20Mulund%20West%2C%20Mumbai%2C%20Maharashtra%20400080!5e0!3m2!1sen!2sin!4v1719395232810!5m2!1sen!2sin',
        facebookUrl: 'https://facebook.com/amensadiagnostics',
        twitterUrl: 'https://twitter.com/amensalabs',
        instagramUrl: 'https://instagram.com/amensadiagnostics',
        seoTitle: 'Amensa Diagnostics - NABL Certified Lab in Mulund, Mumbai',
        seoDescription: 'Accurate pathology reports, home sample collection within 60 minutes, and premium diagnostics at affordable prices in Mulund and Thane.',
        heroTitle: 'Accurate Diagnostics. Trusted Healthcare. Delivered To Your Door.',
        heroSubtitle: "Amensa Diagnostics is Mumbai's premier clinical network, bringing state-of-the-art pathology, imaging, and 60-minute doorstep sample collection together with automated digital accuracy.",
        heroBadge: 'A Chain of NABL & ISO 9001 Certified Labs',
        aboutTitle: 'About Amensa Diagnostics',
        aboutDescription: 'Amensa Diagnostics represents the cutting edge of clinical lab test accuracy in Mumbai. Established with a single-minded vision to make elite diagnostics affordable and transparent, we serve thousands of families across Mulund, Thane, and Dombivli with double-blind verified pathology, digital radiology, and painless home pick-ups.',
        aboutStats: [
          { label: 'Accurate Reports Delivered', value: '50K+' },
          { label: 'NABL Accredited Labs', value: '100%' },
          { label: 'Certified Phlebotomists', value: '25+' },
          { label: 'Verified 5-Star Reviews', value: '4.9/5' }
        ]
      };

      await adminDb.collection('cms').doc('settings').set(DEFAULT_SETTINGS);
      await adminDb.collection('cms').doc('packages').set({ list: healthPackages });
      await adminDb.collection('cms').doc('tests').set({ list: routineTests });
      await adminDb.collection('cms').doc('radiology').set({ list: radiologyServices });
      await adminDb.collection('cms').doc('locations').set({ list: locations });
      await adminDb.collection('cms').doc('testimonials').set({ list: testimonials });
      await adminDb.collection('cms').doc('faqs').set({ list: faqItems });
      await adminDb.collection('cms').doc('gallery').set({ list: [] });
      await adminDb.collection('cms').doc('enquiries').set({ list: [] });

      console.log('Firestore CMS seeding completed successfully!');
    } else {
      // Force sync locations so any manual modifications to locations in src/data.ts are immediately updated in Firestore on reload
      const { locations } = await import('./src/data');
      await adminDb.collection('cms').doc('locations').set({ list: locations });
      console.log('Firestore locations synchronized with updated source definitions!');
    }

    // 2. Load other collections from Firestore or seed them if Firestore is empty
    const localDB = getDB();

    // Sync Patients
    const patientsSnapshot = await adminDb.collection('patients').get();
    if (!patientsSnapshot.empty) {
      const dbPatients: any[] = [];
      patientsSnapshot.forEach(doc => {
        dbPatients.push(doc.data());
      });
      localDB.patients = dbPatients;
      console.log(`Loaded ${dbPatients.length} patients from Firestore`);
    } else if (localDB.patients && localDB.patients.length > 0) {
      console.log(`Firestore patients collection is empty. Seeding with ${localDB.patients.length} local patients...`);
      for (const p of localDB.patients) {
        await adminDb.collection('patients').doc(p.id).set(p);
      }
    }

    // Sync Appointments
    const appointmentsSnapshot = await adminDb.collection('appointments').get();
    if (!appointmentsSnapshot.empty) {
      const dbAppts: any[] = [];
      appointmentsSnapshot.forEach(doc => {
        dbAppts.push(doc.data());
      });
      localDB.appointments = dbAppts;
      console.log(`Loaded ${dbAppts.length} appointments from Firestore`);
    } else if (localDB.appointments && localDB.appointments.length > 0) {
      console.log(`Firestore appointments collection is empty. Seeding with ${localDB.appointments.length} local appointments...`);
      for (const a of localDB.appointments) {
        await adminDb.collection('appointments').doc(a.id).set(a);
      }
    }

    // Sync Notifications
    const notificationsSnapshot = await adminDb.collection('notifications').get();
    if (!notificationsSnapshot.empty) {
      const dbNotifs: any[] = [];
      notificationsSnapshot.forEach(doc => {
        dbNotifs.push(doc.data());
      });
      localDB.notifications = dbNotifs;
      console.log(`Loaded ${dbNotifs.length} notifications from Firestore`);
    } else if (localDB.notifications && localDB.notifications.length > 0) {
      console.log(`Firestore notifications collection is empty. Seeding with ${localDB.notifications.length} local notifications...`);
      for (const n of localDB.notifications) {
        await adminDb.collection('notifications').doc(n.id).set(n);
      }
    }

    // Sync Reports
    const reportsSnapshot = await adminDb.collection('reports').get();
    if (!reportsSnapshot.empty) {
      const dbReports: any[] = [];
      reportsSnapshot.forEach(doc => {
        dbReports.push(doc.data());
      });
      localDB.reports = dbReports;
      console.log(`Loaded ${dbReports.length} reports from Firestore`);
    } else if (localDB.reports && localDB.reports.length > 0) {
      console.log(`Firestore reports collection is empty. Seeding with ${localDB.reports.length} local reports...`);
      for (const r of localDB.reports) {
        await adminDb.collection('reports').doc(r.id).set(r);
      }
    }

    // Sync Payments
    const paymentsSnapshot = await adminDb.collection('payments').get();
    if (!paymentsSnapshot.empty) {
      const dbPayments: any[] = [];
      paymentsSnapshot.forEach(doc => {
        dbPayments.push(doc.data());
      });
      localDB.payments = dbPayments;
      console.log(`Loaded ${dbPayments.length} payments from Firestore`);
    } else if (localDB.payments && localDB.payments.length > 0) {
      console.log(`Firestore payments collection is empty. Seeding with ${localDB.payments.length} local payments...`);
      for (const p of localDB.payments) {
        await adminDb.collection('payments').doc(p.paymentId).set(p);
      }
    }

    // Sync Scheduling Config
    const schedDoc = await adminDb.collection('cms').doc('schedulingConfig').get();
    if (schedDoc.exists) {
      localDB.schedulingConfig = schedDoc.data() as SchedulingConfig;
      console.log('Loaded scheduling config from Firestore');
    } else if (localDB.schedulingConfig) {
      await adminDb.collection('cms').doc('schedulingConfig').set(localDB.schedulingConfig);
    }

    // Sync Admin Password Hash
    const authDoc = await adminDb.collection('cms').doc('adminAuth').get();
    if (authDoc.exists) {
      const authData = authDoc.data();
      if (authData && authData.passwordHash) {
        localDB.adminPasswordHash = authData.passwordHash;
        console.log('Loaded admin auth credentials from Firestore');
      }
    } else if (localDB.adminPasswordHash) {
      await adminDb.collection('cms').doc('adminAuth').set({ passwordHash: localDB.adminPasswordHash });
    }

    // Save final synchronized/merged state to local DB file
    fs.writeFileSync(DB_FILE, JSON.stringify(localDB, null, 2), 'utf-8');
    console.log('Firestore synchronization completed successfully!');

  } catch (err) {
    const isPermissionError = err instanceof Error && err.message.includes('PERMISSION_DENIED');
    if (isPermissionError) {
      console.log('Firestore cloud database synchronization is currently running in local offline mode.');
    } else {
      console.log('Firestore database initialization sync skipped:', err instanceof Error ? err.message : String(err));
    }
    console.log('The application is running in local-fallback mode using local JSON database storage (db.json).');
  }
}
