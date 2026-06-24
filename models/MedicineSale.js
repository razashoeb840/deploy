const mongoose = require('mongoose');

const MedicineSaleSchema = new mongoose.Schema({
    medicineName: { type: String, required: true },
    quantity: { type: Number, required: true },
    pricePerUnit: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    soldAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MedicineSale', MedicineSaleSchema);
