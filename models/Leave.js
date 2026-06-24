const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },
    doctorName: { type: String, default: null },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
    staffName: { type: String, default: null },
    role: { type: String, enum: ['doctor', 'receptionist', 'pharmacy'], required: true },
    leaveDate: { type: String, required: true }, // Format: YYYY-MM-DD or "YYYY-MM-DD to YYYY-MM-DD"
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Leave', LeaveSchema);

