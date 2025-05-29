const express = require('express');
const router = express.Router();
const Case = require('../models/Case'); // ajuste o caminho conforme seu projeto

// 1. Vítimas por faixa etária
router.get('/faixa-etaria', async (req, res) => {
  try {
    const pipeline = [
      {
        $addFields: {
          idade: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$patientDOB'] },
                1000 * 60 * 60 * 24 * 365
              ]
            }
          }
        }
      },
      {
        $bucket: {
          groupBy: '$idade',
          boundaries: [0, 10, 20, 30, 40, 50, 60, 150],
          default: '60+',
          output: { count: { $sum: 1 } }
        }
      }
    ];

    const result = await Case.aggregate(pipeline);

    const labels = result.map(item => {
      if (typeof item._id === 'number') {
        if (item._id === 150) return '60+';
        return `${item._id}-${item._id + 9}`;
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
});

// 2. Gênero por tipo de ocorrência
router.get('/genero-tipo', async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: { gender: '$patientGender', caseType: '$caseType' },
          count: { $sum: 1 }
        }
      }
    ];

    const rawData = await Case.aggregate(pipeline);

    // Estrutura para front: labels = tipos, datasets por gênero
    const tipos = [...new Set(rawData.map(d => d._id.caseType))];
    const generos = [...new Set(rawData.map(d => d._id.gender))];

    // Monta os dados por gênero
    const datasets = generos.map(gender => {
      return {
        label: gender,
        data: tipos.map(tipo => {
          const found = rawData.find(d => d._id.gender === gender && d._id.caseType === tipo);
          return found ? found.count : 0;
        }),
        backgroundColor: gender === 'masculino' ? '#007bff' :
                         gender === 'feminino' ? '#e83e8c' : '#6c757d'
      };
    });

    res.json({ labels: tipos, datasets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar dados de gênero por tipo' });
  }
});

// 3. Casos por bairro
router.get('/bairro', async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: '$bairro',
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
});

// 4. Casos por faixa etária e região anatômica (injuryRegions)
router.get('/faixa-regiao', async (req, res) => {
  try {
    // Primeiro pipeline para faixa etária
    const pipeline = [
      {
        $addFields: {
          idade: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$patientDOB'] },
                1000 * 60 * 60 * 24 * 365
              ]
            }
          }
        }
      },
      {
        $unwind: '$injuryRegions'
      },
      {
        $bucket: {
          groupBy: '$idade',
          boundaries: [0, 10, 20, 30, 40, 50, 60, 150],
          default: '60+',
          output: {
            regions: {
              $push: '$injuryRegions'
            },
            count: { $sum: 1 }
          }
        }
      }
    ];

    // Esse pipeline é complexo, melhor quebrar por faixa e região:
    // Alternativa: buscar agrupado por faixa e região

    const result = await Case.aggregate([
      {
        $addFields: {
          idade: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$patientDOB'] },
                1000 * 60 * 60 * 24 * 365
              ]
            }
          }
        }
      },
      { $unwind: '$injuryRegions' },
      {
        $bucket: {
          groupBy: '$idade',
          boundaries: [0, 10, 20, 30, 40, 50, 60, 150],
          default: '60+',
          output: {
            regions: {
              $push: '$injuryRegions'
            },
            count: { $sum: 1 }
          }
        }
      }
    ]);

    // Melhor fazer agrupamento por faixa etária e região separado:
    const faixaBoundaries = [0, 10, 20, 30, 40, 50, 60, 150];
    const faixaLabels = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60+'];

    // Pipeline para agrupar por faixa etária (label) e região
    const agg = await Case.aggregate([
      {
        $addFields: {
          idade: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$patientDOB'] },
                1000 * 60 * 60 * 24 * 365
              ]
            }
          }
        }
      },
      { $unwind: '$injuryRegions' },
      {
        $addFields: {
          faixaEtaria: {
            $switch: {
              branches: faixaBoundaries.slice(0, -1).map((b, i) => ({
                case: { $and: [{ $gte: ['$idade', b] }, { $lt: ['$idade', faixaBoundaries[i + 1]] }] },
                then: faixaLabels[i]
              })),
              default: '60+'
            }
          }
        }
      },
      {
        $group: {
          _id: { faixaEtaria: '$faixaEtaria', regiao: '$injuryRegions' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Montar a estrutura para frontend (labels de faixa e regiões, matriz de dados)
    const regioes = [...new Set(agg.map(d => d._id.regiao))];
    const faixas = [...new Set(agg.map(d => d._id.faixaEtaria))].sort((a, b) => faixaLabels.indexOf(a) - faixaLabels.indexOf(b));

    // Matriz de dados por faixa (linhas) e região (colunas)
    const dataMatrix = faixas.map(faixa => {
      return regioes.map(regiao => {
        const found = agg.find(d => d._id.faixaEtaria === faixa && d._id.regiao === regiao);
        return found ? found.count : 0;
      });
    });

    res.json({ faixas, regioes, dataMatrix });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar dados faixa etária e região' });
  }
});

// 5. Vítimas identificadas vs não identificadas
router.get('/identificacao', async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: '$identified',
          count: { $sum: 1 }
        }
      }
    ];

    const result = await Case.aggregate(pipeline);

    const labels = result.map(item => item._id ? 'Identificada' : 'Não Identificada');
    const data = result.map(item => item.count);

    res.json({ labels, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar dados de identificação' });
  }
});

module.exports = router;
