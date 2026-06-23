require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Bed = require('./models/Bed');
const Medicine = require('./models/Medicine');
const Prescription = require('./models/Prescription');
const Staff = require('./models/Staff');
const Message = require('./models/Message');
const Leave = require('./models/Leave');

const path = require('path');

const compression = require('compression');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(compression());
app.use(cors());
app.use(express.json());

// Serve static frontend files with caching (except HTML files to guarantee instant updates)
app.use(express.static(__dirname, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));

// Route root to Main Dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '1index.html'));
});

// Migration: Assign permanent Patient IDs (PID-xxxx) to existing patients if missing
async function migrateMissingPatientIds() {
    try {
        const patients = await Patient.find({ 
            $or: [
                { patientId: { $exists: false } }, 
                { patientId: null }, 
                { patientId: 'undefined' },
                { patientId: '' }
            ] 
        });
        if (patients.length > 0) {
            console.log(`Migrating ${patients.length} patients with missing patientId...`);
            
            // Find max PID in the database
            const allPatients = await Patient.find({ patientId: /^PID-\d+$/ }, 'patientId');
            let maxNum = 1000;
            allPatients.forEach(p => {
                const match = p.patientId.match(/^PID-(\d+)$/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNum) maxNum = num;
                }
            });
            
            for (let p of patients) {
                maxNum += 1;
                p.patientId = `PID-${maxNum}`;
                await p.save();
                console.log(`Assigned ${p.patientId} to patient "${p.name}"`);
            }
            console.log("Migration complete.");
        }
    } catch (err) {
        console.error("Migration of patient IDs failed:", err);
    }
}

// Auto-seeding for empty database (cloud deployment ready)
async function autoSeed() {
    try {
        const staffCount = await Staff.countDocuments();
        if (staffCount > 0) return; // Already seeded

        console.log('No staff found. Seeding initial hospital data...');
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const defaultPasswordHash = await bcrypt.hash('123456', salt);

        // 1. Seed Doctors
        const doctors = [
            { doctorId: 'DOC-101', name: 'Dr. Rohan Sharma', specialization: 'Cardiology', password: defaultPasswordHash, plainPassword: '123456' },
            { doctorId: 'DOC-102', name: 'Dr. Anjali Verma', specialization: 'Neurology', password: defaultPasswordHash, plainPassword: '123456' },
            { doctorId: 'DOC-103', name: 'Dr. Prakash Iyer', specialization: 'General Physician', password: defaultPasswordHash, plainPassword: '123456' }
        ];
        await Doctor.insertMany(doctors);
        console.log('Seeded default Doctors.');

        // 2. Seed Staff
        const staffList = [
            { staffId: 'ADM-001', name: 'Ravi Kumar', role: 'admin', password: defaultPasswordHash, plainPassword: '123456' },
            { staffId: 'REC-001', name: 'Priya Desai', role: 'receptionist', password: defaultPasswordHash, plainPassword: '123456' },
            { staffId: 'PHA-001', name: 'Vikram Singh', role: 'pharmacy', password: defaultPasswordHash, plainPassword: '123456' }
        ];
        await Staff.insertMany(staffList);
        console.log('Seeded default Staff credentials.');

        // 3. Seed Beds
        const beds = [];
        for(let i=1; i<=10; i++) { beds.push({ bedId: `ICU-${String(i).padStart(2,'0')}`, zone: 'ICU', status: 'free' }); }
        for(let i=1; i<=50; i++) { beds.push({ bedId: `GW-${String(i).padStart(2,'0')}`, zone: 'General', status: 'free' }); }
        for(let i=1; i<=15; i++) { beds.push({ bedId: `PR-${String(i).padStart(2,'0')}`, zone: 'Private', status: 'free' }); }
        await Bed.insertMany(beds);
        console.log('Seeded default Beds.');

        // 4. Seed Medicines
        const medicines = [
            { name: 'Paracetamol', stock: 100, price: 10 },
            { name: 'Amoxicillin', stock: 50, price: 50 },
            { name: 'Cetirizine', stock: 200, price: 5 },
            { name: 'Ibuprofen', stock: 150, price: 15 },
            { name: 'Cough Syrup', stock: 60, price: 80 }
        ];
        await Medicine.insertMany(medicines);
        console.log('Seeded default Medicines stock.');
        console.log('Auto-seeding completed successfully!');
    } catch (err) {
        console.error('Error auto-seeding:', err);
    }
}

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartcare_hms';
mongoose.connect(mongoURI).then(async () => {
    console.log('MongoDB Connected');
    await autoSeed();
    migrateMissingPatientIds();
}).catch(err => console.log('Error connecting to MongoDB:', err));

