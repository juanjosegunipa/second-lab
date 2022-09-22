const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    accounts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account'
    }]
});



const User = mongoose.model('User', userSchema);

module.exports = User;