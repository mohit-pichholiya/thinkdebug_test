const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, 
    role: { type: String, default: 'user' }, 
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }
});

const UserModal = mongoose.model('User', UserSchema);

module.exports = { UserModal };
