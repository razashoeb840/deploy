const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
    message: { type: String, required: true },
    type: { type: String, default: 'info' },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
