const mongoose = require('mongoose');

const vitimaSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  sexo: { type: String, enum: ['masculino', 'feminino', 'outro'] }, // opcional por padrão
  bairro: { type: String } // opcional por padrão
}, {
  timestamps: true
});

module.exports = mongoose.model('Vitima', vitimaSchema);