// --- DOCTOR APIs ---
app.get('/api/doctors', async (req, res) => {
    try {
        const doctors = await Doctor.find();
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/doctors/login', async (req, res) => {
    const { name } = req.body;
    try {
        const doctor = await Doctor.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } });
        if (doctor) {
            res.json({ success: true, doctor });
        } else {
            res.status(404).json({ success: false, message: 'Doctor not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/doctors/:id/patients', async (req, res) => {
    try {
        // Return all patients assigned to the doctor
        const patients = await Patient.find({ assignedDoctor: req.params.id }).sort({ token: 1 });
        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper to generate a unique sequential Patient ID
async function generatePatientId() {
    try {
        const patients = await Patient.find({ patientId: /^PID-\d+$/ }, 'patientId');
        let maxNum = 1000;
        patients.forEach(p => {
            const match = p.patientId.match(/^PID-(\d+)$/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
            }
        });
        return `PID-${maxNum + 1}`;
    } catch (err) {
        console.error("Error generating patient ID:", err);
        return 'PID-' + Math.floor(1000 + Math.random() * 9000);
    }
}

// --- PATIENT APIs ---
app.post('/api/patients/register', async (req, res) => {
    const { name, age, contact, problem, assignedDoctor, address, aadhar, gender, patientId, bp, weight, height, temperature, oxygenLevel, pulseRate, vitalsNotes, priority } = req.body;
    try {
        if (!assignedDoctor) return res.status(400).json({ error: 'Doctor assignment is required' });
        
        // Verify doctor exists
        const doctor = await Doctor.findById(assignedDoctor);
        if (!doctor) return res.status(400).json({ error: 'Selected doctor not found' });

        // Generate visit/queue token
        const lastPatient = await Patient.findOne().sort({ token: -1 });
        const token = lastPatient ? lastPatient.token + 1 : 1;

        // Determine permanent Patient ID
        let pid = patientId;
        if (!pid) {
            pid = await generatePatientId();
        }

        const newPatient = new Patient({
            token,
            patientId: pid,
            name,
            age,
            gender: gender || 'Male',
            contact: contact || 'N/A',
            problem,
            assignedDoctor: doctor._id,
            address: address || 'N/A',
            aadhar: aadhar || 'N/A',
            // Default Vitals if passed
            bp: bp || '120/80',
            weight: weight || 'N/A',
            height: height || 'N/A',
            temperature: temperature || '98.6°F',
            oxygenLevel: oxygenLevel || '98%',
            pulseRate: pulseRate || '72 bpm',
            vitalsNotes: vitalsNotes || '',
            inCabin: false, // Movement controlled by reception
            priority: priority || 'normal'
        });

        await newPatient.save();
        const populatedPatient = await Patient.findById(newPatient._id).populate('assignedDoctor');
        io.emit('patient_added', populatedPatient);
        res.status(201).json({ success: true, patient: newPatient, doctor });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update patient triage priority (called by receptionist)
app.put('/api/patients/:id/priority', async (req, res) => {
    const { priority } = req.body;
    try {
        const patient = await Patient.findByIdAndUpdate(req.params.id, { priority }, { new: true });
        if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

        const populatedPatient = await patient.populate('assignedDoctor');
        io.emit('patient_updated', populatedPatient);
        res.json({ success: true, patient: populatedPatient });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update patient vitals (called by receptionist)
app.put('/api/patients/:id/vitals', async (req, res) => {
    const { bp, weight, height, temperature, oxygenLevel, pulseRate, vitalsNotes } = req.body;
    try {
        const patient = await Patient.findByIdAndUpdate(req.params.id, {
            bp: bp || '120/80',
            weight: weight || 'N/A',
            height: height || 'N/A',
            temperature: temperature || '98.6°F',
            oxygenLevel: oxygenLevel || '98%',
            pulseRate: pulseRate || '72 bpm',
            vitalsNotes: vitalsNotes || ''
        }, { new: true });

        if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

        const populatedPatient = await patient.populate('assignedDoctor');
        io.emit('patient_updated', populatedPatient);
        res.json({ success: true, patient });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Send patient to Doctor's Cabin (called by receptionist)
app.put('/api/patients/:id/send-to-cabin', async (req, res) => {
    try {
        const patient = await Patient.findByIdAndUpdate(req.params.id, { inCabin: true, cabinEnteredAt: new Date() }, { new: true });
        if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

        const populatedPatient = await patient.populate('assignedDoctor');
        io.emit('patient_updated', populatedPatient);
        res.json({ success: true, patient });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Look up existing patient records by Patient ID or Name
app.get('/api/patients/lookup', async (req, res) => {
    const { patientId, name } = req.query;
    try {
        let query = {};
        if (patientId) query.patientId = patientId.trim();
        else if (name) query.name = { $regex: new RegExp(name.trim(), 'i') };
        else return res.status(400).json({ success: false, error: 'Please provide Patient ID or Name' });

        // Find latest patient visit to pull demographics & history
        const patient = await Patient.findOne(query).sort({ createdAt: -1 });
        if (!patient) return res.status(404).json({ success: false, error: 'No previous patient records found.' });

        res.json({ success: true, patient });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get complete visit history for a specific permanent Patient ID
app.get('/api/patients/history/:patientId', async (req, res) => {
    try {
        const history = await Patient.find({ 
            patientId: req.params.patientId,
            problem: { $ne: 'Account Registration Profile' }
        })
        .populate('assignedDoctor', 'name specialization')
        .sort({ createdAt: -1 });

        // Fetch patient profile to get the uploaded reports list
        const profile = await Patient.findOne({ 
            patientId: req.params.patientId, 
            password: { $exists: true } 
        });
        const reports = profile ? (profile.reports || []) : [];

        // For each visit, populate its prescription details too
        const historyWithPrescriptions = await Promise.all(history.map(async (visit) => {
            const rx = await Prescription.findOne({ patientId: visit._id }).populate('doctorId', 'name');
            return {
                visit,
                prescription: rx || null
            };
        }));

        res.json({
            history: historyWithPrescriptions,
            reports: reports
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/patients/queue', async (req, res) => {
    try {
        const queue = await Patient.find({ status: { $ne: 'completed' } })
            .populate('assignedDoctor', 'name specialization')
            .sort({ token: 1 });
        res.json(queue);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/patients', async (req, res) => {
    try {
        const history = await Patient.find() 
            .populate('assignedDoctor', 'name specialization')
            .sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/patients/history', async (req, res) => {
    try {
        const { patientId, phone, aadhar, doctorName, prescriptionId, name, date } = req.query;
        let query = {};

        if (date) {
            const searchDate = new Date(date);
            const startOfDay = new Date(searchDate.setHours(0,0,0,0));
            const endOfDay = new Date(searchDate.setHours(23,59,59,999));
            query.createdAt = { $gte: startOfDay, $lte: endOfDay };
        }

        if (patientId) {
            query.patientId = { $regex: new RegExp(patientId.trim(), 'i') };
        }
        if (name) {
            query.name = { $regex: new RegExp(name.trim(), 'i') };
        }
        if (phone) {
            query.contact = { $regex: new RegExp(phone.trim(), 'i') };
        }
        if (aadhar) {
            query.aadhar = { $regex: new RegExp(aadhar.trim(), 'i') };
        }

        if (prescriptionId) {
            const rx = await Prescription.findOne({ reportId: { $regex: new RegExp(prescriptionId.trim(), 'i') } });
            if (rx) {
                query._id = rx.patientId;
            } else {
                return res.json([]);
            }
        }

        let history = await Patient.find(query)
            .populate('assignedDoctor', 'name specialization')
            .sort({ createdAt: -1 })
            .lean();

        if (doctorName) {
            const regex = new RegExp(doctorName.trim(), 'i');
            history = history.filter(p => p.assignedDoctor && regex.test(p.assignedDoctor.name));
        }

        // Attach prescriptionId to each patient visit
        const historyWithPrescriptions = await Promise.all(history.map(async (p) => {
            const rx = await Prescription.findOne({ patientId: p._id });
            return {
                ...p,
                prescriptionId: rx ? rx.reportId : null
            };
        }));

        res.json(historyWithPrescriptions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/patients/:id', async (req, res) => {
    const { status } = req.body;
    try {
        const updateData = { status };
        if (status === 'completed') updateData.completedAt = new Date();
        const patient = await Patient.findByIdAndUpdate(req.params.id, updateData, { new: true });
        const populatedPatient = await patient.populate('assignedDoctor');
        io.emit('patient_updated', populatedPatient);
        res.json({ success: true, patient });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/patients/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        const updateData = { status };
        if (status === 'completed') updateData.completedAt = new Date();
        const patient = await Patient.findByIdAndUpdate(req.params.id, updateData, { new: true });
        const populatedPatient = await patient.populate('assignedDoctor');
        io.emit('patient_updated', populatedPatient);
        res.json({ success: true, patient });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PATIENT AUTH & DASHBOARD APIs ---

// Middleware to authenticate patient JWT token
const authenticatePatientToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'medipulse_secret_key_123');
        req.patient = decoded;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid or expired token.' });
    }
};

// Signup Route (Generate Account)
app.post('/api/patients/signup', async (req, res) => {
    const { name, age, gender, contact, address, aadhar, password } = req.body;
    try {
        if (!name || !age || !contact || !aadhar || !password) {
            return res.status(400).json({ error: 'All fields (Name, Age, Contact, Aadhaar, Password) are required' });
        }

        // Check if patient with this Aadhaar or Contact already has a password set
        const existingWithPassword = await Patient.findOne({
            $or: [{ aadhar: aadhar.trim() }, { contact: contact.trim() }],
            password: { $exists: true, $ne: "" }
        });

        if (existingWithPassword) {
            return res.status(400).json({ error: 'An account already exists with this Aadhaar or Contact. Please log in.' });
        }

        // Check if there is an existing patient record (without password)
        const existingRecord = await Patient.findOne({
            $or: [{ aadhar: aadhar.trim() }, { contact: contact.trim() }]
        });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let pid;
        if (existingRecord) {
            pid = existingRecord.patientId;
            // Update all existing records for this patient to have the password
            await Patient.updateMany(
                { patientId: pid },
                { $set: { password: hashedPassword, address: address || existingRecord.address } }
            );
        } else {
            pid = await generatePatientId();
        }

        // Create a base profile patient document representing the account (with status 'completed' so it's not active in queue)
        const lastPatient = await Patient.findOne().sort({ token: -1 });
        const token = lastPatient ? lastPatient.token + 1 : 1;

        const newProfile = new Patient({
            token,
            patientId: pid,
            name,
            age,
            gender: gender || 'Male',
            contact: contact.trim(),
            problem: 'Account Registration Profile',
            address: address || 'N/A',
            aadhar: aadhar.trim(),
            password: hashedPassword,
            status: 'completed', // Not in active queue
            paymentStatus: 'Paid'
        });

        await newProfile.save();
        res.status(201).json({ success: true, patientId: pid, name: newProfile.name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login Route
app.post('/api/patients/login', async (req, res) => {
    const { loginId, password } = req.body; // loginId can be Patient ID (PID-xxxx), Aadhaar, or Contact
    try {
        if (!loginId || !password) {
            return res.status(400).json({ error: 'Login ID and Password are required' });
        }

        const patient = await Patient.findOne({
            $or: [
                { patientId: loginId.trim() },
                { aadhar: loginId.trim() },
                { contact: loginId.trim() }
            ],
            password: { $exists: true, $ne: "" }
        }).sort({ createdAt: -1 }); // Get latest

        if (!patient) {
            return res.status(400).json({ error: 'Invalid login credentials or account does not exist' });
        }

        const isMatch = await bcrypt.compare(password, patient.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid login credentials' });
        }

        // Generate JWT token
        const jwtToken = jwt.sign(
            { patientId: patient.patientId, name: patient.name },
            process.env.JWT_SECRET || 'medipulse_secret_key_123',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token: jwtToken,
            patient: {
                patientId: patient.patientId,
                name: patient.name,
                age: patient.age,
                gender: patient.gender,
                contact: patient.contact,
                aadhar: patient.aadhar,
                address: patient.address
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Forgot Details Route (Initiates Password Reset by checking identifier and simulating OTP)
app.post('/api/patients/forgot-details', async (req, res) => {
    const { identifier } = req.body; // Can be Patient ID (PID-xxxx) or registered Mobile Number
    try {
        if (!identifier) {
            return res.status(400).json({ error: 'Patient ID or registered Mobile Number is required' });
        }

        // Find the patient document that has a password set
        const patient = await Patient.findOne({
            $or: [
                { patientId: identifier.trim() },
                { contact: identifier.trim() }
            ],
            password: { $exists: true, $ne: "" }
        }).sort({ createdAt: -1 });

        if (!patient) {
            return res.status(404).json({ error: 'No account found matching this Patient ID or Mobile Number.' });
        }

        // Mask contact number for response display (e.g. 9876XXXX12)
        const phone = patient.contact;
        const maskedPhone = phone.slice(0, 4) + 'XXXX' + phone.slice(-2);

        res.json({
            success: true,
            message: 'OTP has been sent to your registered mobile number',
            contact: maskedPhone,
            patientId: patient.patientId
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reset Password Route (Validates OTP and sets a new password)
app.post('/api/patients/reset-password', async (req, res) => {
    const { identifier, otp, newPassword } = req.body;
    try {
        if (!identifier || !otp || !newPassword) {
            return res.status(400).json({ error: 'All fields (ID/Mobile, OTP, and New Password) are required' });
        }

        if (otp !== '123456') {
            return res.status(400).json({ error: 'Invalid verification OTP' });
        }

        // Find patient records matching the Patient ID or mobile
        const patient = await Patient.findOne({
            $or: [
                { patientId: identifier.trim() },
                { contact: identifier.trim() }
            ],
            password: { $exists: true, $ne: "" }
        }).sort({ createdAt: -1 });

        if (!patient) {
            return res.status(404).json({ error: 'No account found matching this Patient ID or Mobile Number.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password for all visits of this Patient ID
        await Patient.updateMany(
            { patientId: patient.patientId },
            { $set: { password: hashedPassword } }
        );

        res.json({
            success: true,
            message: 'Password reset successful! You can now log in with your new password.'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Personal Dashboard Data (Visits, Prescriptions, Bills, Documents)
app.get('/api/patients/my-dashboard', authenticatePatientToken, async (req, res) => {
    try {
        const pid = req.patient.patientId;
        
        // Find latest profile data
        const profile = await Patient.findOne({ patientId: pid, password: { $exists: true } }).sort({ createdAt: -1 });
        if (!profile) return res.status(404).json({ error: 'Patient profile not found' });

        // Get all historical visits for this PID
        const visits = await Patient.find({ patientId: pid })
            .populate('assignedDoctor', 'name specialization fee cabin')
            .sort({ createdAt: -1 });

        // Map visits to extract bills and prescriptions
        const visitsWithPrescriptions = await Promise.all(visits.map(async (visit) => {
            const prescription = await Prescription.findOne({ patientId: visit._id }).populate('doctorId', 'name specialization');
            
            // Check if there was a doctor fee to construct billing details
            const fee = visit.assignedDoctor ? (visit.assignedDoctor.fee || 500) : 500;
            
            return {
                visitId: visit._id,
                date: visit.createdAt,
                symptoms: visit.problem,
                status: visit.status,
                vitals: {
                    bp: visit.bp,
                    weight: visit.weight,
                    height: visit.height,
                    temperature: visit.temperature,
                    oxygenLevel: visit.oxygenLevel,
                    pulseRate: visit.pulseRate,
                    notes: visit.vitalsNotes
                },
                doctor: visit.assignedDoctor ? {
                    name: visit.assignedDoctor.name,
                    specialization: visit.assignedDoctor.specialization,
                    cabin: visit.assignedDoctor.cabin
                } : null,
                prescription: prescription ? {
                    reportId: prescription.reportId,
                    medicines: prescription.medicines,
                    notes: prescription.notes,
                    instructions: prescription.instructions,
                    observations: prescription.observations,
                    remarks: prescription.remarks,
                    date: prescription.createdAt
                } : null,
                bill: {
                    amount: fee,
                    status: visit.paymentStatus || 'Paid',
                    service: 'OPD Consultation'
                }
            };
        }));

        res.json({
            success: true,
            profile: {
                patientId: profile.patientId,
                name: profile.name,
                age: profile.age,
                gender: profile.gender,
                contact: profile.contact,
                aadhar: profile.aadhar,
                address: profile.address,
                reports: profile.reports || []
            },
            visits: visitsWithPrescriptions
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload Report Route
app.post('/api/patients/upload-report', authenticatePatientToken, async (req, res) => {
    const { fileName, fileData } = req.body; // fileData is base64 string
    try {
        if (!fileName || !fileData) {
            return res.status(400).json({ error: 'File name and file content are required' });
        }

        const pid = req.patient.patientId;
        
        // Find latest profile document to append report to
        const profile = await Patient.findOne({ patientId: pid, password: { $exists: true } }).sort({ createdAt: -1 });
        if (!profile) return res.status(404).json({ error: 'Patient profile not found' });

        // Push report
        profile.reports.push({
            fileName,
            fileData,
            uploadedAt: new Date()
        });

        await profile.save();

        res.json({
            success: true,
            message: 'Report uploaded successfully',
            reports: profile.reports
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PRESCRIPTION APIs ---
app.post('/api/prescriptions', async (req, res) => {
    const { patientId, doctorId, medicines, notes, instructions, observations, remarks } = req.body;
    try {
        let prescription = await Prescription.findOne({ patientId });
        
        if (prescription) {
            // Document already exists for this visit - push to version history
            prescription.history.push({
                version: prescription.version,
                medicines: prescription.medicines,
                notes: prescription.notes,
                instructions: prescription.instructions,
                observations: prescription.observations,
                remarks: prescription.remarks,
                createdAt: prescription.createdAt
            });
            
            prescription.version += 1;
            prescription.reportId = 'REP-' + Date.now().toString().slice(-6) + '-' + Math.floor(1000 + Math.random() * 9000);
            prescription.medicines = medicines;
            prescription.notes = notes || '';
            prescription.instructions = instructions || '';
            prescription.observations = observations || '';
            prescription.remarks = remarks || '';
            prescription.createdAt = new Date();
            
            await prescription.save();
        } else {
            // New prescription document
            const reportId = 'REP-' + Date.now().toString().slice(-6) + '-' + Math.floor(1000 + Math.random() * 9000);
            prescription = new Prescription({
                patientId,
                doctorId,
                medicines,
                notes: notes || '',
                instructions: instructions || '',
                observations: observations || '',
                remarks: remarks || '',
                version: 1,
                reportId
            });
            
            await prescription.save();
        }

        // Update patient status
        const patient = await Patient.findByIdAndUpdate(patientId, { status: 'prescribed', consultedAt: new Date(), inCabin: false }, { new: true });
        const populatedPatient = await patient.populate('assignedDoctor');
        const patientObj = populatedPatient.toObject();
        patientObj.prescriptionDetails = { 
            medicinesCount: medicines ? medicines.length : 0,
            medicinesSummary: medicines ? medicines.map(m => m.medicineName).join(', ') : '',
            notes: notes || ''
        };
        io.emit('patient_updated', patientObj);

        res.status(201).json({ success: true, prescription });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/prescriptions/patient/:patientId', async (req, res) => {
    try {
        const prescription = await Prescription.findOne({ patientId: req.params.patientId })
            .populate('doctorId', 'name')
            .populate('patientId', 'name age contact patientId bp weight height temperature oxygenLevel pulseRate vitalsNotes problem')
            .sort({ createdAt: -1 });
        
        if (prescription) {
            res.json({ success: true, prescription });
        } else {
            res.status(404).json({ success: false, message: 'Prescription not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- BED APIs ---
app.get('/api/beds', async (req, res) => {
    try {
        const beds = await Bed.find().populate('patient');
        res.json(beds);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/beds/:id', async (req, res) => {
    const { status, patient } = req.body;
    try {
        const bed = await Bed.findById(req.params.id);
        if (!bed) return res.status(404).json({ error: 'Bed not found' });
        
        bed.status = status;
        bed.patient = patient || null;
        await bed.save();

        const populatedBed = await Bed.findById(req.params.id).populate('patient');
        io.emit('bed_updated', populatedBed);

        res.json({ success: true, bed: populatedBed });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- MEDICINE APIs ---
app.get('/api/medicines', async (req, res) => {
    try {
        const medicines = await Medicine.find();
        res.json(medicines);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/medicines/sell', async (req, res) => {
    const { items } = req.body; // items: [{ name: 'Paracetamol', quantity: 2 }]
    try {
        // Verify stock first
        for (const item of items) {
            const med = await Medicine.findOne({ name: { $regex: new RegExp('^' + item.name + '$', 'i') } });
            if (!med || med.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for ${item.name}` });
            }
        }

        // Deduct stock
        for (const item of items) {
            await Medicine.updateOne(
                { name: { $regex: new RegExp('^' + item.name + '$', 'i') } },
                { $inc: { stock: -item.quantity } }
            );
        }

        res.json({ success: true, message: 'Medicines sold successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN APIS ---
app.post('/api/medicines', async (req, res) => {
    const { name, stock, price, category, illness, salesPerDay } = req.body;
    try {
        const newMed = new Medicine({ name, stock: parseInt(stock)||0, price: parseFloat(price)||0, category, illness, salesPerDay: parseInt(salesPerDay)||5 });
        await newMed.save();
        res.status(201).json({ success: true, medicine: newMed });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/medicines/:id', async (req, res) => {
    const { price, stockChange } = req.body;
    try {
        const medicine = await Medicine.findById(req.params.id);
        if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
        
        if (price !== undefined && price !== '') medicine.price = parseFloat(price);
        if (stockChange !== undefined && stockChange !== '') medicine.stock += parseInt(stockChange, 10);
        
        await medicine.save();
        res.json({ success: true, medicine });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/stats', async (req, res) => {
    try {
        const patientCount = await Patient.countDocuments();
        const docCount = await Doctor.countDocuments();
        const staffCount = await Staff.countDocuments();
        
        const rawMeds = await Medicine.find();
        const totalMedStock = rawMeds.reduce((acc, med) => acc + (med.stock * med.price), 0);
        
        const beds = await Bed.find();
        const occupiedBeds = beds.filter(b => b.status !== 'free').length;
        const totalBeds = beds.length;

        res.json({
            patients: patientCount,
            doctors: docCount,
            staff: staffCount,
            inventoryValue: totalMedStock,
            bedOccupancyPercentage: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
        });
    } catch(err) {
         res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/staff', async (req, res) => {
    try {
        const doctors = await Doctor.find().lean();
        const d_mapped = doctors.map(d => ({ id: d.doctorId, name: d.name, role: 'Doctor (' + d.specialization + ')', password: d.plainPassword || '123456' }));
        
        const staffList = await Staff.find().lean();
        const s_mapped = staffList.map(s => ({ id: s.staffId, name: s.name, role: s.role.toUpperCase(), password: s.plainPassword || '123456' }));
        
        res.json([...d_mapped, ...s_mapped]);
    } catch(err) {
         res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/doctor-performance', async (req, res) => {
    try {
        const doctors = await Doctor.find();
        const performance = await Promise.all(doctors.map(async (doc) => {
            const handledPatients = await Patient.find({
                assignedDoctor: doc._id,
                status: { $in: ['prescribed', 'completed'] }
            });

            const patientsCount = handledPatients.length;
            const revenue = patientsCount * (doc.fee || 500);

            let totalDurationMs = 0;
            let countWithDuration = 0;

            handledPatients.forEach(p => {
                if (p.consultedAt) {
                    let duration = 0;
                    if (p.cabinEnteredAt) {
                        duration = p.consultedAt - p.cabinEnteredAt;
                    } else {
                        duration = p.createdAt ? Math.min(p.consultedAt - p.createdAt, 15 * 60 * 1000) : 10 * 60 * 1000;
                    }
                    if (duration < 0) duration = 10 * 60 * 1000;
                    if (duration > 180 * 60 * 1000) duration = 15 * 60 * 1000;

                    totalDurationMs += duration;
                    countWithDuration++;
                }
            });

            const avgConsultationTimeMinutes = countWithDuration > 0
                ? Math.round((totalDurationMs / countWithDuration) / (60 * 1000) * 10) / 10
                : 0;

            const patientDetails = handledPatients.map(p => ({
                name: p.name,
                patientId: p.patientId,
                date: p.consultedAt || p.createdAt,
                status: p.status
            }));

            return {
                doctorId: doc.doctorId,
                name: doc.name,
                specialization: doc.specialization,
                patientsHandled: patientsCount,
                avgConsultationTime: avgConsultationTimeMinutes,
                revenueGenerated: revenue,
                patients: patientDetails
            };
        }));

        res.json({ success: true, performance });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/admin/register-staff', async (req, res) => {
    const { name, role, specialization, experience, qualifications, contactNumber, address, aadhar } = req.body;
    try {
        const year = new Date().getFullYear();
        const randomHex = Math.floor(1000 + Math.random() * 9000);
        const rawPassword = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 10);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        if(role === 'doctor') {
            const doctorId = `DOC-${year}-${randomHex}`;
            const newDoc = new Doctor({ doctorId, name: 'Dr. ' + name, password: hashedPassword, plainPassword: rawPassword, specialization, experience: experience || 0, qualifications: qualifications || 'MBBS', contactNumber: contactNumber || 'N/A', address: address || 'N/A', aadhar: aadhar || 'N/A' });
            await newDoc.save();
            io.emit('admin_action', { action: 'register_doctor', targetName: newDoc.name, details: newDoc.specialization });
            res.json({ success: true, user: newDoc, rawPassword });
        } else {
            const prefix = role.substring(0,3).toUpperCase();
            const staffId = `${prefix}-${year}-${randomHex}`;
            const newStaff = new Staff({ staffId, name, password: hashedPassword, plainPassword: rawPassword, role, contactNumber: contactNumber || 'N/A', address: address || 'N/A', aadhar: aadhar || 'N/A' });
            await newStaff.save();
            io.emit('admin_action', { action: 'register_staff', targetName: newStaff.name, details: `Role: ${role}` });
            res.json({ success: true, user: newStaff, rawPassword });
        }
    } catch(err) {
         res.status(500).json({ error: err.message });
    }
});

// --- AUTH API ---
app.post('/api/auth/login', async (req, res) => {
    const { id, password, role } = req.body;
    try {
        let user = null;
        if (role === 'guest') {
            const token = jwt.sign({ id: 'guest', role: 'guest' }, 'smartcare_secret_key', { expiresIn: '12h' });
            return res.json({ success: true, token, role: 'guest', userName: 'Guest' });
        } else if (role === 'doctor') {
            user = await Doctor.findOne({ doctorId: id });
        } else if (role === 'admin' || role === 'receptionist' || role === 'pharmacy') {
            user = await Staff.findOne({ staffId: id, role });
        }
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found or role mismatch' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        const token = jwt.sign({ id: user._id, role, genericId: user.doctorId || user.staffId }, 'smartcare_secret_key', { expiresIn: '12h' });
        res.json({ success: true, token, role, userName: user.name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/change-password', async (req, res) => {
    const { id, oldPassword, newPassword, role } = req.body;
    try {
        if (role === 'guest') {
            return res.status(400).json({ success: false, message: 'Guest cannot change password' });
        }
        
        let user = null;
        if (role === 'doctor') {
            user = await Doctor.findOne({ doctorId: id });
        } else if (role === 'admin' || role === 'receptionist' || role === 'pharmacy') {
            user = await Staff.findOne({ staffId: id, role });
        }
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid old password' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        user.password = hashedPassword;
        await user.save();
        
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/staff/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if(id.startsWith('DOC')) {
            const doc = await Doctor.findOneAndDelete({ doctorId: id });
            const docName = doc ? doc.name : id;
            io.emit('admin_action', { action: 'delete_staff', targetName: `${docName} (${id})` });
        } else {
            const stf = await Staff.findOneAndDelete({ staffId: id });
            const stfName = stf ? stf.name : id;
            io.emit('admin_action', { action: 'delete_staff', targetName: `${stfName} (${id})` });
        }
        res.json({ success: true });
    } catch(err) {
         res.status(500).json({ error: err.message });
    }
});

// --- MESSAGING APIs ---
app.post('/api/messages', async (req, res) => {
    try {
        const { senderRole, senderName, receiverRole, message } = req.body;
        const newMsg = new Message({ senderRole, senderName, receiverRole, message });
        await newMsg.save();
        res.status(201).json({ success: true, message: newMsg });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/messages/:role', async (req, res) => {
    try {
        // Fetch last 50 messages for the role
        const messages = await Message.find({ receiverRole: req.params.role }).sort({ timestamp: -1 }).limit(50);
        res.json(messages);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// --- DOCTOR HISTORY API ---
app.get('/api/doctors/:id/history', async (req, res) => {
    try {
        const patients = await Patient.find({ 
            assignedDoctor: req.params.id, 
            status: { $in: ['prescribed', 'completed'] } 
        }).sort({ completedAt: -1, consultedAt: -1 });
        res.json(patients);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// --- RE-PRESCRIBE API ---
app.post('/api/patients/:id/represcribe', async (req, res) => {
    try {
        const patient = await Patient.findByIdAndUpdate(req.params.id, {
            status: 'waiting',
            consultedAt: null,
            completedAt: null
        }, { new: true });
        io.emit('patient_updated', patient);
        res.json({ success: true, patient });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/doctors/:id/active', async (req, res) => {
    try {
        const { isActive } = req.body;
        const doctor = await Doctor.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
        io.emit('admin_action', { action: 'toggle_doctor_active', targetName: doctor ? doctor.name : 'Doctor', details: isActive ? 'Active' : 'Away' });
        res.json({ success: true });
    } catch(err) {
         res.status(500).json({ error: err.message });
    }
});

// --- LEAVE MANAGEMENT APIs ---
app.post('/api/leaves', async (req, res) => {
    const { doctorId, leaveDate, reason } = req.body;
    try {
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
        
        const newLeave = new Leave({
            doctor: doctor._id,
            doctorName: doctor.name,
            leaveDate,
            reason,
            status: 'pending'
        });
        await newLeave.save();
        res.status(201).json({ success: true, leave: newLeave });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/leaves', async (req, res) => {
    try {
        const leaves = await Leave.find().populate('doctor', 'name specialization').sort({ createdAt: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/leaves/:id', async (req, res) => {
    const { status } = req.body; // 'approved' or 'rejected'
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ success: false, error: 'Leave request not found' });
        
        leave.status = status;
        await leave.save();
        
        // If approved, set the doctor's isActive status to false
        if (status === 'approved') {
            await Doctor.findByIdAndUpdate(leave.doctor, { isActive: false });
        }
        
        io.emit('admin_action', { 
            action: status === 'approved' ? 'leave_approved' : 'leave_rejected', 
            targetName: leave.doctorName, 
            details: leave.leaveDate 
        });
        
        res.json({ success: true, leave });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- AI SYMPTOM ANALYZER ENDPOINT (GEMINI) ---
app.post('/api/ai/analyze-symptoms', async (req, res) => {
    const { textSymptoms, imageBase64, imageType, language } = req.body;
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
            return res.status(500).json({ error: 'Gemini API Key is not configured on the server. Please add it to your .env file.' });
        }

        // Fetch active doctors from MongoDB to match dynamically
        const doctors = await Doctor.find({ isActive: { $ne: false } });
        if (doctors.length === 0) {
            return res.status(404).json({ error: 'No active doctors found in the database.' });
        }

        const docListPrompt = doctors.map(d => `- ID: ${d._id}, Name: ${d.name}, Specialization: ${d.specialization}, Qualifications: ${d.qualifications}, Experience: ${d.experience} years, Cabin: ${d.cabin}, Fee: ${d.fee}`).join('\n');

        const isHindi = language === 'hi-IN';

        // Formulate the prompt for Gemini
        const systemPrompt = `You are an advanced medical routing and triage AI assistant. Analyze the patient's symptoms (text description and optional image) and determine the triage details.

BILINGUAL INPUT SUPPORT:
- The patient may describe symptoms in English, Hindi (Devanagari script), or Hinglish (Hindi written in Latin/English alphabet, e.g. "mere sir me dard ho raha hai", "chest me pain hai", "cough ho gaya hai").
- You must carefully parse and translate Hinglish or Hindi symptoms to identify the core medical condition.

PRECISE & CONCISE OUTPUTS:
- Keep all explanations, first-aid, and reasons extremely precise, clear, and brief. No long sentences or paragraphs.
- "firstAid" field: Provide a maximum of 3-4 short, actionable, bullet points.
- "disclaimer" field: Provide a single brief sentence stating it is not a professional diagnosis.

TARGET LANGUAGE SPECIFICATION:
${isHindi ? `- IMPORTANT: Write the output fields "firstAid", "disclaimer", and "analysisReason" in Hinglish (Hindi words written in Latin/English script, e.g. "Kripya aaram karein aur cold water peena chahiye. Agar chest pain badhe toh turant doctor se contact karein.") so that the local patient can easily read and understand. Do NOT use Devanagari script, use standard Latin/English alphabet only.` : `- IMPORTANT: Write the output fields "firstAid", "disclaimer", and "analysisReason" in standard English.`}

Active hospital doctors list:
${docListPrompt}

Determine:
1. "specialization": The medical specialization required (e.g. Cardiology, Neurology, General Physician, Pediatrics). Choose the doctor whose specialization matches the patient's needs. If no specialization matches, default to a General Physician.
2. "urgency": The urgency level of the condition, choosing exactly one of: Low, Medium, High, Critical. If emergency symptoms (like chest pain, breathing difficulty, severe bleeding, stroke symptoms, unconsciousness, burns, or major injuries) are detected, mark as High or Critical.
3. "emergencyDetected": boolean representing if emergency symptoms were found.
4. "recommendedDoctorId": The database ID of the recommended doctor from the list above.
5. "firstAid": safe, simple, precise bullet points (written in the target language).
6. "disclaimer": brief medical disclaimer statement.
7. "analysisReason": 1-sentence explanation of why this specialization and doctor were chosen.
8. "problemKeyword": A very short, precise 1-3 word medical keyword tag summarizing the main symptom (e.g. "Chest Pain", "Fever & Cough", "Migraine", "Stomach Pain"). Do NOT write a sentence. Keep it in English (or Hinglish if appropriate) as a clean tag to be displayed in a patient queue board.

CRITICAL: Return your response ONLY as a strict, valid JSON object with the keys specified above. Do NOT include any markdown code blocks, no backticks, and no extra text around the JSON.`;

        // Setup Gemini API request
        let contents = [];
        let parts = [{ text: systemPrompt }, { text: `Patient Symptoms: ${textSymptoms}` }];

        if (imageBase64) {
            parts.push({
                inlineData: {
                    mimeType: imageType || 'image/jpeg',
                    data: imageBase64
                }
            });
        }

        contents.push({ parts });

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });

        if (!response.ok) {
            const errData = await response.json();
            return res.status(response.status).json({ error: 'Gemini API Error: ' + JSON.stringify(errData) });
        }

        const result = await response.json();
        let aiText = result.candidates[0].content.parts[0].text.trim();

        // Strip markdown backticks if Gemini included them
        if (aiText.startsWith('```')) {
            aiText = aiText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        }

        // Parse JSON to verify correctness
        const structuredResponse = JSON.parse(aiText);
        res.json(structuredResponse);

    } catch (err) {
        console.error('AI Analysis Error:', err);
        res.status(500).json({ error: 'Failed to analyze symptoms: ' + err.message });
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
