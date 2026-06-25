const mongoose = require('mongoose');

const SalaryHistorySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'userModel' },
    userModel: { type: String, required: true, enum: ['Doctor', 'Staff'] },
    name: { type: String, required: true },
    role: { type: String, required: true },
    month: { type: String, required: true }, // Format: YYYY-MM (e.g. "2026-06")
    amount: { type: Number, required: true },
    status: { type: String, required: true, enum: ['Paid', 'Pending'], default: 'Pending' },
    paidAt: { type: Date }
}, { timestamps: true });

// Ensure unique salary record per user per month
SalaryHistorySchema.index({ month: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('SalaryHistory', SalaryHistorySchema);
