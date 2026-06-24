require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Doctor = require('./models/Doctor');
const Bed = require('./models/Bed');
const Medicine = require('./models/Medicine');
const Staff = require('./models/Staff');
const Patient = require('./models/Patient');
const Prescription = require('./models/Prescription');
const MedicineSale = require('./models/MedicineSale');

async function seed() {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartcare_hms';
        await mongoose.connect(mongoURI);
        console.log('\n✅ Connected to MongoDB...\n');

        await mongoose.connection.db.dropDatabase();
        console.log('🗑️  Database cleared.\n');

        const salt = await bcrypt.genSalt(10);
        const hashOf = (pw) => bcrypt.hash(pw, salt);

        // ─────────────────────────────────────────────────────────────
        // 1. DOCTORS — 10 doctors with full profiles
        // ─────────────────────────────────────────────────────────────
        const doctorPw = await hashOf('doctor123');

        const doctorsData = [
            {
                doctorId: 'DOC-101',
                name: 'Dr. Arjun Mehta',
                specialization: 'Cardiology',
                experience: 14,
                qualifications: 'MBBS, MD (Cardiology), FACC',
                contactNumber: '9876500101',
                address: 'Flat 3B, Sunrise Apts, Bandra West, Mumbai',
                aadhar: '1234-5678-0101',
                cabin: 'Cabin A (Room 101)',
                fee: 900,
                about: 'Dr. Arjun Mehta is a senior cardiologist with 14 years of experience in interventional cardiology and echocardiography.',
                password: doctorPw,
                plainPassword: 'doctor123',
                isActive: true
            },
            {
                doctorId: 'DOC-102',
                name: 'Dr. Priya Nair',
                specialization: 'Neurology',
                experience: 11,
                qualifications: 'MBBS, DM (Neurology)',
                contactNumber: '9876500102',
                address: 'House 12, Lake View Colony, Pune',
                aadhar: '1234-5678-0102',
                cabin: 'Cabin B (Room 102)',
                fee: 750,
                about: 'Dr. Priya Nair specializes in headache disorders, epilepsy, and stroke management with 11 years of clinical expertise.',
                password: doctorPw,
                plainPassword: 'doctor123',
                isActive: true
            },
            {
                doctorId: 'DOC-103',
                name: 'Dr. Suresh Iyer',
                specialization: 'General Physician',
                experience: 8,
                qualifications: 'MBBS, MD (General Medicine)',
                contactNumber: '9876500103',
                address: 'Plot 7, Green Park, Chennai',
                aadhar: '1234-5678-0103',
                cabin: 'Cabin C (Room 103)',
                fee: 450,
                about: 'Dr. Suresh Iyer is a general physician experienced in managing chronic diseases, fever, and infectious diseases.',
                password: doctorPw,
                plainPassword: 'doctor123',
                isActive: true
            },
            {
                doctorId: 'DOC-104',
                name: 'Dr. Kavya Reddy',
                specialization: 'Pediatrics',
                experience: 9,
                qualifications: 'MBBS, MD (Pediatrics), DCH',
                contactNumber: '9876500104',
                address: '22A, Garden Estate, Hyderabad',
                aadhar: '1234-5678-0104',
                cabin: 'Cabin D (Room 104)',
                fee: 600,
                about: 'Dr. Kavya Reddy is a compassionate pediatrician with expertise in newborn care, childhood diseases, and vaccinations.',
                password: doctorPw,
                plainPassword: 'doctor123',
                isActive: true
            },
            {
                doctorId: 'DOC-105',
                name: 'Dr. Rahul Sharma',
                specialization: 'Orthopedics',
                experience: 13,
                qualifications: 'MBBS, MS (Orthopedics), DNB',
                contactNumber: '9876500105',
                address: 'Block C-5, Sector 18, Noida',
                aadhar: '1234-5678-0105',
                cabin: 'Cabin E (Room 105)',
                fee: 800,
                about: 'Dr. Rahul Sharma is an orthopedic surgeon specializing in joint replacement, sports injuries, and spine disorders.',
                password: doctorPw,
                plainPassword: 'doctor123',
                isActive: true
            },
            {
                doctorId: 'DOC-106',
                name: 'Dr. Ananya Singh',
                specialization: 'Dermatology',
                experience: 7,
                qualifications: 'MBBS, MD (Dermatology)',
                contactNumber: '9876500106',
                address: '8, Residency Road, Bengaluru',
                aadhar: '1234-5678-0106',
                cabin: 'Cabin F (Room 106)',
                fee: 650,
                about: 'Dr. Ananya Singh is a dermatologist with expertise in acne, eczema, psoriasis, and cosmetic dermatology.',
                password: doctorPw,
                plainPassword: 'doctor123',
                isActive: false
            },
            {
                doctorId: 'DOC-107',
                name: 'Dr. Vikram Patel',
                specialization: 'Gastroenterology',
                experience: 16,
                qualifications: 'MBBS, MD, DM (Gastroenterology)',
                contactNumber: '9876500107',
                address: 'Tower B, Prestige Towers, Ahmedabad',
                aadhar: '1234-5678-0107',
                cabin: 'Cabin G (Room 107)',
                fee: 850,
                about: 'Dr. Vikram Patel is a senior gastroenterologist with 16 years of experience in endoscopy and liver disorders.',
                password: doctorPw,
                plainPassword: 'doctor123',
                isActive: true
            },
            {
                doctorId: 'DOC-108',
                name: 'Dr. Meera Joshi',
                specialization: 'Gynecology',
                experience: 12,
                qualifications: 'MBBS, MS (OB-GYN)',
                contactNumber: '9876500108',
                address: '14, Heritage Lane, Jaipur',
                aadhar: '1234-5678-0108',
                cabin: 'Cabin H (Room 108)',
                fee: 700,
                about: 'Dr. Meera Joshi is a gynecologist experienced in high-risk pregnancies, laparoscopic surgeries, and women\'s health.',
                password: doctorPw,
                plainPassword: 'doctor123',
                isActive: true
            },
            {
                doctorId: 'DOC-109',
                name: 'Dr. Kiran Desai',
                specialization: 'Ophthalmology',
                experience: 10,
                qualifications: 'MBBS, MS (Ophthalmology), FICO',
                contactNumber: '9876500109',
                address: '5, Lotus Tower, Surat',
                aadhar: '1234-5678-0109',
                cabin: 'Cabin I (Room 109)',
                fee: 600,
                about: 'Dr. Kiran Desai is an ophthalmologist specializing in cataract surgeries, LASIK, and retinal disorders.',
                password: doctorPw,
                plainPassword: 'doctor123',
                isActive: true
            },
            {
                doctorId: 'DOC-110',
                name: 'Dr. Aditya Bansal',
                specialization: 'ENT (Ear, Nose & Throat)',
                experience: 6,
                qualifications: 'MBBS, MS (ENT)',
                contactNumber: '9876500110',
                address: 'Wing D, Harmony Heights, Kolkata',
                aadhar: '1234-5678-0110',
                cabin: 'Cabin J (Room 110)',
                fee: 550,
                about: 'Dr. Aditya Bansal is an ENT specialist with expertise in sinusitis, hearing loss, tonsillitis, and endoscopic sinus surgery.',
                password: doctorPw,
                plainPassword: 'doctor123',
                isActive: true
            }
        ];

        const savedDoctors = await Doctor.insertMany(doctorsData);
        console.log(`👨‍⚕️  ${savedDoctors.length} Doctors seeded.`);

        // ─────────────────────────────────────────────────────────────
        // 2. STAFF — Admin, Receptionist, Pharmacist with full profiles
        // ─────────────────────────────────────────────────────────────
        const adminPw     = await hashOf('admin@123');
        const recPw       = await hashOf('recep@123');
        const pharmPw     = await hashOf('pharma@123');

        const staffData = [
            {
                staffId: 'ADM-001',
                name: 'Rajesh Kumar',
                role: 'admin',
                contactNumber: '9900001111',
                address: 'H-Block, Staff Quarters, City Hospital Campus, Mumbai',
                aadhar: '9999-8888-0001',
                password: adminPw,
                plainPassword: 'admin@123'
            },
            {
                staffId: 'REC-001',
                name: 'Neha Sharma',
                role: 'receptionist',
                contactNumber: '9900002222',
                address: 'B-12, Andheri East, Mumbai',
                aadhar: '9999-8888-0002',
                password: recPw,
                plainPassword: 'recep@123'
            },
            {
                staffId: 'PHA-001',
                name: 'Sunil Verma',
                role: 'pharmacy',
                contactNumber: '9900003333',
                address: 'Room 4, Staff Hostel, Bhandup, Mumbai',
                aadhar: '9999-8888-0003',
                password: pharmPw,
                plainPassword: 'pharma@123'
            }
        ];

        await Staff.insertMany(staffData);
        console.log('👩‍💼  Staff (Admin + Receptionist + Pharmacist) seeded.');

        // ─────────────────────────────────────────────────────────────
        // 3. BEDS
        // ─────────────────────────────────────────────────────────────
        const beds = [];
        for (let i = 1; i <= 10; i++) beds.push({ bedId: `ICU-${String(i).padStart(2,'0')}`, zone: 'ICU', status: 'free' });
        for (let i = 1; i <= 50; i++) beds.push({ bedId: `GW-${String(i).padStart(2,'0')}`,  zone: 'General', status: 'free' });
        for (let i = 1; i <= 15; i++) beds.push({ bedId: `PR-${String(i).padStart(2,'0')}`,  zone: 'Private', status: 'free' });
        await Bed.insertMany(beds);
        console.log('🛏️   75 Beds seeded (10 ICU + 50 General + 15 Private).');

        // ─────────────────────────────────────────────────────────────
        // 4. MEDICINES
        // ─────────────────────────────────────────────────────────────
        const medicines = [
            { name: 'Paracetamol',    stock: 500, price: 10,  illness: 'Fever',               category: 'Daily',     salesPerDay: 50 },
            { name: 'Amoxicillin',    stock: 200, price: 50,  illness: 'Bacterial Infection',  category: 'Normal',    salesPerDay: 20 },
            { name: 'Cetirizine',     stock: 300, price: 5,   illness: 'Allergy',              category: 'Daily',     salesPerDay: 30 },
            { name: 'Ibuprofen',      stock: 400, price: 15,  illness: 'Pain / Inflammation',  category: 'Normal',    salesPerDay: 35 },
            { name: 'Cough Syrup',    stock: 100, price: 80,  illness: 'Cough & Cold',         category: 'Normal',    salesPerDay: 15 },
            { name: 'Metformin',      stock: 250, price: 20,  illness: 'Diabetes',             category: 'Daily',     salesPerDay: 25 },
            { name: 'Atorvastatin',   stock: 180, price: 40,  illness: 'High Cholesterol',     category: 'Daily',     salesPerDay: 18 },
            { name: 'Pantoprazole',   stock: 220, price: 25,  illness: 'Acidity / GERD',       category: 'Daily',     salesPerDay: 22 },
            { name: 'Azithromycin',   stock: 150, price: 60,  illness: 'Bacterial Infection',  category: 'Normal',    salesPerDay: 12 },
            { name: 'Adrenaline Inj', stock: 30,  price: 250, illness: 'Anaphylaxis',          category: 'Emergency', salesPerDay: 2  }
        ];
        await Medicine.insertMany(medicines);
        console.log('💊  10 Medicines seeded.');

        // ─────────────────────────────────────────────────────────────
        // 5. PATIENTS — 3 patients, one in each key state
        // ─────────────────────────────────────────────────────────────
        const patientPw = await hashOf('patient@123');

        const doc1 = savedDoctors[0]; // DOC-101 Arjun Mehta - Cardiology
        const doc2 = savedDoctors[1]; // DOC-102 Priya Nair  - Neurology
        const doc3 = savedDoctors[2]; // DOC-103 Suresh Iyer - General

        const now = new Date();
        const hoursAgo = (h) => new Date(now.getTime() - h * 60 * 60 * 1000);

        const patientsData = [
            // Patient 1 — status: 'waiting' (just registered, in queue)
            {
                token: 1,
                patientId: 'PID-1001',
                name: 'Mohammed Raza',
                age: 28,
                gender: 'Male',
                contact: '9812345678',
                address: 'B-204, Al-Noor Apartments, Bandra, Mumbai',
                aadhar: '2222-3333-4444',
                problem: 'High fever and body ache since 2 days',
                assignedDoctor: doc1._id,
                bp: '118/76',
                weight: '70',
                height: '175',
                temperature: '102.4°F',
                oxygenLevel: '97%',
                pulseRate: '96 bpm',
                vitalsNotes: 'Patient appears fatigued. Complains of headache.',
                priority: 'normal',
                status: 'waiting',
                password: patientPw,
                createdAt: hoursAgo(1)
            },
            // Patient 2 — status: 'prescribed' (doctor seen, pharmacy pending)
            {
                token: 2,
                patientId: 'PID-1002',
                name: 'Sunita Agarwal',
                age: 45,
                gender: 'Female',
                contact: '9823456789',
                address: 'House 7, Shastri Nagar, Lucknow',
                aadhar: '3333-4444-5555',
                problem: 'Chronic migraine with nausea and vomiting',
                assignedDoctor: doc2._id,
                bp: '130/85',
                weight: '65',
                height: '158',
                temperature: '98.8°F',
                oxygenLevel: '99%',
                pulseRate: '78 bpm',
                vitalsNotes: 'Patient is on regular migraine medication. History of vertigo.',
                priority: 'normal',
                status: 'prescribed',
                inCabin: false,
                consultedAt: hoursAgo(0.5),
                password: patientPw,
                createdAt: hoursAgo(2)
            },
            // Patient 3 — status: 'completed' (full cycle done)
            {
                token: 3,
                patientId: 'PID-1003',
                name: 'Deepak Choudhary',
                age: 60,
                gender: 'Male',
                contact: '9834567890',
                address: '15, Civil Lines, Jaipur',
                aadhar: '4444-5555-6666',
                problem: 'Type 2 Diabetes follow-up and blood sugar check',
                assignedDoctor: doc3._id,
                bp: '145/92',
                weight: '85',
                height: '168',
                temperature: '98.4°F',
                oxygenLevel: '96%',
                pulseRate: '82 bpm',
                vitalsNotes: 'Blood sugar reported at 220 mg/dL fasting. On Metformin since 5 years.',
                priority: 'normal',
                status: 'completed',
                inCabin: false,
                consultedAt: hoursAgo(3),
                completedAt: hoursAgo(2.5),
                paymentStatus: 'Paid',
                password: patientPw,
                createdAt: hoursAgo(4)
            }
        ];

        const savedPatients = await Patient.insertMany(patientsData);
        console.log(`🤒  ${savedPatients.length} Patients seeded.`);

        // ─────────────────────────────────────────────────────────────
        // 6. PRESCRIPTIONS — for patients 2 and 3
        // ─────────────────────────────────────────────────────────────
        const p2 = savedPatients.find(p => p.name === 'Sunita Agarwal');
        const p3 = savedPatients.find(p => p.name === 'Deepak Choudhary');

        const prescriptionsData = [
            {
                patientId: p2._id,
                doctorId: doc2._id,
                reportId: 'REP-200001',
                medicines: [
                    { medicineName: 'Ibuprofen',   dosage: '1-0-1', duration: '3 days',  instructions: 'After meals' },
                    { medicineName: 'Pantoprazole', dosage: '1-0-0', duration: '5 days',  instructions: 'Before breakfast' }
                ],
                notes: 'Avoid bright lights and screen. Rest in dark room during migraine episode. Review after 1 week.',
                createdAt: p2.consultedAt
            },
            {
                patientId: p3._id,
                doctorId: doc3._id,
                reportId: 'REP-200002',
                medicines: [
                    { medicineName: 'Metformin',     dosage: '1-0-1', duration: '30 days', instructions: 'With meals' },
                    { medicineName: 'Atorvastatin',  dosage: '0-0-1', duration: '30 days', instructions: 'At night' },
                    { medicineName: 'Pantoprazole',  dosage: '1-0-0', duration: '15 days', instructions: 'Empty stomach' }
                ],
                notes: 'HbA1c test advised. Strict low-carb diet. Walk 30 mins daily. Follow up in 1 month.',
                createdAt: p3.consultedAt
            }
        ];

        await Prescription.insertMany(prescriptionsData);
        console.log('📋  Prescriptions seeded for Patients 2 & 3.');

        // ─────────────────────────────────────────────────────────────
        // 7. MEDICINE SALES — sample pharmacy transactions
        // ─────────────────────────────────────────────────────────────
        const salesData = [
            { medicineName: 'Ibuprofen',    quantity: 6,  pricePerUnit: 15, totalPrice: 90,  soldAt: hoursAgo(2)  },
            { medicineName: 'Pantoprazole', quantity: 10, pricePerUnit: 25, totalPrice: 250, soldAt: hoursAgo(2)  },
            { medicineName: 'Metformin',    quantity: 30, pricePerUnit: 20, totalPrice: 600, soldAt: hoursAgo(2.5) },
            { medicineName: 'Atorvastatin', quantity: 30, pricePerUnit: 40, totalPrice: 1200, soldAt: hoursAgo(2.5) },
            { medicineName: 'Paracetamol',  quantity: 10, pricePerUnit: 10, totalPrice: 100, soldAt: hoursAgo(5)  },
            { medicineName: 'Cetirizine',   quantity: 15, pricePerUnit: 5,  totalPrice: 75,  soldAt: hoursAgo(6)  }
        ];
        await MedicineSale.insertMany(salesData);
        console.log('💰  Medicine sales seeded.');

        // ─────────────────────────────────────────────────────────────
        // PRINT CREDENTIALS TABLE
        // ─────────────────────────────────────────────────────────────
        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════════════════');
        console.log('                    🏥  MediPulse — TEST CREDENTIALS                  ');
        console.log('═══════════════════════════════════════════════════════════════════════');

        console.log('\n📋  ADMIN / STAFF LOGIN  (Login Page → select role)');
        console.log('───────────────────────────────────────────────────────────────────────');
        console.log('  Role           │ Staff ID    │ Name            │ Password   │ Page');
        console.log('───────────────────────────────────────────────────────────────────────');
        console.log('  Admin          │ ADM-001     │ Rajesh Kumar    │ admin@123  │ /9admin_dashboard.html');
        console.log('  Receptionist   │ REC-001     │ Neha Sharma     │ recep@123  │ /2patient.html');
        console.log('  Pharmacist     │ PHA-001     │ Sunil Verma     │ pharma@123 │ /5medicine.html');

        console.log('\n👨‍⚕️  DOCTORS LOGIN  (Login Page → Doctor role)');
        console.log('───────────────────────────────────────────────────────────────────────');
        console.log('  Doctor ID  │ Name                  │ Specialization        │ Password ');
        console.log('───────────────────────────────────────────────────────────────────────');
        doctorsData.forEach(d => {
            const id   = d.doctorId.padEnd(10);
            const name = d.name.padEnd(22);
            const spec = d.specialization.padEnd(22);
            console.log(`  ${id} │ ${name} │ ${spec} │ doctor123`);
        });

        console.log('\n🤒  PATIENT PORTAL LOGIN  (Patient Portal)');
        console.log('───────────────────────────────────────────────────────────────────────');
        console.log('  Patient ID │ Name                │ Contact     │ Status       │ Password');
        console.log('───────────────────────────────────────────────────────────────────────');
        console.log('  PID-1001   │ Mohammed Raza       │ 9812345678  │ Waiting      │ patient@123');
        console.log('  PID-1002   │ Sunita Agarwal      │ 9823456789  │ Prescribed   │ patient@123');
        console.log('  PID-1003   │ Deepak Choudhary    │ 9834567890  │ Completed    │ patient@123');

        console.log('\n═══════════════════════════════════════════════════════════════════════');
        console.log('  ✅  Seeding DONE! Open http://localhost:5000/8login.html to login.');
        console.log('═══════════════════════════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding:', error.message);
        process.exit(1);
    }
}

seed();
