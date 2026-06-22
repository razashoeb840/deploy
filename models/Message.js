const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    senderRole: { type: String, required: true },
    senderName: { type: String, required: true },
    receiverRole: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', MessageSchema);
