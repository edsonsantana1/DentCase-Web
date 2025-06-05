window.addEventListener('DOMContentLoaded', async function () {
  const API_BASE_URL = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://laudos-pericias.onrender.com';


// Vítimas por Faixa Etária 3

  async function renderFaixaEtariaChart() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/faixa-etaria`);
      const data = await res.json();

      new Chart(document.getElementById('faixaEtariaChart'), {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: [{
            label: 'Número de vítimas',
            data: data.data,
            backgroundColor: ['#4e1b1b', '#ad3c3c']
          }]
        },
        options: {
          responsive: true,
          scales: { y: { beginAtZero: true } }
        }
      });
    } catch (err) {
      console.error('Erro ao carregar gráfico de faixa etária:', err);
    }
  }

  // Gênero por Tipo de Ocorrência 4


  async function renderGeneroTipoChart() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/genero-tipo`);
      const data = await res.json();
  
      // Lista de cores para aplicar aos datasets
      const cores = ['#3a1414', '#C23B22', '#700C0C'];
  
      // Atribui uma cor única (string) para cada dataset
      data.datasets.forEach((dataset, i) => {
        dataset.backgroundColor = cores[i % cores.length];
      });
  
      new Chart(document.getElementById('generoTipoChart'), {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: data.datasets
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 20,
                font: {
                  size: 12
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Número de Casos'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Gênero'
              }
            }
          }
        }
      });
  
    } catch (err) {
      console.error('Erro ao carregar gráfico de gênero/tipo:', err);
    }
  }
  



// Casos por Bairro  5


  async function renderBairroChart() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/bairro`);
      const data = await res.json();

      new Chart(document.getElementById('bairroChart'), {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: [{
            label: 'Número de casos',
            data: data.data,
            backgroundColor: ['#4e1b1b', '#ad3c3c'] // cor verde, pode trocar
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Número de Casos' }
            },
            x: {
              title: { display: true, text: 'Bairros' }
            }
          }
        }
      });
      
    } catch (err) {
      console.error('Erro ao carregar gráfico de bairros:', err);
    }
  }

  async function renderFaixaRegiaoChart() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/faixa-regiao`);
      const data = await res.json();

      new Chart(document.getElementById('faixaRegiaoChart'), {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: data.datasets
        },
        options: {
          responsive: true,
          scales: { y: { beginAtZero: true } }
        }
      });
    } catch (err) {
      console.error('Erro ao carregar gráfico de faixa etária por região:', err);
    }
  }

  
// Vítimas Identificadas vs Não Identificadas 6



  async function renderIdentificacaoChart() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/identificacao`);
      const data = await res.json();

            // Adiciona os valores aos labels
      const labelsComValores = data.labels.map((label, i) => `${label} (${data.data[i]})`);

      new Chart(document.getElementById('identificacaoChart'), {
        type: 'doughnut',
        data: {
          labels: labelsComValores,
          datasets: [{
            label: 'Vítimas',
            data: data.data,
            backgroundColor: data,backgroundColor: ['#4e1b1b', '#ad3c3c']
          }]
        },
        options: {
          responsive: true
        }
      });
    } catch (err) {
      console.error('Erro ao carregar gráfico de identificação:', err);
    }
  }

  // Previsão de Casos (Regressão) 2


  
  async function renderTemporalChart() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/temporal`);
      const data = await res.json();
  
      new Chart(document.getElementById('temporalChart'), {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [{
            label: 'Casos por mês',
            data: data.data,
            borderColor: '#700C0C',
            backgroundColor: 'rgba(71, 67, 67, 0.2)',
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Número de Casos' }
            },
            x: {
              title: { display: true, text: 'Mês/Ano' }
            }
          }
        }
      });
  
    } catch (err) {
      console.error('Erro ao carregar gráfico temporal:', err);
    }
  }
  

  async function renderIdentificacaoRegressaoChart() {
    const API_BASE_URL = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : 'https://laudos-pericias.onrender.com';
  
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/identificacao-regressao`);
      const data = await res.json();
  
      new Chart(document.getElementById('regressaoChart'), {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: 'Proporção real de vítimas identificadas',
              data: data.pontosReais,
              borderColor: 'rgba(54, 162, 235, 0.7)',
              backgroundColor: 'rgba(54, 162, 235, 0.3)',
              fill: false,
              tension: 0,
              pointRadius: 5,
              showLine: false, // Exibe apenas os pontos
              type: 'scatter'
            },
            {
              label: 'Curva de regressão logística',
              data: data.regressao,
              borderColor: '#700C0C',
              backgroundColor: 'rgba(112, 12, 12, 0.2)',
              fill: false,
              tension: 0.3,
              pointRadius: 0,
              type: 'line'
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              min: 0,
              max: 1,
              title: { display: true, text: 'Probabilidade de Identificação' }
            },
            x: {
              title: { display: true, text: 'Faixa Etária' }
            }
          }
        }
      });
    } catch (err) {
      console.error('Erro ao carregar gráfico de regressão de identificação:', err);
    }
  }


  
  // Distribuição Temporal dos Casos  1

  window.addEventListener('DOMContentLoaded', function () {
    renderDistribuicaoTemporalChart();
  });
  
  async function renderDistribuicaoTemporalChart() {
    const API_BASE_URL = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : 'https://laudos-pericias.onrender.com';
  
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/distribuicao-temporal`);
      const data = await res.json();
  
      console.log("Dados da API (Distribuição Temporal):", data);
  
      // Verificação correta com base na estrutura real do JSON
      if (!data.labels || !data.data || data.labels.length === 0 || data.data.length === 0) {
        console.error("Nenhum dado recebido da API!");
        return;
      }
  
      const canvas = document.getElementById('temporalChartDistribuicao');
      if (!canvas) {
        console.error("Canvas com id 'temporalChartDistribuicao' não encontrado.");
        return;
      }
  
      new Chart(canvas, {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [{
            label: 'Casos por Mês',
            data: data.data,
            borderColor: '#700C0C',
            backgroundColor: 'rgba(112, 12, 12, 0.2)',
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Número de Casos'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Mês/Ano'
              }
            }
          }
        }
      });
  
    } catch (error) {
      console.error("Erro ao carregar gráfico de distribuição temporal:", error);
    }
  }
  
  renderDistribuicaoTemporalChart();

  
  
  
  
  // Chamada de todos os gráficos
  renderFaixaEtariaChart();
  renderGeneroTipoChart();
  renderBairroChart();
  renderFaixaRegiaoChart();
  renderIdentificacaoChart();
  renderTemporalChart();
  renderIdentificacaoRegressaoChart();
  renderClusterChart();


  
  



});
