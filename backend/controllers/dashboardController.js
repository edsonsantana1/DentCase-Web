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

// Faixa etária
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

// Gênero por tipo de ocorrência
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
          idade: calcularIdadePipeline
        }
      },
      {
        $bucket: {
          groupBy: "$idade",
          boundaries: [0, 18, 31, 46, 61, 150],
          default: 150, // bucket "60+"
          output: { cases: { $push: "$$ROOT" } }
        }
      },
      {
        $unwind: "$cases"
      },
      // Como injuryRegions é array com string como "mandíbula, dentes" (uma string única),
      // precisamos separar as regiões em elementos individuais antes do group.
      // Para isso, usaremos $split para transformar string em array, depois $unwind.
      {
        $addFields: {
          regioesSeparadas: {
            $split: [
              {
                $reduce: {
                  input: "$cases.injuryRegions",
                  initialValue: "",
                  in: { $concat: ["$$value", ", ", "$$this"] }
                }
              }, ", "
            ]
          }
        }
      },
      {
        $unwind: "$cases.injuryRegions"
      },
      {
        $group: {
          _id: { faixaEtaria: "$_id", regiao: "$regioesSeparadas" },
          count: { $sum: 1 }
        }
      }
      
    ];

    const result = await Case.aggregate(pipeline);

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



// Controller para boxplot casos por bairro
exports.boxplotCasosPorBairro = async (req, res) => {
  try {
    // Agrupa por bairro e dia, conta casos
    const casosDiarios = await Case.aggregate([
      {
        $match: { bairro: { $exists: true, $ne: null }, dataOcorrencia: { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: {
            bairro: "$bairro",
            dia: { $dateToString: { format: "%Y-%m-%d", date: "$dataOcorrencia" } }
          },
          totalCasosDia: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.bairro",
          casosPorDia: { $push: "$totalCasosDia" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Para cada bairro, calculamos min, Q1, mediana, Q3, max
    const result = casosDiarios.map(bairroData => {
      const sorted = bairroData.casosPorDia.slice().sort((a, b) => a - b);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const median = quantile(sorted, 0.5);
      const q1 = quantile(sorted, 0.25);
      const q3 = quantile(sorted, 0.75);

      return {
        bairro: bairroData._id,
        min,
        q1,
        median,
        q3,
        max
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar boxplot casos por bairro:', error);
    res.status(500).json({ error: 'Erro ao gerar boxplot casos por bairro' });
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


// Exemplo simples com dados estáticos.
// Ideal: você busca dados reais do banco e faz cálculo de regressão (ex: regressão logística).

exports.getIdentificacaoRegressao = async (req, res) => {
  try {
    // Labels para eixo X (faixas etárias)
    const labels = ['0-10', '11-20', '21-30', '31-40', '41-50'];

    // Proporção real de vítimas identificadas por faixa etária (exemplo)
    const pontosReais = [0.2, 0.35, 0.5, 0.7, 0.8];

    // Valores estimados pela regressão (linha de tendência)
    const regressao = [0.18, 0.33, 0.52, 0.68, 0.82];

    res.json({
      labels,
      pontosReais,
      regressao
    });
  } catch (error) {
    console.error('Erro ao buscar dados de regressão:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};


// K-means clustering para casos

exports.identificacaoCasos = async (req, res) => {
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
    console.error("Erro ao buscar dados de identificação:", error);
    res.status(500).json({ error: "Erro ao buscar dados de identificação" });
  }
};


// distribuiçaõ de casos por bairro (Boxplot)

exports.boxplotComparacaoCasos = async (req, res) => {
  try {
    const casosAgrupados = await Case.aggregate([
      {
        $match: { categoria: { $exists: true }, dataOcorrencia: { $exists: true } }
      },
      {
        $group: {
          _id: "$categoria",
          casosPorPeriodo: { $push: "$quantidadeCasos" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    if (!casosAgrupados.length) {
      return res.status(404).json({ error: "Nenhum dado encontrado!" });
    }

    res.json(casosAgrupados);
  } catch (error) {
    console.error("Erro ao gerar boxplot de comparação:", error);
    res.status(500).json({ error: "Erro ao gerar boxplot de comparação." });
  }
};



// Distribuição temporal dos casos   (gráfico de linha)exports.distribuicaoTemporal = async (req, res) => {
  exports.distribuicaoTemporal = async (req, res) => {
    try {
      const casosPorMes = await Case.aggregate([
        { $match: { incidentDate: { $exists: true, $ne: null } } },  // Alterado para incidentDate
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$incidentDate" } }, totalCasos: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
  
      console.log("Casos por mês encontrados:", JSON.stringify(casosPorMes, null, 2));
  
      if (!casosPorMes.length) {
        return res.status(404).json({ error: "Nenhum dado encontrado!" });
      }
  
      res.json({
        labels: casosPorMes.map(d => d._id),
        data: casosPorMes.map(d => d.totalCasos)
      });
    } catch (error) {
      console.error("Erro ao gerar distribuição temporal:", error);
      res.status(500).json({ error: "Erro ao gerar distribuição temporal." });
    }
  };