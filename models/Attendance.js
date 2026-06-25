const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'userModel' },
    userModel: { type: String, required: true, enum: ['Doctor', 'Staff'] },
    name: { type: String, required: true },
    role: { type: String, required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    status: { type: String, required: true, enum: ['Present', 'Absent', 'Leave'], default: 'Present' },
    remarks: { type: String, default: '' }
}, { timestamps: true });

// Ensure unique attendance per user per day
AttendanceSchema.index({ date: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
