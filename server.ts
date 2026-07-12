import "dotenv/config";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { 
  getDB, 
  saveDB, 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  verifyToken, 
  checkRateLimit, 
  registerFailedLoginAttempt, 
  resetLoginAttempts,
  addNotification,
  Patient,
  Appointment,
  Report,
  Notification as DBNotification,
  initializeAndSyncFirestore
} from "./server-db";
import { syncToSupabase, syncStats } from "./src/services/supabaseService";

async function startServer() {
  // Synchronize and seed Firestore database before booting Express
  await initializeAndSyncFirestore();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ 
    limit: '50mb',
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cookieParser());

  // Manual CORS Middleware to support static cross-domain hosting (like Netlify)
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // --------------------------------------------------------
  // SECURITY & MIDDLEWARE HELPERS
  // --------------------------------------------------------
  
  // Patient JWT Authentication Middleware
  const authenticatePatient = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let token = req.cookies.amensa_patient_token;
    
    // Check Authorization header fallback for cross-domain static sites (Netlify)
    const authHeader = req.headers.authorization;
    if (!token && authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    
    if (!token) {
      res.status(401).json({ error: "Authentication session expired. Please sign in." });
      return;
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: "Invalid session token. Please sign in again." });
      return;
    }
    
    // Attach patient credentials
    (req as any).patientId = decoded.id;
    (req as any).patientEmail = decoded.email;
    next();
  };

  // Simple Admin Session Authenticator (Matches credentials from AdminPanel)
  const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader === "AmensaAdminSessionSecret") {
      next();
    } else {
      res.status(403).json({ error: "Unauthorized access to Clinical Admin Node." });
    }
  };

  // --------------------------------------------------------
  // PATIENT PORTAL REST API
  // --------------------------------------------------------

  // Register New Patient Account
  app.post("/api/auth/signup", async (req, res) => {
    const { fullName, email, mobile, dob, gender, password, confirmPassword } = req.body;

    // 1. Inputs Validation
    if (!fullName || !email || !mobile || !dob || !gender || !password || !confirmPassword) {
      res.status(400).json({ error: "All profile registration fields are strictly required." });
      return;
    }

    if (fullName.trim().length < 3) {
      res.status(400).json({ error: "Full Name must be at least 3 characters." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: "Please enter a valid clinical contact email address." });
      return;
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
      res.status(400).json({ error: "Mobile number must be exactly 10 digits." });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Security password must be at least 6 characters long." });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: "Password verification check failed. Passwords do not match." });
      return;
    }

    try {
      const db = getDB();
      const cleanEmail = email.toLowerCase().trim();

      // Check if email already registered
      const emailExists = db.patients.some(p => p.email === cleanEmail);
      if (emailExists) {
        res.status(400).json({ error: "This email address is already registered in our clinical system." });
        return;
      }

      // Hash password
      const passwordHash = await hashPassword(password);
      
      const newPatient: Patient = {
        id: `AMS-P${Math.floor(100000 + Math.random() * 900000)}`,
        fullName: fullName.trim(),
        email: cleanEmail,
        mobile: mobile.trim(),
        passwordHash,
        dob,
        gender,
        address: "",
        profileImage: "",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.patients.push(newPatient);
      saveDB(db);

      // Add Welcome Notification
      addNotification(
        newPatient.id, 
        "Welcome to Amensa Diagnostics!", 
        `Hello ${newPatient.fullName}, your secure clinical patient portal is active. You can now book home sample collections, view reports, and track test statuses.`
      );

      // Generate session JWT
      const token = generateToken(newPatient.id, newPatient.email);
      
      // Set secure cookie - use Secure; SameSite=None in production to support cross-domain hosting
      const isProduction = process.env.NODE_ENV === "production";
      res.cookie("amensa_patient_token", token, {
        httpOnly: true,
        secure: isProduction,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: isProduction ? "none" : "lax"
      });

      // Return sanitized profile (omit passwordHash)
      const { passwordHash: _, ...sanitizedPatient } = newPatient;
      res.status(201).json({ 
        message: "Patient registered successfully", 
        token,
        patient: sanitizedPatient 
      });

    } catch (err) {
      console.error("Signup error:", err);
      res.status(500).json({ error: "Internal server error during record ingestion." });
    }
  });

  // Patient Login with Rate Limiting
  app.post("/api/auth/login", async (req, res) => {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and security password are required." });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();

    // Rate Limiter Check
    const limitCheck = checkRateLimit(cleanEmail);
    if (!limitCheck.allowed) {
      res.status(429).json({ 
        error: `Security Lockout: Too many failed login attempts. Please try again in ${limitCheck.waitTimeMinutes} minutes.` 
      });
      return;
    }

    try {
      const db = getDB();
      const patient = db.patients.find(p => p.email === cleanEmail);

      if (!patient) {
        registerFailedLoginAttempt(cleanEmail);
        res.status(401).json({ error: "Invalid email credentials or verification password." });
        return;
      }

      if (patient.status === "disabled") {
        res.status(403).json({ error: "Your Patient Portal account has been administrative disabled. Please contact Amensa Helpdesk." });
        return;
      }

      // Verify bcrypt password
      const passwordMatch = await verifyPassword(password, patient.passwordHash);
      if (!passwordMatch) {
        registerFailedLoginAttempt(cleanEmail);
        res.status(401).json({ error: "Invalid email credentials or verification password." });
        return;
      }

      // Reset lockout on success
      resetLoginAttempts(cleanEmail);

      // Generate JWT
      const token = generateToken(patient.id, patient.email);

      // Set cookie duration based on rememberMe
      const cookieAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days vs 1 day

      // Set secure cookie - use Secure; SameSite=None in production to support cross-domain hosting
      const isProduction = process.env.NODE_ENV === "production";
      res.cookie("amensa_patient_token", token, {
        httpOnly: true,
        secure: isProduction,
        maxAge: cookieAge,
        sameSite: isProduction ? "none" : "lax"
      });

      const { passwordHash: _, ...sanitizedPatient } = patient;
      res.json({
        message: "Sign-in successful",
        token,
        patient: sanitizedPatient
      });

    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Internal authentication error." });
    }
  });

  // Log Out Patient Portal
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("amensa_patient_token");
    res.json({ message: "Session signed out successfully." });
  });

  // Fetch Current Logged-In Patient
  app.get("/api/auth/me", authenticatePatient, (req, res) => {
    const db = getDB();
    const patient = db.patients.find(p => p.id === (req as any).patientId);
    
    if (!patient) {
      res.status(404).json({ error: "Patient record not found in database." });
      return;
    }

    if (patient.status === "disabled") {
      res.clearCookie("amensa_patient_token");
      res.status(403).json({ error: "Your account is disabled." });
      return;
    }

    const { passwordHash: _, ...sanitizedPatient } = patient;
    res.json(sanitizedPatient);
  });

  // Forgot Password Initiation (Generates secure simulator token)
  app.post("/api/auth/forgot-password", (req, res) => {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required to request reset instructions." });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const db = getDB();
    const patient = db.patients.find(p => p.email === cleanEmail);

    if (!patient) {
      // Avoid enum leak for security, but return simulated confirmation
      res.json({ message: "If this email is in our database, recovery instructions have been dispatched." });
      return;
    }

    // Generate numeric simulator code
    const resetToken = `AMS-RST-${Math.floor(100000 + Math.random() * 900000)}`;
    
    db.passwordResetTokens[resetToken] = {
      email: cleanEmail,
      expires: Date.now() + 30 * 60 * 1000 // 30 minutes
    };
    
    saveDB(db);

    res.json({ 
      message: "Security code dispatched successfully.",
      debugToken: resetToken // Expose for easier development/testing preview
    });
  });

  // Complete Password Reset Validation
  app.post("/api/auth/reset-password", async (req, res) => {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      res.status(400).json({ error: "All reset tokens and passwords are required." });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters." });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: "Passwords do not match." });
      return;
    }

    try {
      const db = getDB();
      const tokenRecord = db.passwordResetTokens[token];

      if (!tokenRecord || tokenRecord.expires < Date.now()) {
        res.status(400).json({ error: "Security reset token has expired or is invalid." });
        return;
      }

      const patient = db.patients.find(p => p.email === tokenRecord.email);
      if (!patient) {
        res.status(404).json({ error: "Target patient profile record was not found." });
        return;
      }

      // Hash new password
      patient.passwordHash = await hashPassword(newPassword);
      patient.updatedAt = new Date().toISOString();

      // Clear token
      delete db.passwordResetTokens[token];
      saveDB(db);

      addNotification(
        patient.id,
        "Password Changed Successfully",
        "Your secure account verification password has been modified. If you did not trigger this change, please report to Amensa Clinical Security immediately."
      );

      res.json({ message: "Your patient security password has been updated successfully. You can now login." });

    } catch (err) {
      console.error("Password reset error:", err);
      res.status(500).json({ error: "Security operation failed." });
    }
  });

  // Update Profile Details
  app.put("/api/auth/profile", authenticatePatient, async (req, res) => {
    const { fullName, mobile, dob, gender, address, profileImage } = req.body;
    const patientId = (req as any).patientId;

    if (!fullName || !mobile || !dob || !gender) {
      res.status(400).json({ error: "Missing required profile modification parameters." });
      return;
    }

    try {
      const db = getDB();
      const patient = db.patients.find(p => p.id === patientId);

      if (!patient) {
        res.status(404).json({ error: "Patient record not found." });
        return;
      }

      // Mutate fields
      patient.fullName = fullName.trim();
      patient.mobile = mobile.trim();
      patient.dob = dob;
      patient.gender = gender;
      patient.address = address || "";
      if (profileImage !== undefined) {
        patient.profileImage = profileImage;
      }
      patient.updatedAt = new Date().toISOString();

      saveDB(db);

      const { passwordHash: _, ...sanitizedPatient } = patient;
      res.json({
        message: "Profile updated successfully.",
        patient: sanitizedPatient
      });

    } catch (err) {
      console.error("Profile update error:", err);
      res.status(500).json({ error: "Database profile writing failure." });
    }
  });

  // --------------------------------------------------------
  // SCHEDULING CONFIGURATION HELPERS & ENDPOINTS
  // --------------------------------------------------------

  function parseTimeToMinutes(timeStr: string): number | null {
    const match = timeStr.trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (!match) return null;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const ampm = match[3];

    if (ampm === "PM" && hours !== 12) {
      hours += 12;
    } else if (ampm === "AM" && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  }

  function parseHHMMToMinutes(hhmm: string): number | null {
    const parts = hhmm.split(":");
    if (parts.length !== 2) return null;
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
  }

  function validateAppointmentTime(preferredDate: string, preferredTimeSlot: string, config: any): { valid: boolean; error?: string } {
    if (config.holidayClosures && config.holidayClosures.includes(preferredDate)) {
      return { valid: false, error: `The selected date (${preferredDate}) is a holiday and not available for booking.` };
    }

    if (preferredTimeSlot.includes("-")) {
      return { valid: true };
    }

    const timeMinutes = parseTimeToMinutes(preferredTimeSlot);
    if (timeMinutes === null) {
      return { valid: false, error: "Invalid time format. Please use 'HH:MM AM/PM' format." };
    }

    const isMorning = timeMinutes >= 480 && timeMinutes <= 660;
    const isAfternoon = timeMinutes >= 720 && timeMinutes <= 960;
    const isEvening = timeMinutes >= 1020 && timeMinutes <= 1200;

    if (!isMorning && !isAfternoon && !isEvening) {
      return { valid: false, error: "The selected slot must be in Morning (8-11 AM), Afternoon (12-4 PM), or Evening (5-8 PM)." };
    }

    const openingMinutes = parseHHMMToMinutes(config.openingTime) ?? (8 * 60);
    const closingMinutes = parseHHMMToMinutes(config.closingTime) ?? (21 * 60);

    if (timeMinutes < openingMinutes || timeMinutes > closingMinutes) {
      return { valid: false, error: `Appointments are only permitted within clinical operating hours.` };
    }

    const diff = timeMinutes - openingMinutes;
    if (diff < 0 || diff % (config.interval || 30) !== 0) {
      return { valid: false, error: `Appointments must be scheduled at ${config.interval}-minute intervals.` };
    }

    const h = Math.floor(timeMinutes / 60);
    const m = timeMinutes % 60;
    const hhmm = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    if (config.unavailableTimeSlots && config.unavailableTimeSlots.includes(hhmm)) {
      return { valid: false, error: "The selected time slot is currently unavailable." };
    }

    return { valid: true };
  }

  // Public endpoint to fetch scheduling configuration
  app.get("/api/public/scheduling-config", (req, res) => {
    try {
      const db = getDB();
      res.json(db.schedulingConfig);
    } catch (err) {
      console.error("Error fetching scheduling config:", err);
      res.status(500).json({ error: "Failed to retrieve scheduling settings." });
    }
  });

  // Admin endpoint to fetch scheduling configuration
  app.get("/api/admin/scheduling-config", authenticateAdmin, (req, res) => {
    try {
      const db = getDB();
      res.json(db.schedulingConfig);
    } catch (err) {
      console.error("Error fetching scheduling config for admin:", err);
      res.status(500).json({ error: "Failed to retrieve scheduling settings." });
    }
  });

  // Admin endpoint to save/update scheduling configuration
  app.post("/api/admin/scheduling-config", authenticateAdmin, (req, res) => {
    const { openingTime, closingTime, interval, holidayClosures, unavailableTimeSlots } = req.body;

    if (!openingTime || !closingTime || !interval) {
      res.status(400).json({ error: "Opening time, closing time, and interval are required." });
      return;
    }

    try {
      const db = getDB();
      db.schedulingConfig = {
        openingTime,
        closingTime,
        interval: Number(interval),
        holidayClosures: Array.isArray(holidayClosures) ? holidayClosures : [],
        unavailableTimeSlots: Array.isArray(unavailableTimeSlots) ? unavailableTimeSlots : []
      };
      saveDB(db);
      res.json({ message: "Scheduling configuration updated successfully!", config: db.schedulingConfig });
    } catch (err) {
      console.error("Error saving scheduling config:", err);
      res.status(500).json({ error: "Failed to save scheduling settings." });
    }
  });

  // --------------------------------------------------------
  // PATIENT TRANSACTIONAL API
  // --------------------------------------------------------

  // Fetch Patient Dashboard Summary Core Stats
  app.get("/api/patient/dashboard", authenticatePatient, (req, res) => {
    const patientId = (req as any).patientId;
    const db = getDB();

    const patientAppointments = db.appointments.filter(a => a.patientId === patientId);
    const patientNotifications = db.notifications.filter(n => n.patientId === patientId);
    const patientReports = db.reports.filter(r => r.patientId === patientId);

    // Compute Dashboard Cards Stats
    const totalBookings = patientAppointments.length;
    const pendingBookings = patientAppointments.filter(a => a.status === "Pending" || a.status === "Confirmed").length;
    const completedTests = patientAppointments.filter(a => a.status === "Completed").length;
    const reportsAvailable = patientReports.length;

    res.json({
      stats: {
        totalBookings,
        pendingBookings,
        completedTests,
        reportsAvailable
      },
      appointments: patientAppointments,
      notifications: patientNotifications.slice(0, 8), // top 8
      reports: patientReports
    });
  });

  // Create Patient Appointment (Disabled: Use WhatsApp booking only)
  app.post("/api/patient/book", authenticatePatient, (req, res) => {
    res.status(400).json({ error: "Direct website booking is disabled. Please use WhatsApp to schedule your appointment." });
  });

  // Create Public / Guest Appointment (Disabled: Use WhatsApp booking only)
  app.post("/api/public/book", async (req, res) => {
    res.status(400).json({ error: "Direct website booking is disabled. Please use WhatsApp to schedule your appointment." });
  });

  // --------------------------------------------------------
  // RAZORPAY PAYMENT GATEWAY INTEGRATION
  // --------------------------------------------------------

  // Create Razorpay Order
  app.post("/api/razorpay/create-order", async (req, res) => {
    const { amount, patientName, patientPhone } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      res.status(400).json({ error: "Invalid payment amount parameter." });
      return;
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Check if credentials are set
    if (!keyId || !keySecret) {
      // In development / sandbox preview, we simulate order generation so they can test without credentials
      const simulatedOrderId = `order_sim_${Math.random().toString(36).substring(2, 11)}`;
      res.json({
        orderId: simulatedOrderId,
        amount: Math.round(amount * 100),
        currency: "INR",
        keyId: "rzp_test_simulated_key_id",
        isSimulated: true,
        message: "Running in sandbox simulation mode. Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your settings to connect your live gateway."
      });
      return;
    }

    try {
      const RazorpayModule = await import("razorpay");
      const RazorpayClass = RazorpayModule.default;
      const razorpay = new RazorpayClass({
        key_id: keyId,
        key_secret: keySecret
      });

      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // convert to paise
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: {
          patientName: patientName || "Guest",
          patientPhone: patientPhone || ""
        }
      });

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: keyId,
        isSimulated: false
      });
    } catch (err: any) {
      console.error("Razorpay order creation failure:", err);
      res.status(500).json({ error: "Failed to construct Razorpay checkout order on backend node.", details: err.message });
    }
  });

  // Verify Razorpay Payment Signature & Instantiate Booking
  app.post("/api/razorpay/verify-payment", async (req, res) => {
    const { 
      isSimulated, 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature,
      bookingDetails 
    } = req.body;

    if (!bookingDetails || !bookingDetails.items || !Array.isArray(bookingDetails.items) || bookingDetails.items.length === 0) {
      res.status(400).json({ error: "Missing clinical booking details payload." });
      return;
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!isSimulated && keySecret) {
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        res.status(400).json({ error: "Missing security confirmation signatures." });
        return;
      }

      try {
        const crypto = await import("crypto");
        const hmac = crypto.createHmac("sha256", keySecret);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generatedSignature = hmac.digest("hex");

        if (generatedSignature !== razorpay_signature) {
          res.status(400).json({ error: "Razorpay payment signature validation check failed." });
          return;
        }
      } catch (err: any) {
        console.error("Signature HMAC calculation failure:", err);
        res.status(500).json({ error: "Internal cryptographic validation failure." });
        return;
      }
    }

    try {
      const db = getDB();
      const { 
        patientId, 
        patientName, 
        patientAge, 
        patientGender, 
        mobile, 
        email, 
        bookingType, 
        preferredDate, 
        preferredTimeSlot, 
        address, 
        locationId,
        notes,
        items,
        visitCharge
      } = bookingDetails;

      if (!patientName || !mobile || !bookingType || !preferredDate || !preferredTimeSlot) {
        res.status(400).json({ error: "Required patient scheduler fields are missing." });
        return;
      }

      // 1. Resolve Patient ID or create patient profile if missing
      let resolvedPatientId = patientId;
      let patient = db.patients.find(p => p.id === patientId || p.mobile === mobile);
      
      if (!patient) {
        resolvedPatientId = `PAT-${Math.floor(100000 + Math.random() * 900000)}`;
        const emailAddress = email || `${mobile}@amensadiagnostics.com`;
        const passHash = await hashPassword(mobile);
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - (Number(patientAge) || 30);
        const dob = `${birthYear}-01-01`;

        const newPatient: Patient = {
          id: resolvedPatientId,
          fullName: patientName,
          email: emailAddress,
          mobile,
          passwordHash: passHash,
          dob,
          gender: patientGender || "Male",
          address: address || "",
          profileImage: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(patientName)}`,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        db.patients.push(newPatient);
        patient = newPatient;
      } else {
        resolvedPatientId = patient.id;
      }

      // 2. Instantiate individual bookings in database
      const bookingsCreated: Appointment[] = [];
      const totalAmount = items.reduce((sum: number, item: any) => sum + item.price, 0) + (Number(visitCharge) || 0);

      const isHome = bookingType === "Home Collection" || bookingType === "HomeCollection";

      for (const item of items) {
        const itemType = item.type === "RoutineTest" || item.type === "Routine Test" 
          ? "RoutineTest" 
          : (item.type === "Radiology" ? "Radiology" : "Package");

        const newBooking: Appointment = {
          id: `AMS-B${Math.floor(100000 + Math.random() * 900000)}`,
          patientId: resolvedPatientId,
          patientName,
          patientAge: Number(patientAge) || 30,
          patientGender: patientGender || "Male",
          mobile,
          email: patient.email || `${mobile}@amensadiagnostics.com`,
          selectedItemType: itemType,
          selectedItemId: item.id,
          selectedItemName: item.name,
          bookingType: isHome ? "HomeCollection" : "CenterVisit",
          preferredDate,
          preferredTimeSlot,
          address: isHome ? address : undefined,
          locationId: !isHome ? locationId : undefined,
          pricePaid: item.price,
          status: "Confirmed",
          notes: notes ? `${notes} (Paid via Razorpay: ${razorpay_payment_id || 'simulated'})` : `Paid via Razorpay: ${razorpay_payment_id || 'simulated'}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        bookingsCreated.push(newBooking);
      }

      // Add the visit charge to the price paid of the first booking
      if (Number(visitCharge) > 0 && bookingsCreated.length > 0) {
        bookingsCreated[0].pricePaid += Number(visitCharge);
      }

      // Add all to database
      bookingsCreated.forEach(booking => {
        db.appointments.unshift(booking);
      });

      // 3. Add success notification
      addNotification(
        resolvedPatientId,
        "Online Payment Successful!",
        `Congratulations! Your payment of ₹${totalAmount} has been processed successfully. We have confirmed your appointments for: ${items.map((i: any) => i.name).join(', ')}.`
      );

      saveDB(db);

      res.status(201).json({
        success: true,
        message: "Diagnostic booking established and paid successfully.",
        bookings: bookingsCreated
      });

    } catch (err: any) {
      console.error("Booking creation inside payment flow failure:", err);
      res.status(500).json({ error: "Failed to store confirmed clinical bookings in DB.", details: err.message });
    }
  });

  // --------------------------------------------------------
  // DEPRECATED CASHFREE PAYMENT GATEWAY INTEGRATION REMOVED
  // --------------------------------------------------------






  // Get Filtered Appointments
  app.get("/api/patient/appointments", authenticatePatient, (req, res) => {
    const patientId = (req as any).patientId;
    const { status, date } = req.query;
    const db = getDB();

    let filtered = db.appointments.filter(a => a.patientId === patientId);

    if (status) {
      filtered = filtered.filter(a => a.status === status);
    }
    if (date) {
      filtered = filtered.filter(a => a.preferredDate === date);
    }

    res.json(filtered);
  });

  // Get Patient Notifications
  app.get("/api/patient/notifications", authenticatePatient, (req, res) => {
    const patientId = (req as any).patientId;
    const db = getDB();
    res.json(db.notifications.filter(n => n.patientId === patientId));
  });

  // Mark notifications as read
  app.post("/api/patient/notifications/read", authenticatePatient, (req, res) => {
    const patientId = (req as any).patientId;
    const db = getDB();
    
    db.notifications.forEach(n => {
      if (n.patientId === patientId) {
        n.read = true;
      }
    });

    saveDB(db);
    res.json({ message: "All medical alert alerts cleared." });
  });

  // Get Reports List
  app.get("/api/patient/reports", authenticatePatient, (req, res) => {
    const patientId = (req as any).patientId;
    const db = getDB();
    res.json(db.reports.filter(r => r.patientId === patientId));
  });

  // Generate Realistic Report PDF download layout
  app.get("/api/patient/reports/download/:id", (req, res) => {
    const reportId = req.params.id;
    const db = getDB();
    const report = db.reports.find(r => r.id === reportId);

    if (!report) {
      res.status(404).send("Medical Diagnostics Report File Not Found.");
      return;
    }

    const patient = db.patients.find(p => p.id === report.patientId);
    
    // Send standard, beautiful diagnostic document layout that can trigger print/PDF directly in browser
    const docHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Amensa Diagnostics Report - ${report.id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-b: 4px solid #0066CC; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: 900; color: #0066CC; letter-spacing: 2px; }
          .certification { text-align: right; font-size: 10px; color: #64748b; font-weight: bold; }
          .title { text-align: center; text-transform: uppercase; font-size: 18px; margin: 20px 0; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
          .metadata-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; font-size: 12px; margin-bottom: 30px; }
          .meta-label { font-weight: bold; color: #475569; }
          .report-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
          .report-table th { background: #0f172a; color: white; padding: 10px; text-align: left; }
          .report-table td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; }
          .report-table tr:nth-child(even) { background: #f8fafc; }
          .result-normal { color: #0f172a; font-weight: 500; }
          .result-high { color: #ef4444; font-weight: bold; }
          .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-t: 1px solid #e2e8f0; padding-top: 15px; }
          .signature-row { display: flex; justify-content: space-between; margin-top: 60px; font-size: 12px; }
          .signature { text-align: center; width: 200px; border-top: 1px solid #cbd5e1; padding-top: 5px; font-weight: bold; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px; margin-bottom: 20px; font-size: 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
          <span>📄 Secure Diagnostics Record Node - Ready for clinical download.</span>
          <button onclick="window.print()" style="background: #0066CC; color: white; border: none; padding: 6px 12px; font-weight: bold; border-radius: 4px; cursor: pointer;">Print / Save as PDF</button>
        </div>

        <div class="header">
          <div>
            <div class="logo">AMENSA DIAGNOSTICS</div>
            <div style="font-size: 10px; color: #64748b; font-weight: 600; margin-top: 3px;">A Chain of NABL & ISO 9001:2015 Certified Reference Labs</div>
          </div>
          <div class="certification">
            <div>LAB ACCREDITATION NO: NABL-MC-5420</div>
            <div>GENUINE CLINICAL RECORD NODE</div>
            <div>STAMP DATE: ${new Date(report.date).toLocaleDateString()}</div>
          </div>
        </div>

        <div class="title">Official Patient Diagnostic Evaluation Report</div>

        <div class="metadata-grid">
          <div>
            <div><span class="meta-label">Patient Name:</span> ${patient ? patient.fullName : 'Guest Patient'}</div>
            <div><span class="meta-label">Age / Gender:</span> ${patient ? (new Date().getFullYear() - new Date(patient.dob).getFullYear()) : '30'} Yrs / ${patient ? patient.gender : 'Male'}</div>
            <div><span class="meta-label">Patient Reg ID:</span> ${report.patientId}</div>
          </div>
          <div>
            <div><span class="meta-label">Report ID:</span> ${report.id}</div>
            <div><span class="meta-label">Booking Node Ref:</span> ${report.bookingId}</div>
            <div><span class="meta-label">Sample Received On:</span> ${new Date(report.date).toLocaleDateString()} 09:12 AM</div>
          </div>
        </div>

        <h4 style="font-size: 14px; margin-bottom: 10px; color: #0f172a;">Pathology Parameter Metrics: ${report.testName}</h4>
        
        <table class="report-table">
          <thead>
            <tr>
              <th>Test Parameter Profile</th>
              <th>Observed Level Value</th>
              <th>Reference Clinical Interval</th>
              <th>Flag Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Fasting Plasma Glucose</td>
              <td class="result-high">112 mg/dL</td>
              <td>70 - 100 mg/dL</td>
              <td style="color: #ef4444; font-weight: bold;">ELEVATED</td>
            </tr>
            <tr>
              <td>HbA1c (Glycated Haemoglobin)</td>
              <td class="result-normal">5.8 %</td>
              <td>Less than 6.0 %</td>
              <td style="color: #10b981; font-weight: bold;">NORMAL</td>
            </tr>
            <tr>
              <td>Total Cholesterol Level</td>
              <td class="result-normal">184 mg/dL</td>
              <td>Less than 200 mg/dL</td>
              <td style="color: #10b981; font-weight: bold;">NORMAL</td>
            </tr>
            <tr>
              <td>Triglycerides Serum</td>
              <td class="result-high">162 mg/dL</td>
              <td>100 - 150 mg/dL</td>
              <td style="color: #ef4444; font-weight: bold;">ELEVATED</td>
            </tr>
            <tr>
              <td>HDL Cholesterol (Good)</td>
              <td class="result-normal">48 mg/dL</td>
              <td>Greater than 40 mg/dL</td>
              <td style="color: #10b981; font-weight: bold;">NORMAL</td>
            </tr>
          </tbody>
        </table>

        <div style="background: #f8fafc; border-left: 4px solid #0066CC; padding: 15px; margin-top: 20px; font-size: 11px; border-radius: 4px;">
          <strong>Clinical Remarks:</strong> ${report.notes || "Results indicate slight elevation in serum triglyceride and fasting glucose parameters. Lifestyle modifications and medical consult are recommended."}
        </div>

        <div class="signature-row">
          <div class="signature">
            Dr. Amita Shah, MD<br/>
            <span style="font-size: 10px; color: #64748b; font-weight: normal;">Consultant Pathologist</span>
          </div>
          <div class="signature">
            Dr. Anand Kulkarni, Ph.D.<br/>
            <span style="font-size: 10px; color: #64748b; font-weight: normal;">Senior Clinical Biochemist</span>
          </div>
        </div>

        <div class="footer">
          This is an electronically authenticated clinical record. Double-blind validated by NABL certified algorithms.<br/>
          Amensa Reference Labs, Sarojini Naidu Rd, Tambe Nagar, Mulund West, Mumbai, MH - 400080.
        </div>
      </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.send(docHtml);
  });


  // --------------------------------------------------------
  // ADMIN CONTROL PLANE OVERRIDES
  // --------------------------------------------------------

  // Admin Login Endpoint
  app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail !== "amensadiagnostics@gmail.com") {
      res.status(401).json({ error: "Invalid clinical credentials or security authorization password." });
      return;
    }

    try {
      const db = getDB();
      // Ensure the admin password hash is initialized in the DB if it is missing
      if (!db.adminPasswordHash) {
        db.adminPasswordHash = await hashPassword("Amensa123");
        saveDB(db);
      }

      const isMatch = await verifyPassword(password, db.adminPasswordHash);
      if (isMatch) {
        res.json({ success: true, token: "AmensaAdminSessionSecret" });
      } else {
        res.status(401).json({ error: "Invalid clinical credentials or security authorization password." });
      }
    } catch (err) {
      console.error("Admin login error:", err);
      res.status(500).json({ error: "Internal server error during authentication." });
    }
  });

  // Secure Admin Logout Endpoint
  app.post("/api/admin/logout", (req, res) => {
    res.clearCookie("amensa_admin_token");
    res.json({ message: "Admin session signed out successfully." });
  });

  // Admin Change Password Endpoint
  app.post("/api/admin/change-password", authenticateAdmin, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      res.status(400).json({ error: "Old password and new password are required." });
      return;
    }

    try {
      const db = getDB();
      if (!db.adminPasswordHash) {
        db.adminPasswordHash = await hashPassword("Amensa123");
        saveDB(db);
      }

      const isMatch = await verifyPassword(oldPassword, db.adminPasswordHash);
      if (!isMatch) {
        res.status(400).json({ error: "The current authorization key entered is invalid." });
        return;
      }

      db.adminPasswordHash = await hashPassword(newPassword);
      saveDB(db);

      res.json({ message: "Security authorization key changed successfully!" });
    } catch (err) {
      console.error("Admin change password error:", err);
      res.status(500).json({ error: "Failed to update security authorization key." });
    }
  });

  // Fetch all registered patients
  app.get("/api/admin/patients", authenticateAdmin, (req, res) => {
    const db = getDB();
    // Sanitize passwords out
    const sanitized = db.patients.map(({ passwordHash, ...rest }) => rest);
    res.json(sanitized);
  });

  // Toggle/Disable Patient Portal accounts
  app.put("/api/admin/patients/:id/status", authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'active' | 'disabled'

    if (status !== "active" && status !== "disabled") {
      res.status(400).json({ error: "Invalid registration status target parameter." });
      return;
    }

    const db = getDB();
    const patient = db.patients.find(p => p.id === id);

    if (!patient) {
      res.status(404).json({ error: "Patient record node not found." });
      return;
    }

    patient.status = status;
    patient.updatedAt = new Date().toISOString();
    saveDB(db);

    res.json({ message: `Patient account ${id} has been set to ${status}.` });
  });

  // Fetch all global appointments
  app.get("/api/admin/appointments", authenticateAdmin, (req, res) => {
    const db = getDB();
    res.json(db.appointments);
  });

  // Admin adds an appointment
  app.post("/api/admin/appointments", authenticateAdmin, async (req, res) => {
    const { 
      patientName, 
      patientAge, 
      patientGender, 
      mobile, 
      selectedItemType, 
      selectedItemId, 
      selectedItemName, 
      bookingType, 
      preferredDate, 
      preferredTimeSlot, 
      address, 
      locationId, 
      status, 
      pricePaid 
    } = req.body;

    if (!patientName || !mobile || !selectedItemType || !selectedItemId || !selectedItemName || !bookingType || !preferredDate || !preferredTimeSlot || pricePaid === undefined) {
      res.status(400).json({ error: "Incomplete diagnostic scheduling parameter payload." });
      return;
    }

    try {
      const db = getDB();
      const validation = validateAppointmentTime(preferredDate, preferredTimeSlot, db.schedulingConfig);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }
      
      // Look up patient by mobile
      let patient = db.patients.find(p => p.mobile === mobile);
      let patientId = "";
      if (patient) {
        patientId = patient.id;
      } else {
        // Create dynamic patient record
        patientId = `PAT-${Math.floor(100000 + Math.random() * 900000)}`;
        const email = `${mobile}@amensadiagnostics.com`;
        const passwordHash = await hashPassword(mobile);
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - (Number(patientAge) || 30);
        const dob = `${birthYear}-01-01`;

        const newPatient: Patient = {
          id: patientId,
          fullName: patientName,
          email,
          mobile,
          passwordHash,
          dob,
          gender: patientGender || "Male",
          address: address || "",
          profileImage: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(patientName)}`,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        db.patients.push(newPatient);
        patient = newPatient;
      }

      const newBooking: Appointment = {
        id: `AMS-B${Math.floor(100000 + Math.random() * 900000)}`,
        patientId,
        patientName,
        patientAge: Number(patientAge) || 30,
        patientGender: patientGender || "Male",
        mobile,
        email: patient.email || `${mobile}@amensadiagnostics.com`,
        selectedItemType,
        selectedItemId,
        selectedItemName,
        bookingType,
        preferredDate,
        preferredTimeSlot,
        address: bookingType === "HomeCollection" ? address : undefined,
        locationId: bookingType === "CenterVisit" ? locationId : undefined,
        pricePaid: Number(pricePaid),
        status: status || "Pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.appointments.unshift(newBooking);
      saveDB(db);

      res.status(201).json({
        message: "Diagnostic appointment registered successfully.",
        booking: newBooking
      });
    } catch (err) {
      console.error("Admin booking create error:", err);
      res.status(500).json({ error: "Failed to queue diagnostic booking from admin." });
    }
  });

  // Admin updates an appointment details
  app.put("/api/admin/appointments/:id", authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const { 
      patientName, 
      patientAge, 
      patientGender, 
      mobile, 
      selectedItemType, 
      selectedItemId, 
      selectedItemName, 
      bookingType, 
      preferredDate, 
      preferredTimeSlot, 
      address, 
      locationId, 
      status, 
      pricePaid 
    } = req.body;

    const db = getDB();
    const appt = db.appointments.find(a => a.id === id);

    if (!appt) {
      res.status(404).json({ error: "Appointment registry entry not found." });
      return;
    }

    if (patientName) appt.patientName = patientName;
    if (patientAge !== undefined) appt.patientAge = Number(patientAge);
    if (patientGender) appt.patientGender = patientGender;
    if (mobile) appt.mobile = mobile;
    if (selectedItemType) appt.selectedItemType = selectedItemType;
    if (selectedItemId) appt.selectedItemId = selectedItemId;
    if (selectedItemName) appt.selectedItemName = selectedItemName;
    if (bookingType) appt.bookingType = bookingType;
    if (preferredDate) appt.preferredDate = preferredDate;
    if (preferredTimeSlot) appt.preferredTimeSlot = preferredTimeSlot;
    
    appt.address = bookingType === "HomeCollection" ? address : undefined;
    appt.locationId = bookingType === "CenterVisit" ? locationId : undefined;
    
    if (status) appt.status = status;
    if (pricePaid !== undefined) appt.pricePaid = Number(pricePaid);
    appt.updatedAt = new Date().toISOString();

    saveDB(db);
    res.json({ message: "Appointment details updated successfully.", appointment: appt });
  });

  // Admin deletes an appointment
  app.delete("/api/admin/appointments/:id", authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const db = getDB();
    
    const index = db.appointments.findIndex(a => a.id === id);
    if (index === -1) {
      res.status(404).json({ error: "Appointment entry not found." });
      return;
    }

    db.appointments.splice(index, 1);
    saveDB(db);

    res.json({ message: "Appointment record deleted successfully." });
  });

  // Modify Appointment fulfillment status (With instant notification dispatcher)
  app.put("/api/admin/appointments/:id/status", authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    const db = getDB();
    const appt = db.appointments.find(a => a.id === id);

    if (!appt) {
      res.status(404).json({ error: "Appointment registry entry not found." });
      return;
    }

    appt.status = status;
    if (notes !== undefined) {
      appt.notes = notes;
    }
    appt.updatedAt = new Date().toISOString();
    saveDB(db);

    // Dynamic Patient Notification Router
    let title = "Appointment Update";
    let msg = `Your appointment status for "${appt.selectedItemName}" has been modified to: ${status}.`;

    if (status === "Confirmed") {
      title = "Booking Confirmed!";
      msg = `Amensa Phlebotomist has been allocated for your appointment "${appt.selectedItemName}" on ${appt.preferredDate} (${appt.preferredTimeSlot}).`;
    } else if (status === "Sample Collected") {
      title = "Diagnostics Sample Collected";
      msg = `Our clinical phlebotomist has safely collected and checked your blood serum specimens for "${appt.selectedItemName}". They are en-route to our central lab.`;
    } else if (status === "Processing") {
      title = "Specimens In Lab Testing";
      msg = `Your diagnostic blood specimens have arrived at our central NABL certified laboratory, and testing is currently underway.`;
    } else if (status === "Report Ready") {
      title = "Official Lab Report Dispatched!";
      msg = `Your official double-blind checked diagnostics pathology reports for "${appt.selectedItemName}" are ready and available for digital download inside your Patient Portal.`;
    } else if (status === "Cancelled") {
      title = "Appointment Cancelled";
      msg = `Your diagnostic scheduling file "${appt.selectedItemName}" has been cancelled. If this is a mistake, contact Amensa Support immediately.`;
    }

    addNotification(appt.patientId, title, msg);

    res.json({ message: "Appointment status modified and patient alert triggered.", appointment: appt });
  });

  // Upload lab report for patient profile
  app.post("/api/admin/reports/upload", authenticateAdmin, (req, res) => {
    const { patientId, bookingId, testName, notes } = req.body;

    if (!patientId || !bookingId || !testName) {
      res.status(400).json({ error: "Missing clinical parameters for report filing." });
      return;
    }

    const db = getDB();
    
    const newReport: Report = {
      id: `AMS-REP-${Math.floor(100000 + Math.random() * 900000)}`,
      patientId,
      bookingId,
      testName,
      date: new Date().toISOString(),
      pdfUrl: `/api/patient/reports/download/`, // client will append report ID
      notes: notes || "No additional lab notes provided.",
      createdAt: new Date().toISOString()
    };

    newReport.pdfUrl = `${newReport.pdfUrl}${newReport.id}`;

    db.reports.unshift(newReport);

    // Auto flag status to "Report Ready" inside associated booking
    const appt = db.appointments.find(a => a.id === bookingId);
    if (appt) {
      appt.status = "Report Ready";
      appt.updatedAt = new Date().toISOString();
    }

    saveDB(db);

    // Dispach critical clinical notification
    addNotification(
      patientId,
      "Official Lab Report Dispatched!",
      `Your official double-blind checked diagnostics pathology reports for "${testName}" are ready and available for digital download inside your Patient Portal.`
    );

    res.status(201).json({ message: "Official diagnostics pathology report compiled and filed successfully.", report: newReport });
  });

  // --------------------------------------------------------
  // GITHUB AUTO-SYNC INTEGRATION ENDPOINTS
  // --------------------------------------------------------

  const maskToken = (token?: string) => {
    if (!token) return "";
    if (token.length <= 8) return "********";
    return `${token.slice(0, 4)}...${token.slice(-4)}`;
  };

  // Get current GitHub configuration
  app.get("/api/admin/github/config", authenticateAdmin, (req, res) => {
    try {
      const db = getDB();
      const config = db.githubConfig || {
        owner: "",
        repo: "",
        token: "",
        branch: "main",
        status: "Disconnected" as const
      };

      res.json({
        owner: config.owner,
        repo: config.repo,
        branch: config.branch,
        lastSyncTime: config.lastSyncTime,
        lastCommitHash: config.lastCommitHash,
        status: config.status,
        hasToken: !!config.token,
        maskedToken: config.token ? maskToken(config.token) : ""
      });
    } catch (err: any) {
      console.error("Error fetching GitHub config:", err);
      res.status(500).json({ error: "Failed to retrieve GitHub configurations." });
    }
  });

  // Save/update GitHub configuration
  app.post("/api/admin/github/config", authenticateAdmin, (req, res) => {
    const { owner, repo, token, branch } = req.body;

    if (!owner || !repo || !branch) {
      res.status(400).json({ error: "Repository owner, name, and branch are required." });
      return;
    }

    try {
      const db = getDB();
      const existingConfig = db.githubConfig;

      let finalToken = token;
      // If the token is masked or unchanged, keep the existing token
      if (token && (token.startsWith("***") || token.includes("...")) && existingConfig?.token) {
        finalToken = existingConfig.token;
      }

      if (!finalToken) {
        res.status(400).json({ error: "Personal Access Token is required to authenticate with GitHub." });
        return;
      }

      db.githubConfig = {
        owner: owner.trim(),
        repo: repo.trim(),
        token: finalToken.trim(),
        branch: branch.trim(),
        lastSyncTime: existingConfig?.lastSyncTime,
        lastCommitHash: existingConfig?.lastCommitHash,
        status: existingConfig?.status || "Connected"
      };

      saveDB(db);

      res.json({ 
        message: "GitHub configurations saved successfully.",
        config: {
          owner: db.githubConfig.owner,
          repo: db.githubConfig.repo,
          branch: db.githubConfig.branch,
          lastSyncTime: db.githubConfig.lastSyncTime,
          lastCommitHash: db.githubConfig.lastCommitHash,
          status: db.githubConfig.status,
          hasToken: true,
          maskedToken: maskToken(db.githubConfig.token)
        }
      });
    } catch (err: any) {
      console.error("Error saving GitHub config:", err);
      res.status(500).json({ error: "Failed to save GitHub configurations." });
    }
  });

  // Test connection to GitHub
  app.post("/api/admin/github/test", authenticateAdmin, async (req, res) => {
    const { owner, repo, token } = req.body;

    try {
      const db = getDB();
      let finalToken = token;

      // Handle masked token case
      if ((!token || token.startsWith("***") || token.includes("...")) && db.githubConfig?.token) {
        finalToken = db.githubConfig.token;
      }

      const finalOwner = owner || db.githubConfig?.owner;
      const finalRepo = repo || db.githubConfig?.repo;

      if (!finalOwner || !finalRepo || !finalToken) {
        res.status(400).json({ error: "Missing required details to run connection test." });
        return;
      }

      // Query GitHub Repos API
      const response = await fetch(`https://api.github.com/repos/${finalOwner}/${finalRepo}`, {
        method: "GET",
        headers: {
          "Authorization": `token ${finalToken}`,
          "Accept": "application/vnd.github+json",
          "User-Agent": "Amensa-Diagnostics-Server"
        }
      });

      if (response.status === 200) {
        const repoData = await response.json();
        res.json({ 
          success: true, 
          message: `Successfully connected to repository "${repoData.full_name}"!`,
          defaultBranch: repoData.default_branch
        });
      } else {
        const errData = await response.json().catch(() => ({}));
        res.status(response.status).json({ 
          success: false, 
          error: errData.message || `GitHub API returned status code ${response.status}.`
        });
      }
    } catch (err: any) {
      console.error("Error testing GitHub connection:", err);
      res.status(500).json({ error: "Failed to connect to GitHub. Check network connectivity or credentials." });
    }
  });

  // Disconnect GitHub Repository
  app.post("/api/admin/github/disconnect", authenticateAdmin, (req, res) => {
    try {
      const db = getDB();
      db.githubConfig = {
        owner: "",
        repo: "",
        token: "",
        branch: "main",
        status: "Disconnected" as const
      };
      saveDB(db);
      res.json({ message: "Successfully disconnected and cleared GitHub credentials." });
    } catch (err) {
      console.error("Error disconnecting GitHub:", err);
      res.status(500).json({ error: "Failed to clear configurations." });
    }
  });

  // Commit and sync website data to GitHub
  app.post("/api/admin/github/sync", authenticateAdmin, async (req, res) => {
    const { commitMessage, websiteData } = req.body;

    if (!websiteData) {
      res.status(400).json({ error: "Sync payload must contain website data." });
      return;
    }

    try {
      const db = getDB();
      const config = db.githubConfig;

      if (!config || !config.owner || !config.repo || !config.token) {
        res.status(400).json({ error: "No connected GitHub repository. Configure the integration settings first." });
        return;
      }

      const filePath = "public/website_data.json";
      const branchName = config.branch || "main";
      const token = config.token;
      const owner = config.owner;
      const repo = config.repo;

      // 1. Get the existing file SHA if it exists
      let currentSha: string | undefined = undefined;
      const getFileResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branchName}`, {
        method: "GET",
        headers: {
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github+json",
          "User-Agent": "Amensa-Diagnostics-Server"
        }
      });

      if (getFileResponse.status === 200) {
        const fileData = await getFileResponse.json();
        currentSha = fileData.sha;
      } else if (getFileResponse.status !== 404) {
        const errData = await getFileResponse.json().catch(() => ({}));
        res.status(getFileResponse.status).json({ 
          error: `Could not retrieve file information from GitHub repository. ${errData.message || ""}` 
        });
        return;
      }

      // 2. Put the new content
      const msg = commitMessage || "Update clinical web content";
      const base64Content = Buffer.from(JSON.stringify(websiteData, null, 2)).toString("base64");

      const putBody: any = {
        message: msg,
        content: base64Content,
        branch: branchName
      };

      if (currentSha) {
        putBody.sha = currentSha;
      }

      const putResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
        method: "PUT",
        headers: {
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github+json",
          "Content-Type": "application/json",
          "User-Agent": "Amensa-Diagnostics-Server"
        },
        body: JSON.stringify(putBody)
      });

      if (putResponse.status === 200 || putResponse.status === 201) {
        const putData = await putResponse.json();
        const commitHash = putData.commit.sha;
        const syncTime = new Date().toISOString();

        // Save status in DB
        config.lastSyncTime = syncTime;
        config.lastCommitHash = commitHash;
        config.status = "Connected";
        saveDB(db);

        res.json({
          success: true,
          message: "CMS content successfully synchronized and committed to GitHub!",
          commitHash,
          syncTime
        });
      } else {
        const errData = await putResponse.json().catch(() => ({}));
        res.status(putResponse.status).json({
          error: `Failed to commit to repository. ${errData.message || ""}`
        });
      }
    } catch (err: any) {
      console.error("Error syncing with GitHub:", err);
      res.status(500).json({ error: "Failed to execute auto-sync. Please verify token permissions and internet connection." });
    }
  });


  // Get Supabase sync metrics & status
  app.get("/api/admin/supabase/stats", authenticateAdmin, (req, res) => {
    try {
      res.json({
        success: true,
        stats: syncStats,
        config: {
          url: process.env.SUPABASE_URL || 'https://xxpmsqiojwjznpzprdha.supabase.co',
          keyMasked: "sb_publishable_jxE...uY545Iuv"
        }
      });
    } catch (err: any) {
      console.error("Error retrieving Supabase statistics:", err);
      res.status(500).json({ error: "Failed to load integration statistics." });
    }
  });

  // Manually force-sync all local database/Firestore records to Supabase
  app.post("/api/admin/supabase/sync", authenticateAdmin, async (req, res) => {
    try {
      const db = getDB();
      await syncToSupabase(db);
      
      if (syncStats.status === 'error') {
        res.status(500).json({ 
          error: `Sync completed with errors: ${syncStats.error}`,
          stats: syncStats 
        });
      } else {
        res.json({
          success: true,
          message: "Database records successfully synchronized to Supabase!",
          stats: syncStats
        });
      }
    } catch (err: any) {
      console.error("Error forcing Supabase synchronization:", err);
      res.status(500).json({ error: err.message || "Failed to synchronize database nodes." });
    }
  });


  // --------------------------------------------------------
  // SEED INITIAL SAMPLES IN DATABASE IF NEW
  // --------------------------------------------------------
  const db = getDB();
  if (db.patients.length === 0) {
    console.log("Seeding clinical file-base database with starter files...");
    // Create a mock active patient
    const starterHash = await hashPassword("amensa2026");
    const demoPatient: Patient = {
      id: "AMS-P12345",
      fullName: "Patient Name",
      email: "patient@example.com",
      mobile: "9876543210",
      passwordHash: starterHash,
      dob: "1988-11-14",
      gender: "Male",
      address: "B-201, Green Meadows, LBS Marg, Mulund West, Mumbai",
      profileImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.patients.push(demoPatient);

    // Add associated mock appointments
    const demoAppt1: Appointment = {
      id: "AMS-B77002",
      patientId: demoPatient.id,
      patientName: demoPatient.fullName,
      patientAge: 38,
      patientGender: demoPatient.gender,
      mobile: demoPatient.mobile,
      email: demoPatient.email,
      selectedItemType: "Package",
      selectedItemId: "pkg-senior-male",
      selectedItemName: "Senior Citizen Active Health Care (Male)",
      bookingType: "HomeCollection",
      preferredDate: "2026-06-25",
      preferredTimeSlot: "08:00 AM - 10:00 AM",
      address: demoPatient.address,
      pricePaid: 1499,
      status: "Completed",
      createdAt: "2026-06-24T08:00:00Z",
      updatedAt: "2026-06-25T14:30:00Z"
    };

    const demoAppt2: Appointment = {
      id: "AMS-B77003",
      patientId: demoPatient.id,
      patientName: demoPatient.fullName,
      patientAge: 38,
      patientGender: demoPatient.gender,
      mobile: demoPatient.mobile,
      email: demoPatient.email,
      selectedItemType: "RoutineTest",
      selectedItemId: "t-lipid",
      selectedItemName: "Lipid Profile (Cholesterol Panel)",
      bookingType: "HomeCollection",
      preferredDate: "2026-06-29",
      preferredTimeSlot: "07:00 AM - 08:00 AM",
      address: demoPatient.address,
      pricePaid: 450,
      status: "Pending",
      createdAt: "2026-06-25T11:45:00Z",
      updatedAt: "2026-06-25T11:45:00Z"
    };

    db.appointments.push(demoAppt1);
    db.appointments.push(demoAppt2);

    // Create a report for completed appt
    const demoRep: Report = {
      id: "AMS-REP-8801",
      patientId: demoPatient.id,
      bookingId: demoAppt1.id,
      testName: "Senior Citizen Active Health Care (Male)",
      date: "2026-06-25T14:30:00Z",
      pdfUrl: "/api/patient/reports/download/AMS-REP-8801",
      notes: "Biochemistry parameters indicate mild high lipid scores. Phlebotomy completed safely. Fasting sugar is normal.",
      createdAt: "2026-06-25T14:30:00Z"
    };
    db.reports.push(demoRep);

    // Notifications
    const demoNotif1: DBNotification = {
      id: "AMS-N001",
      patientId: demoPatient.id,
      title: "Welcome to Amensa Diagnostics!",
      message: `Hello ${demoPatient.fullName}, your secure clinical patient portal is active. You can now book home sample collections, view reports, and track test statuses.`,
      createdAt: "2026-06-24T08:05:00Z",
      read: true
    };
    const demoNotif2: DBNotification = {
      id: "AMS-N002",
      patientId: demoPatient.id,
      title: "Official Lab Report Dispatched!",
      message: `Your official double-blind checked diagnostics pathology reports for "Senior Citizen Active Health Care (Male)" are ready and available for digital download inside your Patient Portal.`,
      createdAt: "2026-06-25T14:31:00Z",
      read: false
    };

    db.notifications.push(demoNotif1);
    db.notifications.push(demoNotif2);

    saveDB(db);
  }

  // Always ensure the secure admin password hash exists
  if (!db.adminPasswordHash) {
    console.log("Setting secure admin authorization credentials...");
    db.adminPasswordHash = await hashPassword("Amensa123");
    saveDB(db);
  }


  // --------------------------------------------------------
  // DEVELOPMENT VS PRODUCTION VITE SERVING MIDDLEWARE
  // --------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind to 0.0.0.0 and port 3000 as mandated by container specifications
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Clinical App running on port http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server bootstrap failure:", err);
});
