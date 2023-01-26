const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: [true, "Please provide a Username!"],
        unique: [true, "Username already exists!"]
    },
    email: {
        type: String,
        required: [true, "Please provide an Email!"],
        match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    },
    password1: {
        type: String,
        required: [true, "Please provide a Password!"],
        minLength: [6, "Password should at least be 6 characters long"]
    },
    password2: {
        type: String,
        required: [true, "Please provide a Password!"],
        minLength: [6, "Password should at least be 6 characters long"]
    }

});

UserSchema.index({'$**': 'text'});

const User = mongoose.model('User' , UserSchema);
module.exports = User;