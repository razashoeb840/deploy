const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    token: { type: Number, required: true, unique: true },
    patientId: { type: String, required: true }, // Permanent Patient ID e.g. PID-1001
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, default: 'Male' },
    contact: { type: String, required: false },
    address: { type: String, default: 'N/A' },
    aadhar: { type: String, default: 'N/A' },
    problem: { type: String, required: true },
    assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    status: { type: String, enum: ['waiting', 'prescribed', 'completed'], default: 'waiting' },
    createdAt: { type: Date, default: Date.now },
    consultedAt: { type: Date },
    completedAt: { type: Date },
    cabinEnteredAt: { type: Date },
    paymentStatus: { type: String, default: 'Pending' },
    
    // Receptionist vitals
    bp: { type: String, default: '120/80' },
    weight: { type: String, default: 'N/A' },
    height: { type: String, default: 'N/A' },
    temperature: { type: String, default: '98.6°F' },
    oxygenLevel: { type: String, default: '98%' }, // SPO2
    pulseRate: { type: String, default: '72 bpm' },
    vitalsNotes: { type: String, default: '' },
    
    // Flow control
    inCabin: { type: Boolean, default: false },
    priority: { type: String, enum: ['normal', 'emergency'], default: 'normal' }
});

PatientSchema.index({ patientId: 1 });
PatientSchema.index({ name: 1 });
PatientSchema.index({ contact: 1 });
PatientSchema.index({ aadhar: 1 });
PatientSchema.index({ priority: 1 });

module.exports = mongoose.model('Patient', PatientSchema);

