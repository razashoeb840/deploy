const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
    staffId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    plainPassword: { type: String },
    role: { type: String, required: true, enum: ['admin', 'receptionist', 'pharmacy'] },
    contactNumber: { type: String, default: 'N/A' },
    address: { type: String, default: 'N/A' },
    aadhar: { type: String, default: 'N/A' },
    bloodGroup: { type: String, default: 'N/A' },
    photo: { type: String, default: '' },
    signature: { type: String, default: '' },
    addedAt: { type: Date, default: Date.now }
});

StaffSchema.index({ staffId: 1, role: 1 });

module.exports = mongoose.model('Staff', StaffSchema);
