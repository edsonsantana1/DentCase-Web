window.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'https://dentcase-backend.onrender.com';

  // 1) Distribuição Temporal dos Casos
  async function renderDistribuicaoTemporalChart() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/temporal`);
      if (!res.ok) {
        console.error(`Erro HTTP ${res.status} ao buscar /temporal: ${res.statusText}`);
        return;
      }
      const data = await res.json();

      if (!data.labels?.length || !data.data?.length) {
        console.error("Nenhum dado válido recebido da API (temporal).");
        return;
      }

      const ctx = document.getElementById('temporalChartDistribuicao');
      new Chart(ctx, {
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
            y: { beginAtZero: true, title: { display: true, text: 'Número de Casos' } },
            x: { title: { display: true, text: 'Mês/Ano' } }
          }
        }
      });
    } catch (err) {
      console.error('Erro ao carregar gráfico de distribuição temporal:', err);
    }
  }

  // 2) Previsão de Casos (Regressão)
  async function renderIdentificacaoRegressaoChart() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/identificacao-regressao`);
      if (!res.ok) {
        console.error(`Erro HTTP ${res.status} ao buscar /identificacao-regressao: ${res.statusText}`);
        return;
      }
      const data = await res.json();

      const ctx = document.getElementById('regressaoChart');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: 'Proporção real de vítimas identificadas',
              data: data.pontosReais,
              type: 'scatter',
              showLine: false,
              pointRadius: 5,
              borderColor: 'rgba(54, 162, 235, 0.7)',
              backgroundColor: 'rgba(54, 162, 235, 0.3)'
            },
            {
              label: 'Curva de regressão logística',
              data: data.regressao,
              type: 'line',
              tension: 0.3,
              borderColor: '#700C0C',
              backgroundColor: 'rgba(112, 12, 12, 0.2)',
              pointRadius: 0,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: { min: 0, max: 1, title: { display: true, text: 'Probabilidade de Identificação' } },
            x: { title: { display: true, text: 'Faixa Etária' } }
          }
        }
      });
    } catch (err) {
      console.error('Erro ao carregar gráfico de regressão de identificação:', err);
    }
  }

  // 3) Vítimas por Faixa Etária
  async function renderFaixaEtariaChart() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/faixa-etaria`);
      if (!res.ok) {
        console.error(`Erro HTTP ${res.status} ao buscar /faixa-etaria: ${res.statusText}`);
        return;
      }
      const data = await res.json();

      const ctx = document.getElementById('faixaEtariaChart');
      new Chart(ctx, {
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

  // 4) Gênero por Tipo de Ocorrência
  async function renderGeneroTipoChart() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/genero-tipo`);
      if (!res.ok) {
        console.error(`Erro HTTP ${res.status} ao buscar /genero-tipo: ${res.statusText}`);
        return;
      }
      const data = await res.json();

      const cores = ['#3a1414', '#C23B22', '#700C0C'];
      data.datasets.forEach((ds, i) => ds.backgroundColor = cores[i % cores.length]);

      const ctx = document.getElementById('generoTipoChart');
      new Chart(ctx, {
        type: 'bar',
        data: { labels: data.labels, datasets: data.datasets },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 20, font: { size: 12 } } }
          },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Número de Casos' } },
            x: { title: { display: true, text: 'Gênero' } }
          }
        }
      });
    } catch (err) {
      console.error('Erro ao carregar gráfico de gênero/tipo:', err);
    }
  }

  // 5) Casos por Bairro
  async function renderBairroChart() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/bairro`);
      if (!res.ok) {
        console.error(`Erro HTTP ${res.status} ao buscar /bairro: ${res.statusText}`);
        return;
      }
      const data = await res.json();

      const ctx = document.getElementById('bairroChart');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: [{
            label: 'Número de casos',
            data: data.data,
            backgroundColor: ['#4e1b1b', '#ad3c3c']
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Número de Casos' } },
            x: { title: { display: true, text: 'Bairros' } }
          }
        }
      });

      const total = data.data.reduce((sum, v) => sum + v, 0);
      document.getElementById('totalCasosBairro').textContent = `Total de casos: ${total}`;
    } catch (err) {
      console.error('Erro ao carregar gráfico de bairros:', err);
    }
  }

  // 6) Vítimas Identificadas vs Não Identificadas
  async function renderIdentificacaoChart() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/identificacao`);
      if (!res.ok) {
        console.error(`Erro HTTP ${res.status} ao buscar /identificacao: ${res.statusText}`);
        return;
      }
      const data = await res.json();

      const labelsComValores = data.labels.map((lab, i) => `${lab} (${data.data[i]})`);
      const ctx = document.getElementById('identificacaoChart');
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labelsComValores,
          datasets: [{
            label: 'Vítimas',
            data: data.data,
            backgroundColor: ['#4e1b1b', '#ad3c3c']
          }]
        },
        options: { responsive: true }
      });
    } catch (err) {
      console.error('Erro ao carregar gráfico de identificação:', err);
    }
  }

  // === chamadas iniciais ===
  renderDistribuicaoTemporalChart();
  renderIdentificacaoRegressaoChart();
  renderFaixaEtariaChart();
  renderGeneroTipoChart();
  renderBairroChart();
  renderIdentificacaoChart();
});
