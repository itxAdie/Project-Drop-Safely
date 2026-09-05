import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/drop-safely";
const SEED_DEMO = process.env.SEED_DEMO !== "false";

async function seed() {
  console.log("🌱 Starting database seed...\n");

  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB\n");

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection not established");
  }

  // ===== Create Admin User =====
  const usersCollection = db.collection("users");
  const existingAdmin = await usersCollection.findOne({ email: "admin@dropsafely.com" });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("Admin@123!", 12);
    await usersCollection.insertOne({
      phone: "+923000000000",
      email: "admin@dropsafely.com",
      passwordHash,
      role: "admin",
      isVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("✅ Admin user created (admin@dropsafely.com / Admin@123!)");
  } else {
    console.log("ℹ️  Admin user already exists");
  }

  // ===== Create Cities =====
  const citiesCollection = db.collection("cities");

  const cities = ["Lahore", "Okara"];
  const cityDocs: Record<string, mongoose.Types.ObjectId> = {};

  for (const cityName of cities) {
    const existing = await citiesCollection.findOne({ name: cityName });
    if (!existing) {
      const result = await citiesCollection.insertOne({
        name: cityName,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      cityDocs[cityName] = result.insertedId;
      console.log(`✅ City "${cityName}" created`);
    } else {
      cityDocs[cityName] = existing._id;
      console.log(`ℹ️  City "${cityName}" already exists`);
    }
  }

  // ===== Create Zones =====
  const zonesCollection = db.collection("zones");

  const zoneData = [
    {
      cityId: cityDocs["Lahore"],
      name: "DHA Zone",
      acPrice: 8000,
      nonAcPrice: 5000,
      commissionPercent: 15,
      platformFee: 100,
    },
    {
      cityId: cityDocs["Lahore"],
      name: "Johar Town Zone",
      acPrice: 7500,
      nonAcPrice: 4500,
      commissionPercent: 15,
      platformFee: 100,
    },
    {
      cityId: cityDocs["Okara"],
      name: "Okara Central",
      acPrice: 6000,
      nonAcPrice: 4000,
      commissionPercent: 12,
      platformFee: 80,
    },
  ];

  for (const zone of zoneData) {
    const existing = await zonesCollection.findOne({
      cityId: zone.cityId,
      name: zone.name,
    });
    if (!existing) {
      await zonesCollection.insertOne({
        ...zone,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Zone "${zone.name}" created`);
    } else {
      console.log(`ℹ️  Zone "${zone.name}" already exists`);
    }
  }

  // ===== Create Settings =====
  const settingsCollection = db.collection("settings");

  for (const cityName of cities) {
    const cityId = cityDocs[cityName];
    const existing = await settingsCollection.findOne({ cityId });
    if (!existing) {
      await settingsCollection.insertOne({
        cityId,
        clusterRadiusKm: 3,
        minStudentsPerRoute: 7,
        maxTimeSlots: 3,
        defaultCommissionPercent: 15,
        defaultPlatformFee: 100,
        paymentReminderDaysBefore: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Settings for "${cityName}" created`);
    } else {
      console.log(`ℹ️  Settings for "${cityName}" already exist`);
    }
  }

  // ===== Demo Data: Users / Drivers / Students / Routes / Trips / etc =====
  if (!SEED_DEMO) {
    console.log("ℹ️  Skipping demo data (SEED_DEMO=false)");
  } else {
  const demoPasswordHash = await bcrypt.hash("Demo@123!", 12);
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const now = new Date();

  const usersCollection = db.collection("users");
  const driversCollection = db.collection("drivers");
  const studentsCollection = db.collection("students");
  const routesCollection = db.collection("routes");
  const candidatesCollection = db.collection("routecandidates");
  const tripsCollection = db.collection("trips");
  const paymentsCollection = db.collection("payments");
  const notificationsCollection = db.collection("notifications");
  const gpsLocationsCollection = db.collection("gpslocations");
  const zonesCollection = db.collection("zones");

  // ── Demo Users ──────────────────────────────────────────────────────────
  const demoStudentPhones: Array<[string, string]> = [
    // Lahore DHA (7)
    ["03001110001", "Ahmed Khan"], ["03001110002", "Sarah Malik"],
    ["03001110003", "Hamza Sheikh"], ["03001110004", "Ayesha Siddiqui"],
    ["03001110005", "Bilal Ahmed"], ["03001110006", "Zainab Fatima"],
    ["03001110007", "Omar Farooq"],
    // Lahore DHA additional (5)
    ["03001110017", "Ibrahim Qureshi"], ["03001110018", "Hira Butt"],
    ["03001110019", "Danish Afzal"], ["03001110020", "Mehwish Iqbal"],
    ["03001110021", "Saadullah Niazi"],
    // Lahore Johar (5)
    ["03001110008", "Noor Jahan"], ["03001110009", "Hassan Ali"],
    ["03001110010", "Fatima Noor"], ["03001110022", "Aliya Rehman"],
    ["03001110023", "Kamran Saeed"],
    // Lahore unassigned (2)
    ["03001110011", "Talha Yousaf"], ["03001110024", "Rida Aslam"],
    // Faisalabad (7)
    ["03001110025", "Noman Akhtar"], ["03001110026", "Amina Bibi"],
    ["03001110027", "Waleed Khan"], ["03001110028", "Sana Malik"],
    ["03001110029", "Furqan Haider"], ["03001110030", "Nadia Parveen"],
    ["03001110031", "Zeeshan Raza"],
    // Okara (5)
    ["03001110012", "Muhammad Awais"], ["03001110013", "Rabia Anwar"],
    ["03001110014", "Shahid Mahmood"], ["03001110015", "Kiran Shahzadi"],
    ["03001110032", "Asad Ali"],
    // Okara unassigned (1)
    ["03001110016", "Usman Ghani"],
    // Faisalabad additional (5)
    ["03001110033", "Taimoor Javed"], ["03001110034", "Bushra Yaqoob"],
    ["03001110035", "Haris Nawaz"], ["03001110036", "Sobia Kouser"],
    ["03001110037", "Junaid Bhatti"],
    // Lahore additional unassigned (3)
    ["03001110038", "Maham Tariq"], ["03001110039", "Shoaib Mirza"],
    ["03001110040", "Amber Hayat"],
  ];
  const demoDriverPhones: Array<[string, string]> = [
    ["03002220001", "Muhammad Ahmed"], ["03002220002", "Ali Raza"],
    ["03002220003", "Usman Tariq"], ["03002220004", "Bilal Hussain"],
    ["03002220005", "Imran Khan"], ["03002220006", "Faisal Mehmood"],
    ["03002220007", "Saad Akhtar"], ["03002220008", "Hamid Nawaz"],
    ["03002220009", "Tariq Javed"], ["03002220010", "Rizwan Ahmed"],
  ];

  const demoUserIds: Record<string, mongoose.Types.ObjectId> = {};
  for (const [phone, label] of [...demoStudentPhones, ...demoDriverPhones]) {
    const role = demoDriverPhones.some(([p]) => p === phone) ? "driver" : "student";
    const existing = await usersCollection.findOne({ phone });
    if (!existing) {
      const r = await usersCollection.insertOne({
        phone,
        role,
        isVerified: true,
        isActive: true,
        passwordHash: demoPasswordHash,
        createdAt: now,
        updatedAt: now,
      });
      demoUserIds[phone] = r.insertedId;
      console.log(`✅ Demo user "${label}" (${role}) created — ${phone} / Demo@123!`);
    } else {
      demoUserIds[phone] = existing._id;
      console.log(`ℹ️  Demo user ${phone} already exists`);
    }
  }

  // ── Demo Drivers ────────────────────────────────────────────────────────
  const demoDrivers = [
    // Lahore (5)
    { phone: "03002220001", name: "Muhammad Ahmed", cnic: "35202-1234567-1", vehicleType: "ac_van", vehicleCapacity: 14, vehicleRegNumber: "LEA-2024-101", city: "Lahore", isApproved: true, status: "approved", currentLocation: [74.4105, 31.487] },
    { phone: "03002220002", name: "Ali Raza", cnic: "35202-7654321-1", vehicleType: "mini_bus", vehicleCapacity: 18, vehicleRegNumber: "LEA-2024-102", city: "Lahore", isApproved: true, status: "approved", currentLocation: [74.294, 31.485] },
    { phone: "03002220003", name: "Usman Tariq", cnic: "35202-1112223-3", vehicleType: "ac_van", vehicleCapacity: 14, vehicleRegNumber: "LEA-2024-103", city: "Lahore", isApproved: false, status: "pending", currentLocation: null },
    { phone: "03002220004", name: "Bilal Hussain", cnic: "35202-4445556-7", vehicleType: "non_ac_van", vehicleCapacity: 4, vehicleRegNumber: "LEA-2024-104", city: "Lahore", isApproved: true, status: "approved", currentLocation: [74.35, 31.52] },
    { phone: "03002220010", name: "Rizwan Ahmed", cnic: "35202-9988776-5", vehicleType: "ac_van", vehicleCapacity: 14, vehicleRegNumber: "LEA-2024-105", city: "Lahore", isApproved: true, status: "approved", currentLocation: [74.38, 31.51] },
    // Okara (2)
    { phone: "03002220005", name: "Imran Khan", cnic: "37302-1234567-1", vehicleType: "ac_van", vehicleCapacity: 14, vehicleRegNumber: "OKA-2024-201", city: "Okara", isApproved: true, status: "approved", currentLocation: [73.451, 30.8085] },
    { phone: "03002220006", name: "Faisal Mehmood", cnic: "37302-7654321-3", vehicleType: "mini_bus", vehicleCapacity: 18, vehicleRegNumber: "OKA-2024-202", city: "Okara", isApproved: true, status: "approved", currentLocation: [73.44, 30.82] },
    // Faisalabad (3)
    { phone: "03002220007", name: "Saad Akhtar", cnic: "36102-5566778-9", vehicleType: "mini_bus", vehicleCapacity: 20, vehicleRegNumber: "FSD-2024-301", city: "Faisalabad", isApproved: true, status: "approved", currentLocation: [73.082, 31.418] },
    { phone: "03002220008", name: "Hamid Nawaz", cnic: "36102-3344556-2", vehicleType: "ac_van", vehicleCapacity: 14, vehicleRegNumber: "FSD-2024-302", city: "Faisalabad", isApproved: true, status: "approved", currentLocation: [73.075, 31.425] },
    { phone: "03002220009", name: "Tariq Javed", cnic: "36102-8877665-4", vehicleType: "ac_van", vehicleCapacity: 12, vehicleRegNumber: "FSD-2024-303", city: "Faisalabad", isApproved: false, status: "pending", currentLocation: null },
  ];

  const driverIds: Record<string, mongoose.Types.ObjectId> = {};
  for (const d of demoDrivers) {
    const existing = await driversCollection.findOne({ cnic: d.cnic });
    if (!existing) {
      const result = await driversCollection.insertOne({
        userId: demoUserIds[d.phone],
        name: d.name,
        phone: d.phone,
        cnic: d.cnic,
        vehicleType: d.vehicleType,
        vehicleCapacity: d.vehicleCapacity,
        vehicleRegNumber: d.vehicleRegNumber,
        city: d.city,
        isApproved: d.isApproved,
        status: d.status,
        assignedRouteIds: [],
        currentLocation: d.currentLocation
          ? { type: "Point", coordinates: d.currentLocation as [number, number] }
          : undefined,
        lastLocationUpdate: d.currentLocation ? now : undefined,
        createdAt: now,
        updatedAt: now,
      });
      driverIds[d.phone] = result.insertedId;
      console.log(`✅ Demo driver "${d.name}" (${d.city}, ${d.status})`);
    } else {
      driverIds[d.phone] = existing._id;
      console.log(`ℹ️  Demo driver "cnic ${d.cnic}" already exists`);
    }
  }

  // ── Demo Students ───────────────────────────────────────────────────────
  const demoStudents = [
    // ── Lahore DHA ──
    { phone: "03001110001", name: "Ahmed Khan", parentPhone: "03211110001", coordinates: [74.4105, 31.4765], pickupAddress: "House 12, DHA Phase 5, Lahore", institute: "University of Punjab", city: "Lahore", classStartTime: "08:00", classEndTime: "14:00", routeKey: "dha", payment: "ac" },
    { phone: "03001110002", name: "Sarah Malik", parentPhone: "03211110002", coordinates: [74.4032, 31.4689], pickupAddress: "Flat 3B, Bahria Town, Lahore", institute: "University of Punjab", city: "Lahore", classStartTime: "08:00", classEndTime: "14:00", routeKey: "dha", payment: "ac" },
    { phone: "03001110003", name: "Hamza Sheikh", parentPhone: "03211110003", coordinates: [74.4168, 31.4821], pickupAddress: "House 89, DHA Phase 6, Lahore", institute: "COMSATS University", city: "Lahore", classStartTime: "08:00", classEndTime: "14:00", routeKey: "dha", payment: "ac" },
    { phone: "03001110004", name: "Ayesha Siddiqui", parentPhone: "03211110004", coordinates: [74.3984, 31.4712], pickupAddress: "House 45, DHA Phase 3, Lahore", institute: "University of Punjab", city: "Lahore", classStartTime: "08:00", classEndTime: "14:00", routeKey: "dha", payment: "nonAc" },
    { phone: "03001110005", name: "Bilal Ahmed", parentPhone: "03211110005", coordinates: [74.421, 31.494], pickupAddress: "Plot 7, Askari 10, Lahore", institute: "LUMS", city: "Lahore", classStartTime: "08:00", classEndTime: "14:00", routeKey: "dha", payment: "nonAc" },
    { phone: "03001110006", name: "Zainab Fatima", parentPhone: "03211110006", coordinates: [74.4082, 31.4651], pickupAddress: "House 210, DHA Phase 8, Lahore", institute: "University of Punjab", city: "Lahore", classStartTime: "13:00", classEndTime: "17:00", routeKey: "dha", payment: "nonAc" },
    { phone: "03001110007", name: "Omar Farooq", parentPhone: "03211110007", coordinates: [74.414, 31.4788], pickupAddress: "House 33, DHA Phase 4, Lahore", institute: "COMSATS University", city: "Lahore", classStartTime: "13:00", classEndTime: "16:30", routeKey: "dha", payment: "ac" },
    // ── Lahore DHA additional ──
    { phone: "03001110017", name: "Ibrahim Qureshi", parentPhone: "03211110017", coordinates: [74.4195, 31.4702], pickupAddress: "House 56, DHA Phase 2, Lahore", institute: "University of Punjab", city: "Lahore", classStartTime: "08:00", classEndTime: "14:00", routeKey: "dha", payment: "ac" },
    { phone: "03001110018", name: "Hira Butt", parentPhone: "03211110018", coordinates: [74.4068, 31.4882], pickupAddress: "House 101, DHA Phase 7, Lahore", institute: "COMSATS University", city: "Lahore", classStartTime: "08:00", classEndTime: "14:00", routeKey: "dha", payment: "nonAc" },
    { phone: "03001110019", name: "Danish Afzal", parentPhone: "03211110019", coordinates: [74.4125, 31.4638], pickupAddress: "House 78, DHA Phase 1, Lahore", institute: "LUMS", city: "Lahore", classStartTime: "08:00", classEndTime: "14:00", routeKey: "dha", payment: "ac" },
    { phone: "03001110020", name: "Mehwish Iqbal", parentPhone: "03211110020", coordinates: [74.3955, 31.4835], pickupAddress: "Flat 12C, DHA Phase 9, Lahore", institute: "University of Punjab", city: "Lahore", classStartTime: "13:00", classEndTime: "17:00", routeKey: "dha", payment: "nonAc" },
    { phone: "03001110021", name: "Saadullah Niazi", parentPhone: "03211110021", coordinates: [74.4225, 31.4748], pickupAddress: "House 23, DHA Phase 5, Lahore", institute: "LUMS", city: "Lahore", classStartTime: "08:00", classEndTime: "14:00", routeKey: "dha", payment: "ac" },

    // ── Lahore Johar Town ──
    { phone: "03001110008", name: "Noor Jahan", parentPhone: "03211110008", coordinates: [74.296, 31.482], pickupAddress: "Block F, Johar Town, Lahore", institute: "University of Punjab", city: "Lahore", classStartTime: "08:00", classEndTime: "14:00", routeKey: "johar", payment: "ac" },
    { phone: "03001110009", name: "Hassan Ali", parentPhone: "03211110009", coordinates: [74.289, 31.4865], pickupAddress: "Street 9, Township, Lahore", institute: "LUMS", city: "Lahore", classStartTime: "08:00", classEndTime: "14:00", routeKey: "johar", payment: "ac" },
    { phone: "03001110010", name: "Fatima Noor", parentPhone: "03211110010", coordinates: [74.3012, 31.4795], pickupAddress: "Block G, Johar Town, Lahore", institute: "COMSATS University", city: "Lahore", classStartTime: "08:00", classEndTime: "14:00", routeKey: "johar", payment: "nonAc" },
    { phone: "03001110022", name: "Aliya Rehman", parentPhone: "03211110022", coordinates: [74.2935, 31.4902], pickupAddress: "House 44, Block H, Johar Town, Lahore", institute: "University of Punjab", city: "Lahore", classStartTime: "08:00", classEndTime: "14:00", routeKey: "johar", payment: "ac" },
    { phone: "03001110023", name: "Kamran Saeed", parentPhone: "03211110023", coordinates: [74.3045, 31.477], pickupAddress: "Street 14, Township, Lahore", institute: "LUMS", city: "Lahore", classStartTime: "13:00", classEndTime: "17:00", routeKey: "johar", payment: "nonAc" },

    // ── Lahore unassigned ──
    { phone: "03001110011", name: "Talha Yousaf", parentPhone: "03211110011", coordinates: [74.285, 31.4705], pickupAddress: "Garden Apartments, Wapda Town, Lahore", institute: "University of Punjab", city: "Lahore", classStartTime: "16:00", classEndTime: "20:00", routeKey: null, payment: null, status: "pending" },
    { phone: "03001110024", name: "Rida Aslam", parentPhone: "03211110024", coordinates: [74.2798, 31.4655], pickupAddress: "House 15, Iqbal Town, Lahore", institute: "COMSATS University", city: "Lahore", classStartTime: "16:00", classEndTime: "20:00", routeKey: null, payment: null, status: "pending" },
    { phone: "03001110038", name: "Maham Tariq", parentPhone: "03211110038", coordinates: [74.2905, 31.4582], pickupAddress: "Flat 8, Garden Town, Lahore", institute: "LUMS", city: "Lahore", classStartTime: "16:00", classEndTime: "20:00", routeKey: null, payment: null, status: "pending" },
    { phone: "03001110039", name: "Shoaib Mirza", parentPhone: "03211110039", coordinates: [74.302, 31.4625], pickupAddress: "House 67, Canal Bank, Lahore", institute: "University of Punjab", city: "Lahore", classStartTime: "16:00", classEndTime: "20:00", routeKey: null, payment: null, status: "pending" },
    { phone: "03001110040", name: "Amber Hayat", parentPhone: "03211110040", coordinates: [74.2865, 31.4535], pickupAddress: "House 9, model Town, Lahore", institute: "COMSATS University", city: "Lahore", classStartTime: "16:00", classEndTime: "20:00", routeKey: null, payment: null, status: "pending" },

    // ── Faisalabad ──
    { phone: "03001110025", name: "Noman Akhtar", parentPhone: "03211110025", coordinates: [73.082, 31.408], pickupAddress: "House 12, D-Ground, Faisalabad", institute: "University of Faisalabad", city: "Faisalabad", classStartTime: "08:00", classEndTime: "14:00", routeKey: "fsd_canal", payment: "ac" },
    { phone: "03001110026", name: "Amina Bibi", parentPhone: "03211110026", coordinates: [73.075, 31.4145], pickupAddress: "House 34, Satiana Road, Faisalabad", institute: "GC University Faisalabad", city: "Faisalabad", classStartTime: "08:00", classEndTime: "14:00", routeKey: "fsd_canal", payment: "ac" },
    { phone: "03001110027", name: "Waleed Khan", parentPhone: "03211110027", coordinates: [73.088, 31.422], pickupAddress: "House 8, Madina Town, Faisalabad", institute: "University of Faisalabad", city: "Faisalabad", classStartTime: "08:00", classEndTime: "14:00", routeKey: "fsd_canal", payment: "nonAc" },
    { phone: "03001110028", name: "Sana Malik", parentPhone: "03211110028", coordinates: [73.0705, 31.4055], pickupAddress: "House 56, Canal Road, Faisalabad", institute: "GC University Faisalabad", city: "Faisalabad", classStartTime: "08:00", classEndTime: "14:00", routeKey: "fsd_canal", payment: "nonAc" },
    { phone: "03001110029", name: "Furqan Haider", parentPhone: "03211110029", coordinates: [73.095, 31.4175], pickupAddress: "House 22, Kohinoor Town, Faisalabad", institute: "University of Faisalabad", city: "Faisalabad", classStartTime: "08:00", classEndTime: "14:00", routeKey: "fsd_uni", payment: "ac" },
    { phone: "03001110030", name: "Nadia Parveen", parentPhone: "03211110030", coordinates: [73.0685, 31.4285], pickupAddress: "House 10, Jhang Road, Faisalabad", institute: "GC University Faisalabad", city: "Faisalabad", classStartTime: "08:00", classEndTime: "14:00", routeKey: "fsd_uni", payment: "nonAc" },
    { phone: "03001110031", name: "Zeeshan Raza", parentPhone: "03211110031", coordinates: [73.0775, 31.432], pickupAddress: "House 45, Ghulam Muhammad Abad, Faisalabad", institute: "University of Faisalabad", city: "Faisalabad", classStartTime: "08:00", classEndTime: "14:00", routeKey: "fsd_uni", payment: "ac" },
    { phone: "03001110033", name: "Taimoor Javed", parentPhone: "03211110033", coordinates: [73.064, 31.415], pickupAddress: "House 31, Wapda City, Faisalabad", institute: "University of Faisalabad", city: "Faisalabad", classStartTime: "13:00", classEndTime: "17:00", routeKey: "fsd_uni", payment: "ac" },
    { phone: "03001110034", name: "Bushra Yaqoob", parentPhone: "03211110034", coordinates: [73.081, 31.4365], pickupAddress: "House 18, Millat Town, Faisalabad", institute: "GC University Faisalabad", city: "Faisalabad", classStartTime: "13:00", classEndTime: "17:00", routeKey: "fsd_canal", payment: "nonAc" },
    { phone: "03001110035", name: "Haris Nawaz", parentPhone: "03211110035", coordinates: [73.073, 31.421], pickupAddress: "House 7, People's Colony, Faisalabad", institute: "University of Faisalabad", city: "Faisalabad", classStartTime: "08:00", classEndTime: "14:00", routeKey: "fsd_canal", payment: "ac" },
    { phone: "03001110036", name: "Sobia Kouser", parentPhone: "03211110036", coordinates: [73.0855, 31.41], pickupAddress: "House 90, Ghulam Muhammad Abad, Faisalabad", institute: "GC University Faisalabad", city: "Faisalabad", classStartTime: "08:00", classEndTime: "14:00", routeKey: "fsd_uni", payment: "nonAc" },
    { phone: "03001110037", name: "Junaid Bhatti", parentPhone: "03211110037", coordinates: [73.071, 31.433], pickupAddress: "House 5, D-Ground, Faisalabad", institute: "University of Faisalabad", city: "Faisalabad", classStartTime: "13:00", classEndTime: "17:00", routeKey: "fsd_uni", payment: "ac" },

    // ── Okara ──
    { phone: "03001110012", name: "Muhammad Awais", parentPhone: "03211110012", coordinates: [73.452, 30.807], pickupAddress: "House 5, Okara Cantt", institute: "University of Okara", city: "Okara", classStartTime: "08:00", classEndTime: "14:00", routeKey: "okara", payment: "ac" },
    { phone: "03001110013", name: "Rabia Anwar", parentPhone: "03211110013", coordinates: [73.4455, 30.8045], pickupAddress: "Street 2, Model Town Okara", institute: "University of Okara", city: "Okara", classStartTime: "08:00", classEndTime: "14:00", routeKey: "okara", payment: "ac" },
    { phone: "03001110014", name: "Shahid Mahmood", parentPhone: "03211110014", coordinates: [73.449, 30.8105], pickupAddress: "House 77, Sammundari Road", institute: "University of Okara", city: "Okara", classStartTime: "08:00", classEndTime: "14:00", routeKey: "okara", payment: "nonAc" },
    { phone: "03001110015", name: "Kiran Shahzadi", parentPhone: "03211110015", coordinates: [73.456, 30.801], pickupAddress: "House 4, Kutchehry Road", institute: "University of Okara", city: "Okara", classStartTime: "08:00", classEndTime: "14:00", routeKey: "okara", payment: "nonAc" },
    { phone: "03001110032", name: "Asad Ali", parentPhone: "03211110032", coordinates: [73.443, 30.813], pickupAddress: "House 28, Sialkot Road, Okara", institute: "University of Okara", city: "Okara", classStartTime: "08:00", classEndTime: "14:00", routeKey: "okara", payment: "ac" },
    // ── Okara unassigned ──
    { phone: "03001110016", name: "Usman Ghani", parentPhone: "03211110016", coordinates: [73.4505, 30.8125], pickupAddress: "Flat 2, Okara Cantt", institute: "University of Okara", city: "Okara", classStartTime: "16:00", classEndTime: "20:00", routeKey: null, payment: null, status: "pending" },
  ];

  const studentIds: Record<string, mongoose.Types.ObjectId> = {};
  for (const s of demoStudents) {
    const existing = await studentsCollection.findOne({ phone: s.phone });
    if (!existing) {
      const result = await studentsCollection.insertOne({
        userId: demoUserIds[s.phone],
        name: s.name,
        phone: s.phone,
        parentPhone: s.parentPhone,
        pickupLocation: { type: "Point", coordinates: s.coordinates },
        pickupAddress: s.pickupAddress,
        institute: s.institute,
        city: s.city,
        classStartTime: s.classStartTime,
        classEndTime: s.classEndTime,
        permanentOffDays: [],
        suddenOffDays: [],
        status: s.status ?? "active",
        paymentStatus: "pending",
        createdAt: now,
        updatedAt: now,
      });
      studentIds[s.phone] = result.insertedId;
      console.log(`✅ Demo student "${s.name}" (${s.city})`);
    } else {
      studentIds[s.phone] = existing._id;
      console.log(`ℹ️  Demo student "${s.name}" already exists`);
    }
  }

  // ── Demo Routes ─────────────────────────────────────────────────────────
  const zoneByName = new Map<string, mongoose.Types.ObjectId>();
  for (const zone of await zonesCollection.find({}).toArray()) {
    zoneByName.set(zone.name as string, zone._id as unknown as mongoose.Types.ObjectId);
  }

  const routeDefs = [
    {
      key: "dha",
      name: "DHA - Punjab University Route",
      city: "Lahore",
      zone: "DHA Zone",
      institutes: ["University of Punjab", "COMSATS University", "LUMS"],
      centroid: [74.4105, 31.487] as [number, number],
      timeSlots: ["morning"],
      driverPhone: "03002220001",
      studentPhones: ["03001110001", "03001110002", "03001110003", "03001110004", "03001110005", "03001110017", "03001110018", "03001110019", "03001110021"],
    },
    {
      key: "johar",
      name: "Johar Town - LUMS Route",
      city: "Lahore",
      zone: "Johar Town Zone",
      institutes: ["University of Punjab", "LUMS", "COMSATS University"],
      centroid: [74.294, 31.485] as [number, number],
      timeSlots: ["morning"],
      driverPhone: "03002220002",
      studentPhones: ["03001110008", "03001110009", "03001110010", "03001110022", "03001110023"],
    },
    {
      key: "okara",
      name: "Okara Central - University Road Route",
      city: "Okara",
      zone: "Okara Central",
      institutes: ["University of Okara"],
      centroid: [73.451, 30.8085] as [number, number],
      timeSlots: ["morning"],
      driverPhone: "03002220005",
      studentPhones: ["03001110012", "03001110013", "03001110014", "03001110015", "03001110032"],
    },
    {
      key: "dha_afternoon",
      name: "DHA Afternoon - COMSATS Route",
      city: "Lahore",
      zone: "DHA Zone",
      institutes: ["COMSATS University", "University of Punjab"],
      centroid: [74.408, 31.472] as [number, number],
      timeSlots: ["afternoon"],
      driverPhone: "03002220010",
      studentPhones: ["03001110006", "03001110007", "03001110020"],
    },
    {
      key: "fsd_canal",
      name: "Faisalabad Canal Road Route",
      city: "Faisalabad",
      zone: "Faisalabad Central",
      institutes: ["University of Faisalabad", "GC University Faisalabad"],
      centroid: [73.078, 31.415] as [number, number],
      timeSlots: ["morning"],
      driverPhone: "03002220007",
      studentPhones: ["03001110025", "03001110026", "03001110027", "03001110028", "03001110034", "03001110035"],
    },
    {
      key: "fsd_uni",
      name: "Faisalabad University Town Route",
      city: "Faisalabad",
      zone: "Faisalabad University Town",
      institutes: ["University of Faisalabad", "GC University Faisalabad"],
      centroid: [73.082, 31.425] as [number, number],
      timeSlots: ["morning", "afternoon"],
      driverPhone: "03002220008",
      studentPhones: ["03001110029", "03001110030", "03001110031", "03001110033", "03001110036", "03001110037"],
    },
  ];

  const routeIds: Record<string, mongoose.Types.ObjectId> = {};
  for (const routeDef of routeDefs) {
    const existing = await routesCollection.findOne({ name: routeDef.name });
    if (existing) {
      routeIds[routeDef.key] = existing._id;
      console.log(`ℹ️  Demo route "${routeDef.name}" already exists`);
      continue;
    }
    const assignedStudents = routeDef.studentPhones.map((p) => studentIds[p]).filter(Boolean);
    const driver = demoDrivers.find((d) => d.phone === routeDef.driverPhone)!;
    const result = await routesCollection.insertOne({
      name: routeDef.name,
      city: routeDef.city,
      zoneId: zoneByName.get(routeDef.zone),
      institutes: routeDef.institutes,
      centroid: { type: "Point", coordinates: routeDef.centroid },
      radiusKm: 3,
      timeSlots: routeDef.timeSlots,
      vans: [
        {
          driverId: driverIds[driver.phone],
          studentIds: assignedStudents,
          capacity: driver.vehicleCapacity,
          pickupSequence: [
            { type: "Point", coordinates: routeDef.centroid },
            { type: "Point", coordinates: [(routeDef.centroid[0] + 0.005), (routeDef.centroid[1] - 0.004)] },
          ],
        },
      ],
      totalStudents: assignedStudents.length,
      minStudents: 7,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    routeIds[routeDef.key] = result.insertedId;
    console.log(`✅ Demo route "${routeDef.name}" (${routeDef.city}, active, ${assignedStudents.length} students)`);

    // Point the assigned drivers + students back to the route
    await driversCollection.updateOne(
      { phone: driver.phone },
      { $set: { assignedRouteIds: [result.insertedId] } },
    );
    await studentsCollection.updateMany(
      { phone: { $in: routeDef.studentPhones } },
      {
        $set: {
          assignedRouteId: result.insertedId,
          status: "active",
          paymentStatus:
            demoStudents
              .filter((s) => routeDef.studentPhones.includes(s.phone))
              .find((s) => s.status === "pending")
              ? "pending"
              : "verified",
        },
      },
    );
  }

  // ── Demo Route Candidates ───────────────────────────────────────────────
  const candidateDefs = [
    {
      city: "Lahore",
      institutes: ["University of Punjab", "COMSATS University"],
      centroid: [74.406, 31.489] as [number, number],
      studentPhones: ["03001110007", "03001110011"],
      timeSlot: "afternoon",
      departureTime: "11:45 AM",
    },
    {
      city: "Okara",
      institutes: ["University of Okara"],
      centroid: [73.449, 30.815] as [number, number],
      studentPhones: ["03001110016"],
      timeSlot: "evening",
      departureTime: "04:30 PM",
    },
    {
      city: "Lahore",
      institutes: ["LUMS", "COMSATS University"],
      centroid: [74.288, 31.472] as [number, number],
      studentPhones: ["03001110024", "03001110038", "03001110039"],
      timeSlot: "evening",
      departureTime: "03:45 PM",
    },
    {
      city: "Faisalabad",
      institutes: ["University of Faisalabad"],
      centroid: [73.069, 31.41] as [number, number],
      studentPhones: ["03001110033", "03001110037"],
      timeSlot: "afternoon",
      departureTime: "11:30 AM",
    },
    {
      city: "Lahore",
      institutes: ["COMSATS University"],
      centroid: [74.282, 31.455] as [number, number],
      studentPhones: ["03001110040"],
      timeSlot: "evening",
      departureTime: "04:00 PM",
    },
    {
      city: "Okara",
      institutes: ["University of Okara"],
      centroid: [73.455, 30.81] as [number, number],
      studentPhones: ["03001110016"],
      timeSlot: "morning",
      departureTime: "07:15 AM",
    },
  ];

  for (const cand of candidateDefs) {
    const existing = await candidatesCollection.findOne({
      city: cand.city,
      timeSlot: cand.timeSlot,
      "centroid.coordinates": cand.centroid,
    });
    if (existing) {
      console.log(`ℹ️  Demo candidate for "${cand.city}" already exists`);
      continue;
    }
    await candidatesCollection.insertOne({
      city: cand.city,
      institutes: cand.institutes,
      centroid: { type: "Point", coordinates: cand.centroid },
      studentIds: cand.studentPhones.map((p) => studentIds[p]).filter(Boolean),
      suggestedSequence: [{ type: "Point", coordinates: cand.centroid }],
      matchCount: cand.studentPhones.length,
      timeSlot: cand.timeSlot,
      departureTime: cand.departureTime,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    console.log(`✅ Demo route candidate created for "${cand.city}" (${cand.timeSlot})`);
  }

  // ── Demo Trips (7-day window) ──────────────────────────────────────────
  const dayMs = 24 * 60 * 60 * 1000;
  const tripStatuses = ["completed", "completed", "completed", "completed", "completed", "in_progress", "scheduled"] as const;

  const tripDefs: Array<{
    routeKey: string;
    driverPhone: string;
    timeSlot: string;
    direction: string;
    dayOffset: number;
    status: (typeof tripStatuses)[number];
  }> = [];
  const activeRouteKeys = ["dha", "johar", "okara", "fsd_canal", "fsd_uni"];
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const status = tripStatuses[dayOffset];
    for (const routeKey of activeRouteKeys) {
      const routeDef = routeDefs.find((r) => r.key === routeKey)!;
      const ts = routeDef.timeSlots[0];
      tripDefs.push({ routeKey, driverPhone: routeDef.driverPhone, timeSlot: ts, direction: "pickup", dayOffset, status });
      tripDefs.push({ routeKey, driverPhone: routeDef.driverPhone, timeSlot: ts, direction: "dropoff", dayOffset, status: dayOffset === 0 ? "completed" : status });
    }
    // Afternoon trip for DHA
    if (dayOffset === 0) {
      tripDefs.push({ routeKey: "dha", driverPhone: "03002220001", timeSlot: "afternoon", direction: "pickup", dayOffset: 0, status: "scheduled" });
      tripDefs.push({ routeKey: "fsd_uni", driverPhone: "03002220008", timeSlot: "afternoon", direction: "pickup", dayOffset: 0, status: "scheduled" });
    }
  }

  let tripCount = 0;
  for (const trip of tripDefs) {
    const routeDef = routeDefs.find((r) => r.key === trip.routeKey)!;
    const tripDate = new Date(todayMidnight.getTime() + trip.dayOffset * dayMs);
    const existing = await tripsCollection.findOne({
      routeId: routeIds[trip.routeKey],
      driverId: driverIds[trip.driverPhone],
      date: tripDate,
      timeSlot: trip.timeSlot,
      direction: trip.direction,
    });
    if (existing) continue;
    const studentsArr = routeDef.studentPhones
      .map((p) => studentIds[p])
      .filter(Boolean)
      .map((sid) => ({
        studentId: sid,
        status: trip.status === "completed" ? "dropped_off" : "pending",
        droppedOffAt: trip.status === "completed" ? new Date(tripDate.getTime() + 60 * 60 * 1000) : undefined,
      }));
    await tripsCollection.insertOne({
      routeId: routeIds[trip.routeKey],
      driverId: driverIds[trip.driverPhone],
      date: tripDate,
      timeSlot: trip.timeSlot,
      direction: trip.direction,
      status: trip.status,
      students: studentsArr,
      gpsTrail: [],
      startedAt: trip.status === "in_progress" || trip.status === "completed" ? new Date(tripDate.getTime() - 30 * 60 * 1000) : undefined,
      completedAt: trip.status === "completed" ? new Date(tripDate.getTime() + 90 * 60 * 1000) : undefined,
      delayMinutes: trip.status === "in_progress" ? 5 : 0,
      createdAt: now,
      updatedAt: now,
    });
    tripCount++;
  }
  console.log(`✅ ${tripCount} demo trips created across 7-day window`);

  // ── Demo Payments (current billing cycle) ───────────────────────────────
  const billingStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const billingEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const priceOf = {
    dha: { ac: 8000, nonAc: 5000 },
    dha_afternoon: { ac: 7500, nonAc: 4500 },
    johar: { ac: 7500, nonAc: 4500 },
    okara: { ac: 6000, nonAc: 4000 },
    fsd_canal: { ac: 6500, nonAc: 4200 },
    fsd_uni: { ac: 6500, nonAc: 4200 },
  } as const;

  const paymentStatusFor: Record<string, "verified" | "submitted" | "pending" | "overdue"> = {
    "03001110001": "verified", "03001110002": "verified", "03001110003": "verified",
    "03001110004": "submitted", "03001110005": "pending", "03001110006": "overdue",
    "03001110007": "pending", "03001110008": "submitted", "03001110009": "pending",
    "03001110010": "overdue", "03001110012": "verified", "03001110013": "verified",
    "03001110014": "submitted", "03001110015": "pending",
    "03001110017": "verified", "03001110018": "verified", "03001110019": "submitted",
    "03001110020": "pending", "03001110021": "verified", "03001110022": "submitted",
    "03001110023": "pending", "03001110025": "verified", "03001110026": "verified",
    "03001110027": "submitted", "03001110028": "overdue", "03001110029": "verified",
    "03001110030": "submitted", "03001110031": "pending", "03001110032": "verified",
    "03001110033": "pending", "03001110034": "overdue", "03001110035": "verified",
    "03001110036": "submitted", "03001110037": "pending",
  };

  let paymentCount = 0;
  for (const s of demoStudents) {
    const status = paymentStatusFor[s.phone];
    if (!status) continue;
    const zoneKey = s.routeKey as keyof typeof priceOf;
    const zonePrices = priceOf[zoneKey];
    if (!zonePrices) continue;
    const amount = s.payment === "ac" ? zonePrices.ac : zonePrices.nonAc;

    const existing = await paymentsCollection.findOne({
      studentId: studentIds[s.phone],
      billingPeriodStart: billingStart,
    });
    if (existing) continue;
    await paymentsCollection.insertOne({
      studentId: studentIds[s.phone],
      routeId: routeIds[s.routeKey!],
      amount,
      platformFee: 100,
      billingPeriodStart: billingStart,
      billingPeriodEnd: billingEnd,
      receiptUrl: status === "verified" ? `https://res.cloudinary.com/dev-cloud/image/upload/v1/demo/receipts/${s.phone}.jpg` : undefined,
      status,
      verifiedBy: status === "verified" ? await usersCollection.findOne({ email: "admin@dropsafely.com" }).then((u) => u?._id) : undefined,
      verifiedAt: status === "verified" ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) : undefined,
      remindersSent: status === "overdue" ? 3 : 0,
      createdAt: now,
      updatedAt: now,
    });
    await studentsCollection.updateOne(
      { phone: s.phone },
      { $set: { paymentStatus: status } },
    );
    paymentCount++;
  }
  console.log(`✅ ${paymentCount} demo payments created`);

  // ── Demo Notifications ──────────────────────────────────────────────────
  const demoNotifExists = await notificationsCollection.findOne({ "metadata.demo": true });
  if (!demoNotifExists) {
    const dh = (phone: string) => demoUserIds[phone];
    const notifs = [
      { recipientId: dh("03001110001"), channel: "in_app", type: "payment_reminder", title: "Fee Reminder", body: "Your transport fee for this month is due. Please submit your receipt.", metadata: { demo: true, ref: "payment" } },
      { recipientId: dh("03001110001"), channel: "whatsapp", type: "pickup", title: "Van is on the way", body: "Your van will arrive in approx. 10 minutes. Please be ready.", metadata: { demo: true } },
      { recipientId: dh("03001110012"), channel: "in_app", type: "payment_verified", title: "Payment Verified", body: "Your transport fee has been verified by the admin.", metadata: { demo: true } },
      { recipientId: dh("03002220001"), channel: "in_app", type: "driver_approved", title: "Profile Approved", body: "Congratulations! Your driver profile has been approved.", metadata: { demo: true } },
      { recipientId: dh("03002220001"), channel: "in_app", type: "trip_started", title: "Morning trip started", body: "Your morning pickup trip has started on DHA - Punjab University Route.", metadata: { demo: true } },
      { recipientId: dh("03002220005"), channel: "in_app", type: "route_assigned", title: "Route Assigned", body: "You have been assigned to Okara Central - University Road Route.", metadata: { demo: true } },
      { recipientId: dh("03001110025"), channel: "in_app", type: "payment_reminder", title: "Fee Reminder", body: "Your Faisalabad transport fee is due. Please submit your receipt.", metadata: { demo: true } },
      { recipientId: dh("03001110025"), channel: "whatsapp", type: "pickup", title: "Bus approaching", body: "Your bus is 5 minutes away from Canal Road pickup point.", metadata: { demo: true } },
      { recipientId: dh("03002220007"), channel: "in_app", type: "driver_approved", title: "Driver Approved", body: "Your profile has been approved. You can now start accepting routes.", metadata: { demo: true } },
      { recipientId: dh("03002220007"), channel: "in_app", type: "route_assigned", title: "New Route", body: "You have been assigned to Faisalabad Canal Road Route.", metadata: { demo: true } },
      { recipientId: dh("03002220008"), channel: "in_app", type: "route_assigned", title: "New Route", body: "You have been assigned to Faisalabad University Town Route.", metadata: { demo: true } },
      { recipientId: dh("03001110017"), channel: "whatsapp", type: "payment_verified", title: "Payment Confirmed", body: "Your payment has been verified. Have a safe trip!", metadata: { demo: true } },
      { recipientId: dh("03001110029"), channel: "in_app", type: "payment_verified", title: "Payment Verified", body: "Your University Town route payment has been verified.", metadata: { demo: true } },
      { recipientId: dh("03001110011"), channel: "in_app", type: "route_candidate", title: "Route Available", body: "A new route near your area may become available. Stay tuned!", metadata: { demo: true } },
      { recipientId: dh("03001110038"), channel: "in_app", type: "route_candidate", title: "Route Available", body: "A new evening route for LUMS students is being planned.", metadata: { demo: true } },
      { recipientId: dh("03001110034"), channel: "in_app", type: "payment_reminder", title: "Fee Overdue", body: "Your transport fee is overdue. Please submit payment to avoid service interruption.", metadata: { demo: true } },
      { recipientId: dh("03001110010"), channel: "in_app", type: "payment_reminder", title: "Fee Overdue", body: "Your Johar Town route payment is overdue. Please submit immediately.", metadata: { demo: true } },
      { recipientId: dh("03001110009"), channel: "whatsapp", type: "pickup", title: "Van arriving", body: "Your van will reach Township in 8 minutes.", metadata: { demo: true } },
    ];
    for (const n of notifs) {
      await notificationsCollection.insertOne({ ...n, isRead: false, sentAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), createdAt: now, updatedAt: now });
    }
    console.log(`✅ ${notifs.length} demo notifications created`);
  } else {
    console.log("ℹ️  Demo notifications already exist");
  }

  // ── Demo GPS Locations (last 24h, 6 drivers) ───────────────────────────
  const gpsPhones = ["03002220001", "03002220002", "03002220005", "03002220007", "03002220008", "03002220010"];
  const gpsDriverIds = gpsPhones.filter((p) => driverIds[p]).map((p) => driverIds[p]);
  const existingGps = await gpsLocationsCollection.countDocuments({ driverId: { $in: gpsDriverIds } });
  if (existingGps === 0) {
    const gpsPoints = [
      // Lahore DHA driver 001
      { phone: "03002220001", coords: [74.408, 31.485] as [number, number], speed: 22 },
      { phone: "03002220001", coords: [74.414, 31.479] as [number, number], speed: 28 },
      { phone: "03002220001", coords: [74.420, 31.475] as [number, number], speed: 25 },
      { phone: "03002220001", coords: [74.415, 31.471] as [number, number], speed: 30 },
      // Lahore Johar driver 002
      { phone: "03002220002", coords: [74.296, 31.483] as [number, number], speed: 20 },
      { phone: "03002220002", coords: [74.291, 31.487] as [number, number], speed: 24 },
      { phone: "03002220002", coords: [74.287, 31.490] as [number, number], speed: 26 },
      { phone: "03002220002", coords: [74.284, 31.485] as [number, number], speed: 22 },
      // Okara driver 005
      { phone: "03002220005", coords: [73.451, 30.809] as [number, number], speed: 18 },
      { phone: "03002220005", coords: [73.447, 30.811] as [number, number], speed: 21 },
      { phone: "03002220005", coords: [73.443, 30.808] as [number, number], speed: 19 },
      { phone: "03002220005", coords: [73.440, 30.805] as [number, number], speed: 23 },
      // Faisalabad Canal driver 007
      { phone: "03002220007", coords: [73.082, 31.418] as [number, number], speed: 27 },
      { phone: "03002220007", coords: [73.078, 31.415] as [number, number], speed: 30 },
      { phone: "03002220007", coords: [73.074, 31.412] as [number, number], speed: 25 },
      { phone: "03002220007", coords: [73.071, 31.409] as [number, number], speed: 28 },
      // Faisalabad Uni driver 008
      { phone: "03002220008", coords: [73.075, 31.425] as [number, number], speed: 15 },
      { phone: "03002220008", coords: [73.079, 31.428] as [number, number], speed: 20 },
      { phone: "03002220008", coords: [73.083, 31.431] as [number, number], speed: 18 },
      { phone: "03002220008", coords: [73.080, 31.435] as [number, number], speed: 22 },
      // Lahore DHA driver 010
      { phone: "03002220010", coords: [74.380, 31.510] as [number, number], speed: 24 },
      { phone: "03002220010", coords: [74.385, 31.505] as [number, number], speed: 26 },
      { phone: "03002220010", coords: [74.390, 31.500] as [number, number], speed: 22 },
      { phone: "03002220010", coords: [74.395, 31.495] as [number, number], speed: 28 },
      { phone: "03002220010", coords: [74.400, 31.490] as [number, number], speed: 25 },
      { phone: "03002220001", coords: [74.405, 31.468] as [number, number], speed: 27 },
      { phone: "03002220002", coords: [74.282, 31.492] as [number, number], speed: 19 },
      { phone: "03002220005", coords: [73.438, 30.803] as [number, number], speed: 20 },
      { phone: "03002220007", coords: [73.068, 31.406] as [number, number], speed: 23 },
      { phone: "03002220008", coords: [73.076, 31.432] as [number, number], speed: 17 },
    ];
    for (let i = 0; i < gpsPoints.length; i++) {
      const p = gpsPoints[i];
      if (!driverIds[p.phone]) continue;
      await gpsLocationsCollection.insertOne({
        driverId: driverIds[p.phone],
        location: { type: "Point", coordinates: p.coords },
        speed: p.speed,
        timestamp: new Date(now.getTime() - (gpsPoints.length - i) * 10 * 60 * 1000),
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`✅ ${gpsPoints.length} demo GPS locations created`);
  } else {
    console.log(`ℹ️  Demo GPS locations already exist (${existingGps})`);
  }

  // ===== Seed FAQs =====
  const faqsCollection = db.collection("faqs");
  const existingFaqs = await faqsCollection.countDocuments();
  if (existingFaqs === 0) {
    const demoFaqs = [
      { question: "Is Drop Safely only for female students?", answer: "Yes. Our initial launch is focused on female university and college students." },
      { question: "Which universities are supported?", answer: "We are starting with selected universities and colleges in Lahore and expanding based on student demand." },
      { question: "How much will it cost?", answer: "Pricing will depend on your area and route distance. Students who register will receive early pricing information." },
      { question: "Can students from the same area travel together?", answer: "Yes. Our goal is to create shared routes for female students living in nearby areas." },
      { question: "When will routes start?", answer: "Routes are activated based on the number of interested students in a specific area." },
      { question: "Is my personal information safe?", answer: "Yes. Your details are kept private and only used to coordinate your route. We never share your information with third parties." },
      { question: "Can my parents track my route?", answer: "Absolutely. Every ride includes live GPS tracking and automated alerts so your parents know exactly when you leave and arrive safely." },
      { question: "What happens if I miss my ride?", answer: "Our drivers and coordinators work with fixed pickup times. If you miss a ride, contact our support team and we will arrange the next available pickup for you." },
    ];
    for (let i = 0; i < demoFaqs.length; i++) {
      await faqsCollection.insertOne({
        question: demoFaqs[i].question,
        answer: demoFaqs[i].answer,
        order: i,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    console.log(`✅ ${demoFaqs.length} demo FAQs created`);
  } else {
    console.log(`ℹ️  FAQs already exist (${existingFaqs})`);
  }

  } // end SEED_DEMO block

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n🔑 Demo Accounts (password: Demo@123!):");
  console.log("   Admin:   admin@dropsafely.com / Admin@123!");
  console.log("   Driver:  Muhammad Ahmed     03002220001 / Demo@123!");
  console.log("   Driver:  Ali Raza           03002220002 / Demo@123!");
  console.log("   Student: Ahmed Khan         03001110001 / Demo@123!");
  console.log("   Student: Sarah Malik        03001110002 / Demo@123!");
  console.log("   (All demo accounts log in via phone OTP — password shown for reference.)");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
