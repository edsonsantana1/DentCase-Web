const kmeans = require('ml-kmeans');
const Case = require('../models/Case');

// Função para calcular idade em pipeline com base em patientDOB
const calcularIdadePipeline = {
  $floor: {
    $divide: [
      { $subtract: [new Date(), '$patientDOB'] },
      1000 * 60 * 60 * 24 * 365
    ]
  }
};

// Vítimas por Faixa Etária 3


exports.faixaEtaria = async (req, res) => {
  try {
    const pipeline = [
      {
        $addFields: {
          idade: calcularIdadePipeline
        }
      },
      {
        $bucket: {
          groupBy: "$idade",
          boundaries: [0, 18, 31, 46, 61],
          default: 61, // bucket "60+"
          output: { count: { $sum: 1 } }
        }
      }
    ];

    const result = await Case.aggregate(pipeline);

    const labels = result.map(item => {
      switch(item._id) {
        case 0: return '0-17';
        case 18: return '18-30';
        case 31: return '31-45';
        case 46: return '46-60';
        case 61: return '60+';
        default: return item._id.toString();
      }
    });

    const data = result.map(item => item.count);

    res.json({ labels, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar dados de faixa etária' });
  }
};


// Gênero por tipo de ocorrência  4

exports.generoTipo = async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: { genero: "$patientGender", tipo: "$caseType" },
          count: { $sum: 1 }
        }
      }
    ];

    const result = await Case.aggregate(pipeline);

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


// Casos por bairro 5


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



// Vítimas identificadas vs não identificadas 6 

exports.identificacao = async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: "$identified",
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

//  Distribuição Temporal dos Casos
//  Nova função para retornar os dados agregados por mês

exports.temporalDistribuicao = async (req, res) => {
  try {
    const casosPorMes = await Case.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$dataOcorrencia" }
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const labels = casosPorMes.map(item => item._id);
    const data = casosPorMes.map(item => item.total);

    res.json({ labels, data });
  } catch (error) {
    console.error('Erro ao gerar gráfico temporal:', error);
    res.status(500).json({ error: 'Erro ao gerar gráfico temporal' });
  }
};




// Função auxiliar para cálculo de quantil
function quantile(arr, q) {
  const pos = (arr.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if ((arr[base + 1] !== undefined)) {
    return arr[base] + rest * (arr[base + 1] - arr[base]);
  } else {
    return arr[base];
  }
}


// Previsão de Casos (Regressão)  2


exports.getIdentificacaoRegressao = async (req, res) => {
  try {
    const labels = ['0-10', '11-20', '21-30', '31-40', '41-50'];

    // Pipeline de agregação para contar casos identificados por faixa etária
    const resultado = await Case.aggregate([
      {
        $addFields: {
          idade: {
            $divide: [
              { $subtract: [new Date(), '$vitima.dataNascimento'] },
              1000 * 60 * 60 * 24 * 365.25 // calcular idade em anos
            ]
          }
        }
      },
      {
        $bucket: {
          groupBy: '$idade',
          boundaries: [0, 11, 21, 31, 41, 51],
          default: 'Outros',
          output: {
            total: { $sum: 1 },
            identificados: {
              $sum: {
                $cond: [{ $eq: ['$vitima.identificado', true] }, 1, 0]
              }
            }
          }
        }
      }
    ]);

    // Montar pontos reais (proporção de identificados por faixa)
    const proporcoes = labels.map((label, i) => {
      const faixa = resultado[i];
      if (faixa && faixa.total > 0) {
        return faixa.identificados / faixa.total;
      } else {
        return 0;
      }
    });

    // Gerar linha de regressão simples (opcional — aqui usando mesma estrutura de exemplo)
    // Se quiser calcular uma regressão de verdade, posso te ajudar com isso.
    const regressao = gerarLinhaRegressao(proporcoes); // função abaixo

    res.json({
      labels,
      pontosReais: proporcoes,
      regressao
    });
  } catch (error) {
    console.error('Erro ao buscar dados de regressão:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// Gera uma linha de tendência linear simples baseada nos pontos reais
function gerarLinhaRegressao(pontos) {
  const n = pontos.length;
  const x = [...Array(n).keys()];
  const y = pontos;

  const mediaX = x.reduce((a, b) => a + b, 0) / n;
  const mediaY = y.reduce((a, b) => a + b, 0) / n;

  const numerador = x.reduce((sum, xi, i) => sum + (xi - mediaX) * (y[i] - mediaY), 0);
  const denominador = x.reduce((sum, xi) => sum + Math.pow(xi - mediaX, 2), 0);
  const m = numerador / denominador;
  const b = mediaY - m * mediaX;

  // y = mx + b para cada x
  return x.map(xi => m * xi + b);
}




