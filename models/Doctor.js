const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
    doctorId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    plainPassword: { type: String },
    specialization: { type: String, required: true },
    experience: { type: Number, default: 0 },
    qualifications: { type: String, default: 'MBBS' },
    contactNumber: { type: String, default: 'N/A' },
    address: { type: String, default: 'N/A' },
    aadhar: { type: String, default: 'N/A' },
    cabin: { type: String, default: 'General Ward' },
    fee: { type: Number, default: 500 },
    about: { type: String, default: 'Dedicated to providing excellent patient care.' },
    isActive: { type: Boolean, default: true }
});

DoctorSchema.index({ name: 1 });

module.exports = mongoose.model('Doctor', DoctorSchema);
