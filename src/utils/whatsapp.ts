/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WhatsAppBookingDetails {
  patientName?: string;
  age?: string;
  gender?: string;
  phone?: string;
  serviceName?: string;
  branch?: string;
  date?: string;
  time?: string;
  collectionType?: string; // 'Home Collection' or 'Walk-in'
  notes?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  city?: string;
  pincode?: string;
  address?: string;
}

export function getWhatsAppBookingUrl(
  serviceName: string = '',
  details?: WhatsAppBookingDetails
): string {
  const name = details?.patientName || '';
  const age = details?.age || '';
  const gender = details?.gender || '';
  const phone = details?.phone || '';
  const date = details?.date || '';
  const time = details?.time || '';
  const collectionType = details?.collectionType || 'Home Collection';
  const isHomeCollection = collectionType === 'Home Collection';

  let addressPart = '';
  if (isHomeCollection) {
    if (details?.address) {
      addressPart = `\n📍 Address: ${details.address}`;
    } else {
      addressPart = `\n\n📍 Address:
Building/House No.: ${details?.addressLine1 || ''}
Street/Area: ${details?.addressLine2 || ''}
Landmark: ${details?.landmark || ''}
City: ${details?.city || ''}
PIN Code: ${details?.pincode || ''}`;
    }
  }

  const message = `Hello Amensa Diagnostics,

I would like to book an appointment.

**Patient Details**
👤 Name: ${name}
🎂 Age: ${age}
⚧ Gender: ${gender}
📞 Phone Number: ${phone}

🧪 Selected Tests/Packages: ${serviceName || details?.serviceName || ''}

🏠 Collection Type: ${collectionType}${addressPart}

📅 Preferred Date: ${date}
🕒 Preferred Time: ${time}${details?.notes ? `\n\n📝 Additional Notes: ${details.notes}` : ''}

Please confirm my appointment. Thank you.`;

  return `https://wa.me/917039394488?text=${encodeURIComponent(message)}`;
}

export function getWhatsAppPrescriptionUrl(
  type: 'Radiology' | 'Blood Test',
  details?: {
    patientName?: string;
    patientPhone?: string;
    testName?: string;
    preferredDate?: string;
  }
): string {
  const name = details?.patientName || '';
  const phone = details?.patientPhone || '';
  const testName = details?.testName || '';
  const date = details?.preferredDate || '';

  const message = `Hello, I would like to book a ${type} appointment.

Name: ${name}
Mobile Number: ${phone}
Preferred Test: ${testName}
Preferred Date: ${date}

I have attached my doctor's prescription.`;

  return `https://wa.me/917039394488?text=${encodeURIComponent(message)}`;
}
