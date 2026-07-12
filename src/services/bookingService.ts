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
import { Booking } from '../types';

export const bookingService = {
  /**
   * Save a booking record inside Firestore
   */
  createBooking: async (bookingData: Omit<Booking, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const bookingId = `AMS-B${Math.floor(100000 + Math.random() * 900000)}`;
      const newBooking: Booking = {
        ...bookingData,
        id: bookingId,
        createdAt: new Date().toISOString()
      };
      
      // Save in the 'bookings' collection
      await setDoc(doc(db, 'bookings', bookingId), newBooking);
      
      // Also write to appointments for server compatibility
      await setDoc(doc(db, 'appointments', bookingId), newBooking);
      
      return bookingId;
    } catch (error) {
      console.error('Error creating booking in Firestore:', error);
      throw error;
    }
  },

  /**
   * Get a single booking details
   */
  getBooking: async (bookingId: string): Promise<Booking | null> => {
    try {
      const docRef = doc(db, 'bookings', bookingId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as Booking;
      }
      return null;
    } catch (error) {
      console.error('Error fetching booking from Firestore:', error);
      throw error;
    }
  },

  /**
   * Update booking status
   */
  updateBookingStatus: async (bookingId: string, status: Booking['status']): Promise<void> => {
    try {
      const docRef = doc(db, 'bookings', bookingId);
      const appRef = doc(db, 'appointments', bookingId);
      
      await updateDoc(docRef, { status });
      await updateDoc(appRef, { status }).catch(() => {
        // Safe check if appointments sync is bypassed
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  },

  /**
   * Get bookings for a specific patient phone/mobile in real-time
   */
  subscribePatientBookings: (mobile: string, callback: (bookings: Booking[]) => void) => {
    const q = query(
      collection(db, 'bookings'),
      where('mobile', '==', mobile),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const bookings: Booking[] = [];
      snapshot.forEach((doc) => {
        bookings.push(doc.data() as Booking);
      });
      callback(bookings);
    }, (error) => {
      console.error('Error listening to patient bookings:', error);
    });
  },

  /**
   * Get all bookings in real-time for administrators
   */
  subscribeAllBookings: (callback: (bookings: Booking[]) => void) => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const bookings: Booking[] = [];
      snapshot.forEach((doc) => {
        bookings.push(doc.data() as Booking);
      });
      callback(bookings);
    }, (error) => {
      console.error('Error listening to all bookings:', error);
    });
  },

  /**
   * Update a booking completely (e.g. date, timeslot, details)
   */
  updateBooking: async (bookingId: string, updateData: Partial<Booking>): Promise<void> => {
    try {
      const docRef = doc(db, 'bookings', bookingId);
      await updateDoc(docRef, updateData);
      
      const appRef = doc(db, 'appointments', bookingId);
      await updateDoc(appRef, updateData).catch(() => {});
    } catch (error) {
      console.error('Error editing booking:', error);
      throw error;
    }
  },

  /**
   * Delete a booking from Firestore
   */
  deleteBooking: async (bookingId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'bookings', bookingId));
      await deleteDoc(doc(db, 'appointments', bookingId)).catch(() => {});
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  }
};
