/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Test {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  specimen: string;
  reportTime: string;
  description: string;
}

export interface HealthPackage {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: string;
  isPopular: boolean;
  category: string;
  testsCount: number;
  testsList: string[];
  description: string;
  isExpanded?: boolean;
}

export interface RadiologyService {
  id: string;
  name: string;
  description: string;
  price: number;
  bmcPrice: number; // BMC / Corporate Partner discount price
  specifications: string[];
}

export interface ServiceArea {
  name: string;
  description: string;
  zipcodes: string[];
  phlebotomists: number;
  averageTimeMinutes: number;
}

export interface LocationCard {
  id: string;
  name: string;
  address: string;
  workingHours: string;
  phone: string;
  whatsapp: string;
  email: string;
  googleMapsUrl: string;
  facilities: string[];
  badge?: string;
  region?: 'Mumbai' | 'Thane' | string;
  order?: number;
}

export interface Booking {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  mobile: string;
  selectedItemType: 'Package' | 'RoutineTest' | 'Radiology';
  selectedItemId: string;
  selectedItemName: string;
  bookingType: 'HomeCollection' | 'CenterVisit';
  preferredDate: string;
  preferredTimeSlot: string;
  address?: string;
  locationId?: string;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Paid';
  createdAt: string;
  pricePaid: number;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  review: string;
  testTaken: string;
  avatarUrl?: string;
  reviewUrl?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
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

