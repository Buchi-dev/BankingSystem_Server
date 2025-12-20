const mongoose = require("mongoose");

const BankSchema = new mongoose.Schema({
    bankBalance: {
        type: mongoose.Schema.Types.Decimal128,
        required: true,
        default: mongoose.Types.Decimal128.fromString('0.00'),
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
});

const Bank = mongoose.model("Bank", BankSchema);

module.exports = Bank;