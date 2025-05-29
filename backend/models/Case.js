const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['em andamento', 'finalizado', 'arquivado'],
    default: 'em andamento'
  },
  description: { type: String, required: true },
  patientName: { type: String, required: true },
  patientDOB: { type: Date, required: true },
  patientAge: { type: Number },
  patientGender: {
    type: String,
    enum: ['masculino', 'feminino', 'outro'],
    required: true
  },
  patientID: { type: String, required: true },
  patientContact: { type: String },

  incidentDate: { type: Date, required: true },
  incidentLocation: { type: String, required: true },
  incidentDescription: { type: String, required: true },
  incidentWeapon: { type: String },

  // Campos adicionais que você deseja salvar
  estado: { type: String, default: 'Não informado' },
  bairro: { type: String, default: 'Não informado' },
  caseType: { type: String, default: 'Não informado' },
  identified: { type: Boolean, default: true },
  injuryRegions: { type: [String], default: [] },
  

  assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assistentes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  evidences: [mongoose.Schema.Types.Mixed],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

module.exports = mongoose.model('Case', CaseSchema);
