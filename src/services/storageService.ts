import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const storageService = {
  /**
   * Uploads a file to a specific folder in Firebase Storage and returns the download URL
   * @param file The file object to upload
   * @param folder The target folder ('payment-screenshots' | 'prescriptions' | 'reports')
   * @returns Promise containing the download URL
   */
  uploadFile: async (file: File, folder: 'payment-screenshots' | 'prescriptions' | 'reports'): Promise<string> => {
    try {
      const timestamp = Date.now();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filePath = `${folder}/${timestamp}_${cleanFileName}`;
      const storageRef = ref(storage, filePath);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error(`Firebase Storage upload error for folder ${folder}:`, error);
      throw new Error(`Failed to upload file to ${folder}. Please try again.`);
    }
  }
};
