// model/auditModel.js
const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema({
  action: { type: String, required: true },      
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
  details: String
});

const AuditModel = mongoose.model("Audit", auditSchema);
module.exports = { AuditModel };
