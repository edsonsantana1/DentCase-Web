const mongoose = require('mongoose');

const LaudoSchema = new mongoose.Schema({
  evidence: { type: mongoose.Schema.Types.ObjectId, ref: 'Evidence', required: true }, // Referência à evidência
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Referência ao usuário
  reportDate: { type: Date, required: true }, // Data do laudo
  expertName: { type: String, required: true }, // Nome do perito responsável
  findings: { type: String, required: true }, // Constatações
  conclusions: { type: String, required: true }, // Conclusões
});

module.exports = mongoose.model('Laudo', LaudoSchema);