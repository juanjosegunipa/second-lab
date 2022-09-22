const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accountSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    accountName: String,
    balance: Number,
    transaction: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }],
    currency: String
});

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;