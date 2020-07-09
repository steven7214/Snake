var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        default: 0
    }
});

const User = mongoose.model('User',UserSchema);
module.exports = User;