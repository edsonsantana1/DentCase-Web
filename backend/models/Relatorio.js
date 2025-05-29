const mongoose = require('mongoose');

const RelatorioSchema = new mongoose.Schema({
  case: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true }, // Referência ao caso
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Referência ao usuário
  reportDate: { type: Date, required: true }, // Data do relatório
  title: { type: String, required: true }, // Título do relatório
  description: { type: String, required: true }, // Descrição do relatório
});

module.exports = mongoose.model('Relatorio', RelatorioSchema);