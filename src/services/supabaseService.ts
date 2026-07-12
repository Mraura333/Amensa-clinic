import { createClient } from '@supabase/supabase-js';
import { DatabaseSchema, Patient, Appointment } from '../../server-db';
import { Payment } from '../types';

// Supabase Credentials (using the actual values provided by the user with standard environment overrides)
const DEFAULT_SUPABASE_URL = 'https://xxpmsqiojwjznpzprdha.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_jxE_sHQGxofL9NAcOnLzWA_uY545Iuv';

function getValidUrl(url: any, fallback: string): string {
  if (typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (trimmed.match(/^https?:\/\//i)) {
    return trimmed;
  }
  return fallback;
}

function getValidKey(key: any, fallback: string): string {
  if (typeof key !== 'string') return fallback;
  const trimmed = key.trim();
  if (trimmed && trimmed !== 'undefined' && trimmed !== 'null' && !trimmed.includes('your-')) {
    return trimmed;
  }
  return fallback;
}

// Extract URL from environment options (Node's process.env or Vite's import.meta.env)
const rawUrl = 
  (typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL) ||
  // @ts-ignore
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  DEFAULT_SUPABASE_URL;

const rawKey = 
  (typeof process !== 'undefined' && process.env && process.env.SUPABASE_KEY) ||
  // @ts-ignore
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_KEY) ||
  DEFAULT_SUPABASE_KEY;

const SUPABASE_URL = getValidUrl(rawUrl, DEFAULT_SUPABASE_URL);
const SUPABASE_KEY = getValidKey(rawKey, DEFAULT_SUPABASE_KEY);

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export interface SupabaseSyncStats {
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncTime: string | null;
  error: string | null;
  patientsCount: number;
  paymentsCount: number;
  appointmentsCount: number;
}

// Global in-memory sync metrics for the control dashboard
export let syncStats: SupabaseSyncStats = {
  status: 'idle',
  lastSyncTime: null,
  error: null,
  patientsCount: 0,
  paymentsCount: 0,
  appointmentsCount: 0
};

/**
 * Maps a camelCase Patient object to relational snake_case format for Supabase insertion
 */
function mapPatientToRelational(patient: Patient) {
  return {
    id: patient.id,
    full_name: patient.fullName || '',
    email: patient.email || '',
    mobile: patient.mobile || '',
    password_hash: patient.passwordHash || '',
    dob: patient.dob || '',
    gender: patient.gender || '',
    address: patient.address || '',
    profile_image: patient.profileImage || '',
    status: patient.status || 'active',
    created_at: patient.createdAt || new Date().toISOString(),
    updated_at: patient.updatedAt || new Date().toISOString()
  };
}

/**
 * Maps a camelCase Payment object to relational snake_case format for Supabase insertion
 */
function mapPaymentToRelational(payment: Payment) {
  return {
    payment_id: payment.paymentId,
    booking_id: payment.bookingId,
    patient_name: payment.patientName || '',
    patient_phone: payment.patientPhone || '',
    patient_email: payment.patientEmail || '',
    service_name: payment.serviceName || '',
    service_category: payment.serviceCategory || '',
    package_name: payment.packageName || '',
    amount: Number(payment.amount) || 0,
    payment_method: payment.paymentMethod || 'UPI',
    payment_status: payment.paymentStatus || 'Pending',
    transaction_id: payment.transactionId || '',
    payment_screenshot_url: payment.paymentScreenshotURL || '',
    created_at: payment.createdAt || new Date().toISOString(),
    updated_at: payment.updatedAt || new Date().toISOString(),
    verified_by: payment.verifiedBy || '',
    verification_status: payment.verificationStatus || 'Pending',
    notes: payment.notes || ''
  };
}

/**
 * Maps a camelCase Appointment object to relational snake_case format for Supabase insertion
 */
function mapAppointmentToRelational(appt: Appointment) {
  return {
    id: appt.id,
    patient_id: appt.patientId || '',
    patient_name: appt.patientName || '',
    patient_age: Number(appt.patientAge) || 30,
    patient_gender: appt.patientGender || 'Other',
    mobile: appt.mobile || '',
    email: appt.email || '',
    selected_item_type: appt.selectedItemType || 'Package',
    selected_item_id: appt.selectedItemId || '',
    selected_item_name: appt.selectedItemName || '',
    booking_type: appt.bookingType || 'CenterVisit',
    preferred_date: appt.preferredDate || '',
    preferred_time_slot: appt.preferredTimeSlot || '',
    address: appt.address || '',
    location_id: appt.locationId || '',
    price_paid: Number(appt.pricePaid) || 0,
    status: appt.status || 'Pending',
    notes: appt.notes || '',
    created_at: appt.createdAt || new Date().toISOString(),
    updated_at: appt.updatedAt || new Date().toISOString()
  };
}

/**
 * Perform asynchronous synchronization to Supabase PostgreSQL database tables
 */
export async function syncToSupabase(db: DatabaseSchema): Promise<void> {
  // Guard clause for invalid or placeholder credentials
  if (!SUPABASE_URL || SUPABASE_URL.includes('your-') || !SUPABASE_KEY || SUPABASE_KEY.includes('your-')) {
    console.warn('[Supabase Sync] Credentials omitted or invalid. Bypassing sync.');
    return;
  }

  syncStats.status = 'syncing';
  syncStats.error = null;

  try {
    console.log('[Supabase Sync] Syncing database structures to Supabase relational nodes...');

    // 1. Sync Patients Table
    const patientsToSync = (db.patients || []).map(mapPatientToRelational);
    if (patientsToSync.length > 0) {
      const { error: patientErr } = await supabase
        .from('patients')
        .upsert(patientsToSync, { onConflict: 'id' });
      
      if (patientErr) {
        throw new Error(`Patients Sync Failure: ${patientErr.message}`);
      }
    }

    // 2. Sync Payments Table
    const paymentsToSync = (db.payments || []).map(mapPaymentToRelational);
    if (paymentsToSync.length > 0) {
      const { error: paymentErr } = await supabase
        .from('payments')
        .upsert(paymentsToSync, { onConflict: 'payment_id' });
      
      if (paymentErr) {
        throw new Error(`Payments Sync Failure: ${paymentErr.message}`);
      }
    }

    // 3. Sync Appointments Table
    const appointmentsToSync = (db.appointments || []).map(mapAppointmentToRelational);
    if (appointmentsToSync.length > 0) {
      const { error: apptErr } = await supabase
        .from('appointments')
        .upsert(appointmentsToSync, { onConflict: 'id' });
      
      if (apptErr) {
        throw new Error(`Appointments Sync Failure: ${apptErr.message}`);
      }
    }

    // Success state update
    syncStats.status = 'success';
    syncStats.lastSyncTime = new Date().toISOString();
    syncStats.patientsCount = patientsToSync.length;
    syncStats.paymentsCount = paymentsToSync.length;
    syncStats.appointmentsCount = appointmentsToSync.length;
    console.log('[Supabase Sync] Synchronized successfully with Supabase!', {
      patients: patientsToSync.length,
      payments: paymentsToSync.length,
      appointments: appointmentsToSync.length
    });

  } catch (err: any) {
    console.error('[Supabase Sync] Error during Supabase synchronization:', err);
    syncStats.status = 'error';
    syncStats.error = err.message || 'Unknown network error';
  }
}
