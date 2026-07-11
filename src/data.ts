/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HealthPackage, Test, RadiologyService, ServiceArea, LocationCard, Testimonial, FAQItem } from './types';
import { routineTests as importedRoutineTests } from './routineTestsData';

export const healthPackages: HealthPackage[] = [
  {
    id: 'pkg-arogya-e-pro',
    name: 'Arogya E – PRO',
    price: 8999,
    originalPrice: 25000,
    discount: 'Save 64%',
    isPopular: true,
    category: 'Elite Screening & Cancer Markers',
    testsCount: 120,
    testsList: [
      '2D Echocardiography / Cardiac Screening Scan',
      'High Sensitivity CRP (hs-CRP) Heart Risk assessment',
      'Apolipoprotein A1 (Apo-A1)',
      'Apolipoprotein B (Apo-B) & Apo B/A1 Ratio',
      'Homocysteine (Cardiovascular/Stroke Risk Marker)',
      'Lipid Profile (9 Parameters: Cholesterol, HDL, LDL, VLDL, Triglycerides, Ratios)',
      'Vitamin D3 (25-Hydroxy) Bone & Immunity Marker',
      'Vitamin B12 (Active Cobalamin Level)',
      'PSA (Prostate Specific Antigen) - For Men / CA-125 (Ovarian Cancer Marker) - For Women',
      'HbA1c (Glycated Hemoglobin) Glycemic Control Status',
      'Fasting Blood Sugar (FBS) & Post-Prandial Blood Sugar (PPBS)',
      'Thyroid Profile (3 Parameters: T3, T4, TSH) Metabolism Assessment',
      'Liver Function Test (LFT - 12 Parameters: Bilirubin, SGOT, SGPT, ALP, Proteins, Ratios)',
      'Kidney/Renal Function Test (RFT - 10 Parameters: Urea, BUN, Creatinine, Uric Acid, Electrolytes)',
      'Complete Blood Count (CBC - 24 Parameters of Cellular Immunity, RBC, WBC, Platelets)',
      'Urine Routine & Microscopic (15 Parameters: Protein, Glucose, Crystals, Epithelial Cells)'
    ],
    description: 'The ultimate diagnostic shield. Complete Cardiac, Advanced Screening & Cancer Markers. Includes heart health mapping, organ profiling, key vitamins, and gender-specific cancer screen.'
  },
  {
    id: 'pkg-arogya-e-plus',
    name: 'Arogya E – Plus',
    price: 6999,
    originalPrice: 15000,
    discount: 'Save 53%',
    isPopular: false,
    category: 'Comprehensive Full Body',
    testsCount: 112,
    testsList: [
      'Apolipoprotein A1 (Apo-A1)',
      'Apolipoprotein B (Apo-B) & Apo B/A1 Ratio',
      'Homocysteine (Cardiovascular/Stroke Risk Marker)',
      'Lipid Profile (9 Parameters: Cholesterol, HDL, LDL, VLDL, Triglycerides, Ratios)',
      'Vitamin D3 (25-Hydroxy) Bone & Immunity Marker',
      'Vitamin B12 (Active Cobalamin Level)',
      'HbA1c (Glycated Hemoglobin) Glycemic Control Status',
      'Fasting Blood Sugar (FBS)',
      'Thyroid Profile (3 Parameters: T3, T4, TSH) Metabolism Assessment',
      'Liver Function Test (LFT - 12 Parameters: Bilirubin, SGOT, SGPT, ALP, Proteins, Ratios)',
      'Kidney/Renal Function Test (RFT - 10 Parameters: Urea, BUN, Creatinine, Uric Acid, Electrolytes)',
      'Complete Blood Count (CBC - 24 Parameters of Cellular Immunity, RBC, WBC, Platelets)',
      'Urine Routine & Microscopic (15 Parameters: Protein, Glucose, Crystals, Epithelial Cells)'
    ],
    description: 'Comprehensive Full Body & Cardiac Screening focusing on premium cardiovascular screening, organ functions, key vitamins, and core metabolic indicators.'
  },
  {
    id: 'pkg-arogya-e-cardiac',
    name: 'Arogya E Cardiac Profile',
    price: 6000,
    originalPrice: 12000,
    discount: '1+1 Free',
    isPopular: false,
    category: 'Cardiac Specialty',
    testsCount: 42,
    testsList: [
      'Homocysteine (Cardiovascular/Stroke Risk Marker)',
      'High Sensitivity CRP (hs-CRP) Heart Risk assessment',
      'Apolipoprotein A1 (Apo-A1)',
      'Apolipoprotein B (Apo-B)',
      'Apo B/A1 Ratio',
      'Lipid Profile (9 Parameters: Cholesterol, HDL, LDL, VLDL, Triglycerides, Ratios)',
      'Serum Creatinine (Kidney Filtration)',
      'Blood Urea Nitrogen (BUN)',
      'Fasting Blood Sugar (FBS)',
      'Complete Blood Count (CBC - 24 Parameters of Cellular Immunity, RBC, WBC, Platelets)'
    ],
    description: '1+1 Free Limited Time Offer. Specialized heart-health profiling package under a limited-time 1+1 Free double benefit. Complete lipid, cardiac marker, and basic metabolic assessment for two people.'
  },
  {
    id: 'pkg-arogya-fit-g',
    name: 'ArogyaFit G',
    price: 3000,
    originalPrice: 6000,
    discount: '1+1 Free',
    isPopular: false,
    category: 'General Wellness',
    testsCount: 38,
    testsList: [
      'Lipid Profile (Cholesterol Panel: Total Cholesterol, Triglycerides, HDL, LDL, VLDL)',
      'Fasting Blood Sugar (FBS)',
      'Serum Creatinine (Kidney Function)',
      'Blood Urea',
      'SGPT (Liver enzyme)',
      'Total Bilirubin (Liver Screen)',
      'Complete Blood Count (CBC - 24 Parameters of Cellular Immunity, RBC, WBC, Platelets)',
      'Erythrocyte Sedimentation Rate (ESR)',
      'Thyroid Stimulating Hormone (TSH)'
    ],
    description: 'Double Benefit Offer – 1+1 Free. Our most popular budget-friendly general wellness package. Book for one, and get the exact same screen for another family member absolutely free!'
  },
  {
    id: 'pkg-arogya-a',
    name: 'Arogya (A)',
    price: 899,
    originalPrice: 2000,
    discount: 'Save 55%',
    isPopular: false,
    category: 'Arogya Base Packages',
    testsCount: 32,
    testsList: [
      'Complete Blood Count (CBC - 24 vital parameters)',
      'Fasting Blood Sugar (FBS)',
      'Serum Creatinine',
      'Blood Urea',
      'Total Cholesterol',
      'Urine Routine (5 Parameters)'
    ],
    description: 'Affordable entry-level preventive screen covering complete blood count, blood sugar, basic renal clearance, total cholesterol, and basic urine screen.'
  },
  {
    id: 'pkg-arogya-b',
    name: 'Arogya (B)',
    price: 999,
    originalPrice: 3000,
    discount: 'Save 67%',
    isPopular: false,
    category: 'Arogya Base Packages',
    testsCount: 58,
    testsList: [
      'Complete Blood Count (CBC - 24 vital parameters)',
      'Lipid Profile (9 Parameters: Cholesterol, HDL, LDL, VLDL, Triglycerides, Ratios)',
      'Kidney/Renal Panel (Serum Creatinine, Blood Urea, BUN, Uric Acid)',
      'Liver/LFT (8 Parameters: Bilirubin, SGOT, SGPT, Alkaline Phosphatase, Proteins)',
      'Fasting Blood Sugar (FBS)',
      'Urine Routine & Microscopic (12 Parameters)'
    ],
    description: 'Comprehensive essential screen adding lipid profile, renal panel, liver enzyme checks, fasting blood sugar, and microscopic urine routine.'
  },
  {
    id: 'pkg-arogya-c',
    name: 'Arogya (C)',
    price: 1999,
    originalPrice: 4500,
    discount: 'Save 55%',
    isPopular: false,
    category: 'Arogya Base Packages',
    testsCount: 72,
    testsList: [
      'Complete Blood Count (CBC - 24 vital parameters)',
      'Lipid Profile (9 Parameters: Cholesterol, HDL, LDL, VLDL, Triglycerides, Ratios)',
      'Liver Function Test (LFT - 12 Parameters: Bilirubin, SGOT, SGPT, ALP, Proteins, Ratios)',
      'Kidney Function Test (RFT - 10 Parameters: Urea, BUN, Creatinine, Uric Acid, Electrolytes)',
      'Thyroid Profile (3 Parameters: T3, T4, TSH) Metabolism Assessment',
      'Fasting Blood Sugar (FBS)',
      'Urine Routine & Microscopic (12 Parameters)'
    ],
    description: 'Thorough metabolic screen incorporating full Thyroid profile alongside comprehensive Liver (LFT) and Kidney (RFT) parameter blocks.'
  },
  {
    id: 'pkg-arogya-d',
    name: 'Arogya (D)',
    price: 2499,
    originalPrice: 5500,
    discount: 'Save 54%',
    isPopular: false,
    category: 'Arogya Base Packages',
    testsCount: 76,
    testsList: [
      'Complete Blood Count (CBC - 24 vital parameters)',
      'Lipid Profile (9 Parameters: Cholesterol, HDL, LDL, VLDL, Triglycerides, Ratios)',
      'Liver Function Test (LFT - 12 Parameters)',
      'Kidney Function Test (RFT - 10 Parameters)',
      'Thyroid Profile (3 Parameters: T3, T4, TSH)',
      'Vitamin D3 (25-Hydroxy) Bone & Immunity Marker',
      'Vitamin B12 (Active Cobalamin Level)',
      'HbA1c (Glycated Hemoglobin) Average Blood Sugar',
      'Fasting Blood Sugar (FBS)',
      'Urine Routine & Microscopic (12 Parameters)'
    ],
    description: 'Our top-tier base package, featuring complete blood, lipid, liver, kidney, and thyroid screens, boosted by key Vitamins (D3 & B12) and 3-month glycemic check (HbA1c).'
  },
  {
    id: 'pkg-womens-profile',
    name: 'Women\'s Profile',
    price: 2500,
    originalPrice: 5000,
    discount: 'Save 50%',
    isPopular: false,
    category: 'Specialty Screening',
    testsCount: 41,
    testsList: [
      'Thyroid Stimulating Hormone (TSH)',
      'Prolactin Hormone (Reproductive/Pituitary Screen)',
      'LH (Luteinizing Hormone) Ovulation/PCOS Marker',
      'FSH (Follicle-Stimulating Hormone)',
      'Serum Calcium',
      'Vitamin D3 (25-Hydroxy)',
      'Hemoglobin & RBC parameters (Anemia assessment)',
      'Serum Iron & Ferritin',
      'Total Iron Binding Capacity (TIBC)',
      'Complete Blood Count (CBC - 24 parameters)',
      'Fasting Blood Sugar (FBS)',
      'SGPT (Liver Screen)',
      'Serum Creatinine (Kidney Screen)'
    ],
    description: 'Premium specialty package designed exclusively for women\'s health. Focuses on hormonal balance, bone strength, iron reserves, and metabolic wellness. Free Doctor Consultation Included.'
  }
];

