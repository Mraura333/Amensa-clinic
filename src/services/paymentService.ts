import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { Payment } from '../types';
import { bookingService } from './bookingService';

export const paymentService = {
  /**
   * Save a completed payment record inside Firestore
   */
  createPayment: async (paymentData: Omit<Payment, 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const timestamp = new Date().toISOString();
      const newPayment: Payment = {
        ...paymentData,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      // Save in the 'payments' collection
      await setDoc(doc(db, 'payments', paymentData.paymentId), newPayment);
      
      // Automatically update the associated booking status if payment is complete
      if (paymentData.paymentStatus === 'Paid' || paymentData.paymentStatus === 'Verified') {
        const bookingStatus = paymentData.paymentStatus === 'Verified' ? 'Confirmed' : 'Paid';
        await bookingService.updateBookingStatus(paymentData.bookingId, bookingStatus).catch(err => {
          console.warn('Booking status sync omitted/deferred:', err);
        });
      }
      
      return paymentData.paymentId;
    } catch (error) {
      console.error('Error creating payment in Firestore:', error);
      throw error;
    }
  },

  /**
   * Listen to real-time payments collection
   */
  subscribePayments: (callback: (payments: Payment[]) => void) => {
    const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const payments: Payment[] = [];
      snapshot.forEach((doc) => {
        payments.push(doc.data() as Payment);
      });
      callback(payments);
    }, (error) => {
      console.error('Error listening to real-time payments:', error);
    });
  },

  /**
   * Verify or Reject a Payment
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
      const docRef = doc(db, 'payments', paymentId);
      
      const paymentUpdate: Partial<Payment> = {
        verificationStatus: status,
        verifiedBy,
        paymentStatus: status === 'Approved' ? 'Verified' : 'Failed',
        updatedAt: timestamp,
        notes: notes || ''
      };
      
      await updateDoc(docRef, paymentUpdate);
      
      // Update booking status accordingly
      const bookingStatus = status === 'Approved' ? 'Confirmed' : 'Pending';
      await bookingService.updateBookingStatus(bookingId, bookingStatus).catch(err => {
        console.warn('Booking status sync failed during payment verification:', err);
      });
    } catch (error) {
      console.error('Error verifying/updating payment:', error);
      throw error;
    }
  },

  /**
   * Delete a payment record
   */
  deletePayment: async (paymentId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'payments', paymentId));
    } catch (error) {
      console.error('Error deleting payment:', error);
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
