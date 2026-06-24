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

        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await mongoose.connection.db.dropDatabase();
        console.log('Database cleared.');

        // Generate default password hash
        const salt = await bcrypt.genSalt(10);
        const defaultPasswordHash = await bcrypt.hash('123456', salt);

        // Seed Doctors
        const doctors = [
            { doctorId: 'DOC-101', name: 'Dr. Rohan Sharma', specialization: 'Cardiology', password: defaultPasswordHash, plainPassword: '123456', fee: 800 },
            { doctorId: 'DOC-102', name: 'Dr. Anjali Verma', specialization: 'Neurology', password: defaultPasswordHash, plainPassword: '123456', fee: 600 },
            { doctorId: 'DOC-103', name: 'Dr. Prakash Iyer', specialization: 'General Physician', password: defaultPasswordHash, plainPassword: '123456', fee: 450 }
        ];
        await Doctor.insertMany(doctors);
        console.log('Doctors seeded.');

        // Seed Staff
        const staffList = [
            { staffId: 'ADM-001', name: 'Ravi Kumar', role: 'admin', password: defaultPasswordHash, plainPassword: '123456' },
            { staffId: 'REC-001', name: 'Priya Desai', role: 'receptionist', password: defaultPasswordHash, plainPassword: '123456' },
            { staffId: 'PHA-001', name: 'Vikram Singh', role: 'pharmacy', password: defaultPasswordHash, plainPassword: '123456' }
        ];
        await Staff.insertMany(staffList);
        console.log('Staff seeded.');

        // Seed Individual Beds
        const beds = [];
        for(let i=1; i<=10; i++) { beds.push({ bedId: `ICU-${String(i).padStart(2,'0')}`, zone: 'ICU', status: 'free' }); }
        for(let i=1; i<=50; i++) { beds.push({ bedId: `GW-${String(i).padStart(2,'0')}`, zone: 'General', status: 'free' }); }
        for(let i=1; i<=15; i++) { beds.push({ bedId: `PR-${String(i).padStart(2,'0')}`, zone: 'Private', status: 'free' }); }
        await Bed.insertMany(beds);
        console.log(`75 Individual Beds dynamically seeded.`);

        // Seed Medicines
        const medicines = [
            { name: 'Paracetamol', stock: 100, price: 10 },
            { name: 'Amoxicillin', stock: 50, price: 50 },
            { name: 'Cetirizine', stock: 200, price: 5 },
            { name: 'Ibuprofen', stock: 150, price: 15 },
            { name: 'Cough Syrup', stock: 60, price: 80 }
        ];
        await Medicine.insertMany(medicines);
        console.log('Medicines seeded.');

        // Seed Patients & Prescriptions
        const savedDocs = await Doctor.find();
        const doc1 = savedDocs[0];
        const doc2 = savedDocs[1];
        const doc3 = savedDocs[2];

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const getOffsetDate = (baseDate, hoursOffset) => {
            const d = new Date(baseDate);
            d.setHours(d.getHours() + hoursOffset);
            return d;
        };

        const patientsData = [
            { token: 1, patientId: 'PID-1001', name: 'Aarav Mehta', age: 45, gender: 'Male', contact: '9876543210', problem: 'Chest pain and sweating', assignedDoctor: doc1._id, bp: '140/90', weight: '75', height: '172', temperature: '98.4°F', oxygenLevel: '95%', pulseRate: '88 bpm', priority: 'emergency', status: 'completed', createdAt: getOffsetDate(yesterday, -10), consultedAt: getOffsetDate(yesterday, -9), completedAt: getOffsetDate(yesterday, -8) },
            { token: 2, patientId: 'PID-1002', name: 'Riya Sen', age: 29, gender: 'Female', contact: '9876543211', problem: 'Severe migraine headache', assignedDoctor: doc2._id, bp: '120/80', weight: '58', height: '160', temperature: '98.6°F', oxygenLevel: '99%', pulseRate: '72 bpm', priority: 'normal', status: 'completed', createdAt: getOffsetDate(yesterday, -8), consultedAt: getOffsetDate(yesterday, -7), completedAt: getOffsetDate(yesterday, -6) },
            { token: 3, patientId: 'PID-1003', name: 'Kabir Kapoor', age: 62, gender: 'Male', contact: '9876543212', problem: 'Fever and constant cough', assignedDoctor: doc3._id, bp: '130/85', weight: '80', height: '175', temperature: '101.2°F', oxygenLevel: '96%', pulseRate: '85 bpm', priority: 'normal', status: 'completed', createdAt: getOffsetDate(yesterday, -4), consultedAt: getOffsetDate(yesterday, -3), completedAt: getOffsetDate(yesterday, -2) },
            
            { token: 4, patientId: 'PID-1004', name: 'Amit Sharma', age: 50, gender: 'Male', contact: '9876543213', problem: 'High blood pressure', assignedDoctor: doc1._id, bp: '150/95', weight: '82', height: '170', temperature: '98.5°F', oxygenLevel: '97%', pulseRate: '90 bpm', priority: 'normal', status: 'completed', createdAt: getOffsetDate(today, -8), consultedAt: getOffsetDate(today, -7.5), completedAt: getOffsetDate(today, -7) },
            { token: 5, patientId: 'PID-1005', name: 'Sneha Patel', age: 34, gender: 'Female', contact: '9876543214', problem: 'Sprained left ankle', assignedDoctor: doc3._id, bp: '115/75', weight: '60', height: '163', temperature: '98.6°F', oxygenLevel: '99%', pulseRate: '74 bpm', priority: 'normal', status: 'completed', createdAt: getOffsetDate(today, -6), consultedAt: getOffsetDate(today, -5.5), completedAt: getOffsetDate(today, -5) },
            { token: 6, patientId: 'PID-1006', name: 'Ishaan Verma', age: 12, gender: 'Male', contact: '9876543215', problem: 'Stomach ache and vomiting', assignedDoctor: doc3._id, bp: '110/70', weight: '42', height: '145', temperature: '99.0°F', oxygenLevel: '98%', pulseRate: '80 bpm', priority: 'normal', status: 'prescribed', createdAt: getOffsetDate(today, -4), consultedAt: getOffsetDate(today, -3.5) },
            { token: 7, patientId: 'PID-1007', name: 'Zara Khan', age: 27, gender: 'Female', contact: '9876543216', problem: 'Asthma flare up', assignedDoctor: doc1._id, bp: '122/80', weight: '55', height: '165', temperature: '98.4°F', oxygenLevel: '93%', pulseRate: '92 bpm', priority: 'emergency', status: 'waiting', createdAt: getOffsetDate(today, -2) },
            { token: 8, patientId: 'PID-1008', name: 'Vijay Malhotra', age: 55, gender: 'Male', contact: '9876543217', problem: 'Joint pain and swelling', assignedDoctor: doc2._id, bp: '135/88', weight: '88', height: '178', temperature: '98.8°F', oxygenLevel: '98%', pulseRate: '76 bpm', priority: 'normal', status: 'waiting', createdAt: getOffsetDate(today, -1) }
        ];

        const savedPatients = await Patient.insertMany(patientsData);
        console.log('Patients visits seeded.');

        const p1 = savedPatients.find(p => p.name === 'Aarav Mehta');
        const p2 = savedPatients.find(p => p.name === 'Riya Sen');
        const p3 = savedPatients.find(p => p.name === 'Kabir Kapoor');
        const p4 = savedPatients.find(p => p.name === 'Amit Sharma');
        const p5 = savedPatients.find(p => p.name === 'Sneha Patel');
        const p6 = savedPatients.find(p => p.name === 'Ishaan Verma');

        const prescriptionsData = [
            { patientId: p1._id, doctorId: doc1._id, reportId: 'REP-100001', medicines: [{ medicineName: 'Paracetamol', dosage: '1-0-1', duration: '5 days', instructions: 'After meals' }], notes: 'Rest for 2 days', createdAt: p1.consultedAt },
            { patientId: p2._id, doctorId: doc2._id, reportId: 'REP-100002', medicines: [{ medicineName: 'Ibuprofen', dosage: '1-0-1', duration: '3 days', instructions: 'After meals' }], notes: 'Avoid screen time', createdAt: p2.consultedAt },
            { patientId: p3._id, doctorId: doc3._id, reportId: 'REP-100003', medicines: [{ medicineName: 'Cough Syrup', dosage: '1-1-1', duration: '7 days', instructions: 'Before meals' }], notes: 'Drink warm water', createdAt: p3.consultedAt },
            { patientId: p4._id, doctorId: doc1._id, reportId: 'REP-100004', medicines: [{ medicineName: 'Paracetamol', dosage: '1-0-1', duration: '10 days', instructions: 'Morning and night' }], notes: 'Reduce salt intake', createdAt: p4.consultedAt },
            { patientId: p5._id, doctorId: doc3._id, reportId: 'REP-100005', medicines: [{ medicineName: 'Ibuprofen', dosage: '1-0-1', duration: '5 days', instructions: 'After meals' }], notes: 'Keep leg elevated', createdAt: p5.consultedAt },
            { patientId: p6._id, doctorId: doc3._id, reportId: 'REP-100006', medicines: [{ medicineName: 'Cetirizine', dosage: '0-0-1', duration: '3 days', instructions: 'At bedtime' }], notes: 'Light diet only', createdAt: p6.consultedAt }
        ];
        await Prescription.insertMany(prescriptionsData);
        console.log('Prescriptions seeded.');

        const salesData = [
            { medicineName: 'Paracetamol', quantity: 15, pricePerUnit: 10, totalPrice: 150, soldAt: getOffsetDate(yesterday, -5) },
            { medicineName: 'Amoxicillin', quantity: 4, pricePerUnit: 50, totalPrice: 200, soldAt: getOffsetDate(yesterday, -4) },
            { medicineName: 'Cough Syrup', quantity: 2, pricePerUnit: 80, totalPrice: 160, soldAt: getOffsetDate(yesterday, -2) },
            { medicineName: 'Ibuprofen', quantity: 10, pricePerUnit: 15, totalPrice: 150, soldAt: getOffsetDate(yesterday, -1) },
            { medicineName: 'Paracetamol', quantity: 5, pricePerUnit: 10, totalPrice: 50, soldAt: getOffsetDate(today, -6) },
            { medicineName: 'Cetirizine', quantity: 20, pricePerUnit: 5, totalPrice: 100, soldAt: getOffsetDate(today, -3) }
        ];
        await MedicineSale.insertMany(salesData);
        console.log('Pharmacy Sales seeded.');

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seed();
