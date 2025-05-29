const mongoose = require('mongoose');

const EvidenceSchema = new mongoose.Schema({
  case: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  imageUrl: { type: String },
  videoUrl: { type: String },
  documentUrl: { type: String },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  description: { type: String, required: true },
  collectionDate: { type: Date, required: true },
  collectionTime: { type: String, required: true },
  attachment: { type: String }
});

module.exports = mongoose.model('Evidence', EvidenceSchema);