export const routineTests: Test[] = importedRoutineTests;

export const radiologyServices: RadiologyService[] = [
  {
    id: 'rad-sonography',
    name: 'Sonography (USG)',
    description: 'High-resolution abdominal, pelvic, and specialized organ soundwave imaging.',
    price: 2200,
    bmcPrice: 2200,
    specifications: [
      'Preferred Appointment Time: 10:30 AM Only',
      'Conducted strictly by certified MD Radiologist / Sonologist',
      'Prior appointment compulsory, walk-ins are not accepted'
    ]
  },
  {
    id: 'rad-xray',
    name: 'Digital X-Ray',
    description: 'Advanced high-frequency digital X-Ray imaging with low radiation exposure.',
    price: 800,
    bmcPrice: 500,
    specifications: [
      'Operating Hours: 9:00 AM – 7:00 PM',
      'Walk-ins Accepted (No prior booking required)',
      'High-resolution chest, bone, and joint scans with immediate reporting'
    ]
  },
  {
    id: 'rad-2decho',
    name: '2D Echo (Cardiology)',
    description: 'Detailed 2D Echocardiography and Doppler mapping to assess heart muscles, chambers, and valve functions.',
    price: 3000,
    bmcPrice: 2000,
    specifications: [
      'Operating Hours: 4:00 PM – 4:30 PM Only',
      'Conducted strictly by Senior Consulting Cardiologist',
      'Appointment is highly compulsory (limited daily slots)'
    ]
  },
  {
    id: 'rad-usg-abd-pel',
    name: 'USG (Abdomen & Pelvis / Pelvis / KUB)',
    description: 'Comprehensive high-resolution screening of the abdominal and pelvic cavity, or KUB.',
    price: 2200,
    bmcPrice: 2200,
    specifications: [
      'Evaluation of liver, kidneys, gallbladder, spleen, pancreas & bladder',
      'High-resolution non-invasive soundwave imaging',
      'Conducted by certified Sonologist / Radiologist'
    ]
  },
  {
    id: 'rad-small-parts-breast',
    name: 'Small Parts (Both Breast / Chest / Neck Thyroid)',
    description: 'Detailed high-frequency ultrasound evaluation of small part tissues, breast, chest wall, or thyroid gland.',
    price: 2500,
    bmcPrice: 1800,
    specifications: [
      'Evaluates nodules, cysts, and tissue abnormalities',
      'Advanced high-frequency linear transducers for superficial structures',
      'Includes accurate anatomical measurements and lymph node screening'
    ]
  },
  {
    id: 'rad-small-parts-scrotum',
    name: 'Small Parts (Scrotum)',
    description: 'Dedicated high-resolution scrotal and testicular ultrasound imaging for structural and vascular evaluation.',
    price: 2900,
    bmcPrice: 2500,
    specifications: [
      'Comprehensive assessment of testicular tissues, epididymis & scrotal sac',
      'Vascular flow mapping utilizing high-sensitivity Color Doppler',
      'Critical for pain, swelling, varicocele, or mass investigations'
    ]
  },
  {
    id: 'rad-follicle-study',
    name: 'Follicle Study (Per Day)',
    description: 'Serial ultrasound scans to monitor follicle growth, endometrial thickness, and ovulation timing.',
    price: 500,
    bmcPrice: 500,
    specifications: [
      'Precise tracking of dominant follicle diameter & development',
      'Essential for natural cycles or assisted reproductive technology (ART)',
      'Quick daily imaging slots with zero hassle'
    ]
  },
  {
    id: 'rad-obst-early-growth',
    name: 'OBST (Early / Growth Scan)',
    description: 'Crucial pregnancy ultrasound to determine early viability, gestational age, or third-trimester growth parameters.',
    price: 2300,
    bmcPrice: 1500,
    specifications: [
      'Monitors fetal weight, gestational age, amniotic fluid, and fetal movement',
      'Ensures accurate developmental milestone plotting on high-end systems',
      'Includes structural & fetal wellbeing parameters'
    ]
  },
  {
    id: 'rad-obst-growth-twin',
    name: 'OBST (Growth Scan Twin)',
    description: 'Comprehensive growth and wellbeing monitoring for twin pregnancies, evaluating inter-twin parameters.',
    price: 4600,
    bmcPrice: 3000,
    specifications: [
      'Individualized biometry, estimated fetal weight & amniotic fluid index',
      'Screens for growth discordance, twin-to-twin transfusion signs',
      'Conducted strictly by certified Fetal Medicine Specialists'
    ]
  },
  {
    id: 'rad-obst-nt-scan',
    name: 'OBST (NT Scan)',
    description: 'Specialized 11-13 week screening scan measuring nuchal translucency to evaluate risk of chromosomal anomalies.',
    price: 2900,
    bmcPrice: 2200,
    specifications: [
      'Precise measurement of fetal nuchal translucency and nasal bone',
      'Conducted strictly on advanced high-definition FMF-certified systems',
      'Vital early anatomy screening combined with maternal biochemistry indicators'
    ]
  },
  {
    id: 'rad-obst-nt-twin',
    name: 'OBST (NT Scan Twin)',
    description: 'Nuchal Translucency (NT) screening for twin pregnancies, ensuring dual structural assessment.',
    price: 5800,
    bmcPrice: 4800,
    specifications: [
      'Individual NT and nasal bone measurements for both fetuses',
      'Chorionicity determination and structural profiling of both twins',
      'Certified and double-verified reporting by senior consultants'
    ]
  },
  {
    id: 'rad-obst-anomaly-single',
    name: 'OBST (Anomaly Scan Single / OBST with Doppler)',
    description: 'Comprehensive Level II structural survey (18-22 weeks) or advanced third-trimester obstetric Doppler scan.',
    price: 3000,
    bmcPrice: 2400,
    specifications: [
      'Extensive head-to-toe organ structural and anatomical assessment',
      'Uterine, umbilical, and cerebral artery hemodynamic blood flow analysis',
      'Crucial for detecting congenital variations and evaluating fetal hypoxia risks'
    ]
  },
  {
    id: 'rad-obst-anomaly-twin',
    name: 'OBST (Anomaly Scan Twin)',
    description: 'Highly detailed Level II anatomy and structural scan for twin pregnancies.',
    price: 6000,
    bmcPrice: 4800,
    specifications: [
      'Full dual structural and organ assessment of both fetuses',
      'Comprehensive cardiac, cerebral, spinal and limb survey',
      'Conducted on ultra-premium 3D/4D clinical imaging platforms'
    ]
  },
  {
    id: 'rad-doppler-single',
    name: 'Doppler (Carotid / Renal / Lower Limb Venous/Arterial Single)',
    description: 'Advanced vascular Doppler mapping of a single region (carotid arteries, renal vessels, or single limb veins/arteries).',
    price: 3000,
    bmcPrice: 2400,
    specifications: [
      'Precise blood flow velocity and resistance index measurement',
      'Identifies plaque build-up, renal stenosis, or Deep Vein Thrombosis (DVT)',
      'High-definition color-flow mapping with detailed charts'
    ]
  },
  {
    id: 'rad-doppler-both',
    name: 'Doppler (Lower Limb Venous/Arterial Both)',
    description: 'Bilateral high-resolution vascular Doppler imaging of veins and arteries in both lower limbs.',
    price: 6000,
    bmcPrice: 4800,
    specifications: [
      'Comprehensive comparative blood flow profiling of both legs',
      'Screens for bilateral varicose veins, peripheral arterial disease, or DVT',
      'Conducted using industry-standard high-sensitivity linear probes'
    ]
  },
  {
    id: 'rad-msk-single',
    name: 'MSK (Shoulder / Knee / Elbow etc.)',
    description: 'High-frequency musculoskeletal ultrasound of a joint to assess ligaments, tendons, muscles, and fluid.',
    price: 2800,
    bmcPrice: 2200,
    specifications: [
      'Dynamic real-time evaluation of joint movement and tendon tracking',
      'Screens for rotator cuff tears, joint effusion, tendonitis, or sprains',
      'Non-invasive alternative or adjunct to joint MRI'
    ]
  }
];

