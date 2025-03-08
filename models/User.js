const mongoose = require('../db');

const UserSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  displayName: String,
  email: String,
  accessToken: String,  // Store tokens here
  refreshToken: String,
});

module.exports = mongoose.model('User', UserSchema);
