const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    medicines: [{
        medicineName: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, default: '1-0-1' },
        duration: { type: String, required: true }
    }],
    notes: { type: String, default: '' },
    instructions: { type: String, default: '' },
    observations: { type: String, default: '' },
    remarks: { type: String, default: '' },
    version: { type: Number, default: 1 },
    reportId: { type: String, required: true },
    history: [{
        version: { type: Number },
        medicines: [{
            medicineName: String,
            dosage: String,
            frequency: String,
            duration: String
        }],
        notes: String,
        instructions: String,
        observations: String,
        remarks: String,
        createdAt: { type: Date }
    }],
    createdAt: { type: Date, default: Date.now }
});

PrescriptionSchema.index({ patientId: 1 });

module.exports = mongoose.model('Prescription', PrescriptionSchema);