export const serviceAreas: ServiceArea[] = [
  {
    name: 'Dombivli',
    description: 'Rapid dispatch collection network covers central and residential wings. Home Sample Collection within 30 minutes.',
    zipcodes: ['421201', '421202', '421204', '421203'],
    phlebotomists: 5,
    averageTimeMinutes: 30
  },
  {
    name: 'Thane',
    description: 'Largest coverage density with direct links to our Thane Elite laboratory.',
    zipcodes: ['400601', '400602', '400603', '400604', '400607', '400610'],
    phlebotomists: 8,
    averageTimeMinutes: 40
  },
  {
    name: 'Mulund',
    description: 'Premium home sample pickup service extending down to LBS Marg. Home Sample Collection within 30 minutes.',
    zipcodes: ['400080', '400081', '400082'],
    phlebotomists: 4,
    averageTimeMinutes: 30
  }
];

export const locations: LocationCard[] = [
  {
    id: 'loc-mulund-east-primary',
    name: 'Amensa Diagnostics – Primary Hub',
    address: 'Shop No. 4 & 5, Vijayalaxmi CHS, Gopal Krishna Gokhale Road, Opposite IDBI Bank, Hanuman Chowk, Mulund East, Mumbai – 400081',
    workingHours: '7:30 AM – 9:00 PM',
    phone: '7039394488',
    whatsapp: '8422007488',
    email: 'amensadiagnostics@gmail.com',
    googleMapsUrl: 'https://maps.google.com/?q=Shop+No.+4+%26+5,+Vijayalaxmi+CHS,+Gopal+Krishna+Gokhale+Road,+Opposite+IDBI+Bank,+Hanuman+Chowk,+Mulund+East,+Mumbai+–+400081',
    facilities: ['Primary Reference Hub', 'Pathology Collection Center', 'Fasting Blood Sugar Test', 'ECG Room'],
    badge: '⭐ PRIMARY HUB',
    region: 'Mumbai',
    order: 1
  },
  {
    id: 'loc-mulund-east-sono',
    name: 'Amensa Diagnostics – Sonography Center',
    address: 'Bima Chhaya CHS, MP Road, Mulund East, Mumbai – 400081',
    workingHours: '7:30 AM – 9:00 PM',
    phone: '7039394488',
    whatsapp: '8422007488',
    email: 'amensadiagnostics@gmail.com',
    googleMapsUrl: 'https://maps.google.com/?q=Bima+Chhaya+CHS,+MP+Road,+Mulund+East,+Mumbai+–+400081',
    facilities: ['Sonography Center', 'High-Resolution Ultrasound', 'Obstetric 3D/4D Scans', 'Color Doppler Imaging'],
    badge: '🩻 SONOGRAPHY CENTER',
    region: 'Mumbai',
    order: 2
  },
  {
    id: 'loc-mulund-west-coll',
    name: 'Amensa Diagnostics – Community Testing Collection Center',
    address: 'Shop No. 13, Sai Santosh CHS, Sarojini Naidu Road, Tambe Nagar, Siddharth Nagar, Mulund West, Mumbai – 400080',
    workingHours: '7:30 AM – 9:00 PM',
    phone: '7039394488',
    whatsapp: '8422007488',
    email: 'amensadiagnostics@gmail.com',
    googleMapsUrl: 'https://maps.google.com/?q=Shop+No.+13,+Sai+Santosh+CHS,+Sarojini+Naidu+Road,+Tambe+Nagar,+Siddharth+Nagar,+Mulund+West,+Mumbai+–+400080',
    facilities: ['Community Collection Center', 'Express Blood Draw', 'Certified Phlebotomists', 'Free Home Collection Desk'],
    badge: '🧪 COMMUNITY TESTING COLLECTION CENTER',
    region: 'Mumbai',
    order: 3
  },
  {
    id: 'loc-dombivli-east',
    name: 'Amensa Diagnostics – Dombivli Collection Center',
    address: 'Shop No. 4, The Signature Building, Below Anil Eye Hospital, Ganesh Mandir Road, Pendse Nagar, Dombivli East, Thane – 421201',
    workingHours: 'In-office Testing: 8:00 AM – 9:00 PM | Urgent Customer Support: Until 11:45 PM | Walk-in Status: Closed on Sundays',
    phone: '7039394488',
    whatsapp: '8422007488',
    email: 'amensadiagnostics@gmail.com',
    googleMapsUrl: 'https://maps.google.com/?q=Shop+No.+4,+The+Signature+Building,+Below+Anil+Eye+Hospital,+Ganesh+Mandir+Road,+Pendse+Nagar,+Dombivli+East,+Thane+–+421201',
    facilities: ['Dombivli Collection Center', 'In-office Blood Draw', 'Certified Phlebotomists', 'Home Collection Dispatch Desk'],
    badge: 'DOMBIVLI',
    region: 'Thane',
    order: 4
  }
];

