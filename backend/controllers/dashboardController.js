const Case = require('../models/Case');

// Função para contar vítimas por faixa etária
exports.getFaixaEtariaStats = async (req, res) => {
  try {
    const casos = await Case.find();

    const contagem = {
      '0–17': 0,
      '18–30': 0,
      '31–45': 0,
      '46–60': 0,
      '60+': 0
    };

    casos.forEach(caso => {
      const idade = caso.vitima?.idade;
      if (idade !== undefined) {
        if (idade <= 17) contagem['0–17']++;
        else if (idade <= 30) contagem['18–30']++;
        else if (idade <= 45) contagem['31–45']++;
        else if (idade <= 60) contagem['46–60']++;
        else contagem['60+']++;
      }
    });

    res.json({
      labels: Object.keys(contagem),
      data: Object.values(contagem)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao gerar dados de faixa etária.' });
  }
};
