window.addEventListener('DOMContentLoaded', async function () {
  const API_BASE_URL = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://laudos-pericias.onrender.com';

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
            backgroundColor: '#700C0C'
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

  async function renderGeneroTipoChart() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/genero-tipo`);
      const data = await res.json();

      new Chart(document.getElementById('generoTipoChart'), {
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
      console.error('Erro ao carregar gráfico de gênero/tipo:', err);
    }
  }

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
            backgroundColor: ['#36A2EB', '#FF6384'] // cor verde, pode trocar
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

  async function renderIdentificacaoChart() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/identificacao`);
      const data = await res.json();

      new Chart(document.getElementById('identificacaoChart'), {
        type: 'doughnut',
        data: {
          labels: data.labels,
          datasets: [{
            label: 'Vítimas',
            data: data.data,
            backgroundColor: data.backgroundColor
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

  // Chamada de todos os gráficos
  renderFaixaEtariaChart();
  renderGeneroTipoChart();
  renderBairroChart();
  renderFaixaRegiaoChart();
  renderIdentificacaoChart();
});