export const testimonials: Testimonial[] = [];

export const faqItems: FAQItem[] = [
  {
    id: 'faq-1',
    question: "Do you follow NABL Standards and Protocols?",
    answer: "We follow NABL Standards and Protocols to ensure quality and accuracy in diagnostic services. This guarantees that our laboratories adhere to strict international quality standards, undergo random check testing, use calibrated automated analyzers, and are staffed with certified MD Pathologists to ensure accurate, legally-defensible results.",
    category: 'Accreditation'
  },
  {
    id: 'faq-2',
    question: "How do I prepare for my home blood collection?",
    answer: "For most comprehensive packages (like our Wellness Package or Lipid/Sugar profiles), an overnight fasting of 10-12 hours is mandatory. You should not consume any tea, coffee, food, or soft drinks during this period. Plain water is permitted and encouraged to stay hydrated, which makes blood extraction easier.",
    category: 'Preparation'
  },
  {
    id: 'faq-3',
    question: "Are there any delivery charges for home sample collection?",
    answer: "No, home sample collection is 100% free for all standard packages and any diagnostic bookings totaling above ₹500. A certified phlebotomist with sterile, single-use, temperature-controlled sample kits will arrive at your doorstep without any hidden fees.",
    category: 'Home Collection'
  },
  {
    id: 'faq-4',
    question: "How soon will I receive my reports and how?",
    answer: "Pathology reports are processed with high-speed automated digital systems and delivered via WhatsApp and email within 24 hours of sample collection. ECG reports are shared within 30 minutes, and radiology reports (USG/X-ray) are uploaded within 4 hours.",
    category: 'Reports'
  },
  {
    id: 'faq-5',
    question: "What is the 'double-blind quality audit' process?",
    answer: "Every sample is barcoded anonymously, with no patient identifiers to prevent bias. The sample is split and processed on two independent automated diagnostic machines. If there is even a minor discrepancy between results, the sample is immediately routed for manual audit by our senior pathologists before final sign-off.",
    category: 'Quality'
  },
  {
    id: 'faq-6',
    question: "Do you offer free doctor consultations on lab reports?",
    answer: "Yes, our wellness packages (Amensa Complete Wellness and Senior Citizen Care) include a complimentary tele-consultation with our certified general physicians to help explain normal vs abnormal ranges and recommend next health steps.",
    category: 'Consultation'
  }
];
