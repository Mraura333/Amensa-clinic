import { supabase } from './supabaseService';
import { Payment } from '../types';
import { bookingService } from './bookingService';

/**
 * Maps Supabase snake_case rows to camelCase Payment typescript interfaces
 */
function mapRelationalToPayment(row: any): Payment {
  return {
    paymentId: row.payment_id,
    bookingId: row.booking_id,
    patientName: row.patient_name || '',
    patientPhone: row.patient_phone || '',
    patientEmail: row.patient_email || '',
    serviceName: row.service_name || '',
    serviceCategory: row.service_category || '',
    packageName: row.package_name || '',
    amount: Number(row.amount) || 0,
    paymentMethod: row.payment_method || 'UPI QR',
    paymentStatus: row.payment_status || 'Pending',
    transactionId: row.transaction_id || '',
    paymentScreenshotURL: row.payment_screenshot_url || '',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
    verifiedBy: row.verified_by || '',
    verificationStatus: row.verification_status || 'Pending',
    notes: row.notes || ''
  };
}

export const paymentService = {
  /**
   * Upload payment screenshot image directly to Supabase Storage
   */
  uploadScreenshot: async (file: File): Promise<string> => {
    try {
      const bucketName = 'payment-screenshots';
      
      // Proactively try to create the bucket in case it doesn't exist
      try {
        await supabase.storage.createBucket(bucketName, {
          public: true
        });
      } catch (err) {
        // Safe to ignore if bucket already exists or permissions restrict it
      }

      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `pay_${Math.floor(100000 + Math.random() * 900000)}_${Date.now()}.${fileExt}`;
      const filePath = `screenshots/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file to Supabase Storage:', error);
      throw error;
    }
  },

  /**
   * Save a completed payment record inside Supabase database
   */
  createPayment: async (paymentData: Omit<Payment, 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const timestamp = new Date().toISOString();
      
      const relationalData = {
        payment_id: paymentData.paymentId,
        booking_id: paymentData.bookingId,
        patient_name: paymentData.patientName,
        patient_phone: paymentData.patientPhone,
        patient_email: paymentData.patientEmail || '',
        service_name: paymentData.serviceName,
        service_category: paymentData.serviceCategory,
        package_name: paymentData.packageName || '',
        amount: Number(paymentData.amount) || 0,
        payment_method: paymentData.paymentMethod || 'UPI QR',
        payment_status: paymentData.paymentStatus || 'Pending',
        transaction_id: paymentData.transactionId || '',
        payment_screenshot_url: paymentData.paymentScreenshotURL || '',
        created_at: timestamp,
        updated_at: timestamp,
        verification_status: paymentData.verificationStatus || 'Pending',
        notes: paymentData.notes || '',
        verified_by: paymentData.verifiedBy || ''
      };

      const { error } = await supabase
        .from('payments')
        .insert([relationalData]);

      if (error) {
        throw error;
      }

      // Automatically update the associated booking status if payment is complete
      if (paymentData.paymentStatus === 'Paid' || paymentData.paymentStatus === 'Verified') {
        const bookingStatus = paymentData.paymentStatus === 'Verified' ? 'Confirmed' : 'Paid';
        await bookingService.updateBookingStatus(paymentData.bookingId, bookingStatus).catch(err => {
          console.warn('Booking status sync omitted/deferred:', err);
        });
      }

      return paymentData.paymentId;
    } catch (error) {
      console.error('Error creating payment in Supabase:', error);
      throw error;
    }
  },

  /**
   * Listen to real-time payments table updates from Supabase
   */
  subscribePayments: (callback: (payments: Payment[]) => void) => {
    const fetchPayments = async () => {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          callback(data.map(mapRelationalToPayment));
        }
      } catch (err) {
        console.error('Error fetching payments from Supabase:', err);
      }
    };

    fetchPayments();

    // Subscribe to real-time database subscription channel
    const channel = supabase
      .channel('realtime-payments-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          console.log('[Supabase Realtime] Change detected in payments table.');
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Verify, Reject or Update a Payment
   */
  verifyPayment: async (
    paymentId: string, 
    bookingId: string, 
    status: 'Approved' | 'Rejected', 
    verifiedBy: string,
    notes?: string
  ): Promise<void> => {
    try {
      const timestamp = new Date().toISOString();
      const dbStatus = status === 'Approved' ? 'Verified' : 'Rejected';

      const { error } = await supabase
        .from('payments')
        .update({
          verification_status: status,
          verified_by: verifiedBy,
          payment_status: dbStatus,
          updated_at: timestamp,
          notes: notes || ''
        })
        .eq('payment_id', paymentId);

      if (error) {
        throw error;
      }

      // Update booking status accordingly
      const bookingStatus = status === 'Approved' ? 'Confirmed' : 'Pending';
      await bookingService.updateBookingStatus(bookingId, bookingStatus).catch(err => {
        console.warn('Booking status sync failed during payment verification:', err);
      });
    } catch (error) {
      console.error('Error verifying/updating payment in Supabase:', error);
      throw error;
    }
  },

  /**
   * Delete a payment record
   */
  deletePayment: async (paymentId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('payment_id', paymentId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting payment in Supabase:', error);
      throw error;
    }
  },

  /**
   * Exports an array of payments to a downloadable CSV file
   */
  downloadPaymentsCSV: (payments: Payment[]) => {
    const headers = [
      'Payment ID',
      'Booking ID',
      'Patient Name',
      'Patient Phone',
      'Patient Email',
      'Service Name',
      'Category',
      'Amount',
      'Method',
      'Payment Status',
      'Transaction ID',
      'Verification Status',
      'Verified By',
      'Created At',
      'Notes'
    ];

    const rows = payments.map(payment => [
      payment.paymentId,
      payment.bookingId,
      `"${payment.patientName.replace(/"/g, '""')}"`,
      payment.patientPhone,
      payment.patientEmail,
      `"${payment.serviceName.replace(/"/g, '""')}"`,
      payment.serviceCategory,
      payment.amount,
      payment.paymentMethod,
      payment.paymentStatus,
      payment.transactionId,
      payment.verificationStatus,
      payment.verifiedBy || '',
      payment.createdAt,
      `"${(payment.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Amensa_Payments_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
