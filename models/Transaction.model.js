const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    sendingAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account'
    },
    receivingAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account'
    },
    amount: Number
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;