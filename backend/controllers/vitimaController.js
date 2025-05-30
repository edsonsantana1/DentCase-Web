// vitimaController.js
const Vitima = require('../models/Vitima');

exports.createVitima = async (req, res) => {
  try {
    const { nome, dateOfBirth, sexo, bairro } = req.body;
    const vitima = new Vitima({ nome, dateOfBirth, sexo, bairro });
    await vitima.save();
    res.status(201).json(vitima);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.listVitimas = async (req, res) => {
  try {
    const vitimas = await Vitima.find();
    res.json(vitimas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
