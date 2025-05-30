const Case = require('../models/Case');

// Faixa etária - usando dataNascimento para cálculo exato
exports.faixaEtaria = async (req, res) => {
  try {
    const pipeline = [
      {
        $addFields: {
          idade: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$vitima.dataNascimento'] },
                1000 * 60 * 60 * 24 * 365
              ]
            }
          }
        }
      },
      {
        $bucket: {
          groupBy: "$idade",
          boundaries: [0, 18, 31, 46, 61, 150],
          default: "60+",
          output: { count: { $sum: 1 } }
        }
      }
    ];

    const result = await Case.aggregate(pipeline);

    const labels = result.map(item => {
      if (typeof item._id === 'number') {
        if (item._id === 150) return '60+';
        if (item._id === 0) return '0-17';
        if (item._id === 18) return '18-30';
        if (item._id === 31) return '31-45';
        if (item._id === 46) return '46-60';
        return item._id.toString();
      } else {
        return item._id.toString();
      }
    });

    const data = result.map(item => item.count);

    res.json({ labels, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar dados de faixa etária' });
  }
};

// Gênero por tipo de ocorrência
exports.generoTipo = async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: { genero: "$vitima.genero", tipo: "$tipoOcorrencia" },
          count: { $sum: 1 }
        }
      }
    ];

    const result = await Case.aggregate(pipeline);

    // organizar para ter labels e datasets (Chart.js tipo bar com grupos)
    const tipos = [...new Set(result.map(item => item._id.tipo))];
    const generos = [...new Set(result.map(item => item._id.genero))];

    let datasets = generos.map(genero => {
      return {
        label: genero,
        data: tipos.map(tipo => {
          const found = result.find(r => r._id.genero === genero && r._id.tipo === tipo);
          return found ? found.count : 0;
        })
      };
    });

    res.json({ labels: tipos, datasets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar dados de gênero por tipo' });
  }
};

// Casos por bairro
exports.bairro = async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: "$bairro",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ];

    const result = await Case.aggregate(pipeline);

    const labels = result.map(item => item._id || 'Não informado');
    const data = result.map(item => item.count);

    res.json({ labels, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar dados por bairro' });
  }
};

// Casos por faixa etária e região anatômica
exports.faixaRegiao = async (req, res) => {
  try {
    const pipeline = [
      {
        $addFields: {
          idade: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$vitima.dataNascimento'] },
                1000 * 60 * 60 * 24 * 365
              ]
            }
          }
        }
      },
      {
        $bucket: {
          groupBy: "$idade",
          boundaries: [0, 18, 31, 46, 61, 150],
          default: "60+",
          output: { cases: { $push: "$$ROOT" } }
        }
      },
      {
        $unwind: "$cases"
      },
      {
        $group: {
          _id: { faixaEtaria: "$_id", regiao: "$cases.regiaoAnatomica" },
          count: { $sum: 1 }
        }
      }
    ];

    const result = await Case.aggregate(pipeline);

    // organizar labels e datasets para Chart.js stacked bar ou heatmap
    const faixas = ['0-17', '18-30', '31-45', '46-60', '60+'];
    const regioes = [...new Set(result.map(item => item._id.regiao))];

    let datasets = regioes.map(regiao => {
      return {
        label: regiao,
        data: faixas.map(faixa => {
          const found = result.find(r => r._id.faixaEtaria === faixa && r._id.regiao === regiao);
          return found ? found.count : 0;
        })
      };
    });

    res.json({ labels: faixas, datasets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar dados por faixa etária e região' });
  }
};

// Vítimas identificadas vs não identificadas
exports.identificacao = async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: "$vitima.identificada",
          count: { $sum: 1 }
        }
      }
    ];

    const result = await Case.aggregate(pipeline);

    const labels = result.map(item => item._id ? 'Identificada' : 'Não identificada');
    const data = result.map(item => item.count);

    res.json({ labels, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar dados de identificação' });
  }
};
