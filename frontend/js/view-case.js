document.addEventListener('DOMContentLoaded', function () {
  const API_BASE_URL = 'http://localhost:3000/api';
  
  // Função utilitária para pegar elementos com segurança
  function getElementSafe(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`Elemento com id "${id}" não encontrado.`);
    return el;
  }

  // Menu toggle
  const menuToggle = getElementSafe('menu-toggle');
  const sidebar = document.querySelector('.sidebar');

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar?.classList.toggle('active');
    });
  }

  // Obter ID do caso pela URL
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('id');

  if (!caseId) {
    alert('Caso não encontrado.');
    window.location.href = 'list-case.html';
    return;
  }

  // Obter dados do usuário
  const userRole = localStorage.getItem('userRole');
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Você precisa estar logado para acessar esta página.');
    window.location.href = 'login.html';
    return;
  }

  // Elementos dos modais
  const evidenceModal = getElementSafe('evidence-modal');
  const reportModal = getElementSafe('report-modal');
  const closeButtons = document.querySelectorAll('.close');

  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (evidenceModal) evidenceModal.style.display = 'none';
      if (reportModal) reportModal.style.display = 'none';
    });
  });

  // Elementos para edição in-place
  const viewMode = getElementSafe('view-mode');
  const editMode = getElementSafe('edit-mode');
  const editButton = getElementSafe('edit-case');
  const cancelEdit = getElementSafe('cancel-edit');
  const saveEdit = getElementSafe('save-edit');

  // Configuração da interface
  async function setupUI() {
    try {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erro ao verificar permissões.');

      const caseData = await response.json();
      const isOwner = caseData.assignedUser?.toString() === userId;

      if (userRole === 'admin') {
        editButton?.style.setProperty('display', 'inline-block');
        getElementSafe('delete-case')?.style.setProperty('display', 'inline-block');
        getElementSafe('add-evidence')?.style.setProperty('display', 'inline-block');
      } else if (userRole === 'perito') {
        editButton?.style.setProperty('display', isOwner ? 'inline-block' : 'none');
        getElementSafe('delete-case')?.style.setProperty('display', 'none');
        getElementSafe('add-evidence')?.style.setProperty('display', isOwner ? 'inline-block' : 'none');
      } else if (userRole === 'assistente') {
        editButton?.style.setProperty('display', 'none');
        getElementSafe('delete-case')?.style.setProperty('display', 'none');
        getElementSafe('add-evidence')?.style.setProperty('display', isOwner ? 'inline-block' : 'none');
      }

    } catch (error) {
      console.error('Erro ao configurar UI:', error);
    }
  }

  // Carregar detalhes do caso
  async function loadCaseDetails() {
    try {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Caso não encontrado');
      }

      const caseData = await response.json();
      console.log('Dados do caso:', caseData);

      // Preencher informações
      getElementSafe('case-title').textContent = `${caseData.patientName} - ${caseData.incidentDescription?.slice(0, 50) || ''}${caseData.incidentDescription?.length > 50 ? '...' : ''}`;
      getElementSafe('case-id').textContent = `#${caseData.caseId || caseData._id}`;
      getElementSafe('case-status').textContent = caseData.status;
      getElementSafe('case-status').className = `case-status status-${caseData.status?.toLowerCase().replace(' ', '-') || 'desconhecido'}`;
      getElementSafe('case-description').textContent = caseData.description || 'Sem descrição';
      getElementSafe('case-date').textContent = caseData.createdAt ? new Date(caseData.createdAt).toLocaleDateString('pt-BR') : 'Não informado';
      getElementSafe('case-expert').textContent = caseData.assignedUser?.name || 'Não informado';

      getElementSafe('patient-name').textContent = caseData.patientName || 'Não informado';
      getElementSafe('patient-dob').textContent = caseData.patientDOB ? new Date(caseData.patientDOB).toLocaleDateString('pt-BR') : 'Não informado';
      getElementSafe('patient-gender').textContent = caseData.patientGender || 'Não informado';
      getElementSafe('patient-id').textContent = caseData.patientID || 'Não informado';
      getElementSafe('patient-contact').textContent = caseData.patientContact || 'Não informado';

      getElementSafe('incident-date').textContent = caseData.incidentDate ? new Date(caseData.incidentDate).toLocaleString('pt-BR') : 'Não informado';
      getElementSafe('incident-location').textContent = caseData.incidentLocation || 'Não informado';
      getElementSafe('incident-description').textContent = caseData.incidentDescription || 'Não informado';
      getElementSafe('incident-weapon').textContent = caseData.incidentWeapon || 'Não informado';

      getElementSafe('estado').textContent = caseData.estado || 'Não informado';
      getElementSafe('bairro').textContent = caseData.bairro || 'Não informado';
      getElementSafe('case-type').textContent = caseData.caseType || 'Não informado';
      getElementSafe('identified').textContent = caseData.identified ? 'Sim' : 'Não';
      getElementSafe('injury-regions').textContent = Array.isArray(caseData.injuryRegions) ? caseData.injuryRegions.join(', ') : (caseData.injuryRegions || 'Não informado');


      await loadEvidences();
    } catch (error) {
      console.error('Erro ao carregar caso:', error);
      alert(`Erro ao carregar detalhes do caso: ${error.message}`);
      window.location.href = 'list-case.html';
    }
  }

  // Função para preencher o formulário de edição com os dados atuais
  function populateEditForm() {
    document.getElementById('edit-case-description').value = document.getElementById('case-description').textContent;
    document.getElementById('edit-patient-name').value = document.getElementById('patient-name').textContent;
    document.getElementById('edit-patient-dob').value = formatDateForInput(document.getElementById('patient-dob').textContent);
    document.getElementById('edit-patient-gender').value = document.getElementById('patient-gender').textContent.toLowerCase() || 'nao_informado';
    document.getElementById('edit-patient-id').value = document.getElementById('patient-id').textContent;
    document.getElementById('edit-patient-contact').value = document.getElementById('patient-contact').textContent;
    document.getElementById('edit-incident-date').value = formatDateTimeForInput(document.getElementById('incident-date').textContent);
    document.getElementById('edit-incident-location').value = document.getElementById('incident-location').textContent;
    document.getElementById('edit-incident-description').value = document.getElementById('incident-description').textContent;
    document.getElementById('edit-incident-weapon').value = document.getElementById('incident-weapon').textContent;
    document.getElementById('edit-estado').value = document.getElementById('estado').textContent;
    document.getElementById('edit-bairro').value = document.getElementById('bairro').textContent;
    document.getElementById('edit-case-type').value = document.getElementById('case-type').textContent;
    document.getElementById('edit-identified').checked = document.getElementById('identified').textContent.toLowerCase() === 'sim';
    document.getElementById('edit-injury-regions').value = document.getElementById('injury-regions').textContent;

  }

  // Delegation: adiciona listener para os botões Gerar Relatório das evidências
 // Delegation: adiciona listener para os botões Gerar Relatório das evidências
document.addEventListener('DOMContentLoaded', () => {
  const evidenceList = document.getElementById('evidence-list');
  if (!evidenceList) {
    return console.error('Elemento evidence-list não encontrado');
  }

  evidenceList.addEventListener('click', async (event) => {
    if (event.target.classList.contains('btn-generate-report')) {
      const evidenceId = event.target.getAttribute('data-evidence-id');
      if (!evidenceId) return alert('ID da evidência não encontrado.');

      const token = localStorage.getItem('token');
      if (!token) return alert('Usuário não autenticado');

      try {
        const response = await fetch(`${API_BASE_URL}/evidences/${evidenceId}/report`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao gerar relatório');
        }

        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/pdf')) {
          throw new Error('Resposta da API não é um PDF');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url);
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);

      } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        alert(`Falha ao gerar relatório: ${error.message}`);
      }
    }
  });
});

  


  // Funções auxiliares para formatação de datas
  function formatDateForInput(dateString) {
    if (!dateString || dateString === 'Não informado') return '';
    const parts = dateString.split('/');
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }

  function formatDateTimeForInput(dateTimeString) {
    if (!dateTimeString || dateTimeString === 'Não informado') return '';
    const [datePart, timePart] = dateTimeString.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hours, minutes] = timePart.split(':');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }

  // Alternar entre modos de visualização e edição
  function toggleEditMode(enable) {
    if (enable) {
      populateEditForm();
      viewMode.style.display = 'none';
      editMode.style.display = 'block';
    } else {
      viewMode.style.display = 'block';
      editMode.style.display = 'none';
    }
  }

  // Event listeners para edição
  if (editButton && cancelEdit && saveEdit) {
    editButton.addEventListener('click', () => toggleEditMode(true));
    cancelEdit.addEventListener('click', () => toggleEditMode(false));
    
    saveEdit.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const updatedData = {
        description: document.getElementById('edit-case-description').value,
        patientName: document.getElementById('edit-patient-name').value,
        patientDOB: document.getElementById('edit-patient-dob').value,
        patientGender: document.getElementById('edit-patient-gender').value,
        patientID: document.getElementById('edit-patient-id').value,
        patientContact: document.getElementById('edit-patient-contact').value,
        incidentDate: document.getElementById('edit-incident-date').value,
        incidentLocation: document.getElementById('edit-incident-location').value,
        incidentDescription: document.getElementById('edit-incident-description').value,
        incidentWeapon: document.getElementById('edit-incident-weapon').value
  
      };

      try {
        const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao atualizar caso');
        }

        alert('Caso atualizado com sucesso!');
        await loadCaseDetails();
        toggleEditMode(false);
      } catch (error) {
        console.error('Erro ao atualizar caso:', error);
        alert(`Falha ao atualizar caso: ${error.message}`);
      }
    });
  }

  // Carregar evidências
  async function loadEvidences() {
    const evidenceList = getElementSafe('evidence-list');
    const emptyMessage = getElementSafe('empty-evidence-message');
  
    try {
      const response = await fetch(`${API_BASE_URL}/evidences/case/${caseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
  
      if (!response.ok) throw new Error('Erro ao carregar evidências');
  
      const evidences = await response.json();
  
      if (!evidences.length) {
        if (emptyMessage) emptyMessage.style.display = 'block';
        if (evidenceList) evidenceList.innerHTML = '';
        return;
      }
  
      if (emptyMessage) emptyMessage.style.display = 'none';
      if (evidenceList) evidenceList.innerHTML = '';
  
      evidences.forEach(ev => {
        const div = document.createElement('div');
        div.className = 'evidence-item';
        div.innerHTML = `
          <div class="evidence-content">
            <h4>${ev.collectionDate ? new Date(ev.collectionDate).toLocaleDateString('pt-BR') : 'Data não informada'} ${ev.collectionTime ? ' - ' + ev.collectionTime : ''}</h4>
            <p>${ev.description || 'Descrição não informada'}</p>
            ${ev.latitude && ev.longitude ? `<p><strong>Local:</strong> ${ev.latitude}, ${ev.longitude}</p>` : ''}
            ${ev.imageUrl ? `<img src="${ev.imageUrl}" alt="Evidência" class="evidence-image">` : ''}
            <p><strong>Adicionada por:</strong> ${ev.addedBy?.name || 'Usuário não informado'}</p>
            <button class="btn-generate-report" data-evidence-id="${ev._id}">Gerar Laudo</button>
          </div>
        `;
        if (evidenceList) evidenceList.appendChild(div);
      });
      
  
    } catch (error) {
      console.error('Erro ao carregar evidências:', error);
      if (emptyMessage) {
        emptyMessage.style.display = 'block';
        emptyMessage.innerHTML = '<p>Erro ao carregar evidências. Tente recarregar a página.</p>';
      }
    }
  }

  // Abrir modal de adicionar evidência
  getElementSafe('add-evidence')?.addEventListener('click', () => {
    const today = new Date().toISOString().split('T')[0];
    getElementSafe('collection-date').value = today;
    if (evidenceModal) evidenceModal.style.display = 'block';
  });

 // Submeter evidência 
 getElementSafe('evidence-form')?.addEventListener('submit', async function (e) {
  e.preventDefault();

  const form = e.target;

  const collectionDate = form.querySelector('#collection-date').value || new Date().toISOString();
  const collectionTime = form.querySelector('#collection-time').value || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const description = form.querySelector('#evidence-description-field').value.trim();
  const latitude = form.querySelector('#evidence-lat').value.trim();
  const longitude = form.querySelector('#evidence-long').value.trim();
  const imageUrl = form.querySelector('#evidence-image-url').value.trim();
  const fileInput = form.querySelector('#evidence-file');
  const file = fileInput.files[0]; // pegar o arquivo selecionado

  if (!description) {
    alert('Por favor, insira uma descrição para a evidência.');
    return;
  }

  const formData = new FormData();

  // Dados texto
  formData.append('case', caseId);
  formData.append('collectionDate', collectionDate);
  formData.append('collectionTime', collectionTime);
  formData.append('description', description);
  formData.append('latitude', latitude || '');
  formData.append('longitude', longitude || '');

  // URL de imagem (se preenchida)
  if (imageUrl) {
    formData.append('imageUrl', imageUrl);
  }

  // Arquivo (se selecionado)
  if (file) {
    formData.append('imageFile', file);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/evidences`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}` // NÃO passar 'Content-Type' aqui, deixe o browser definir o multipart boundary
      },
      body: formData
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Erro ao adicionar evidência');
    }

    alert('Evidência adicionada com sucesso!');
    if (evidenceModal) evidenceModal.style.display = 'none';
    form.reset();
    
    await loadEvidences();

  } catch (error) {
    console.error('Erro:', error);
    alert(`Falha ao adicionar evidência: ${error.message}`);
  }
});

  // Usar Minha Localização

  const btnUseLocation = document.getElementById('get-location');
  const inputLat = document.getElementById('evidence-lat');
  const inputLong = document.getElementById('evidence-long');

  btnUseLocation?.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Geolocalização não é suportada pelo seu navegador.');
    return;
  }

  btnUseLocation.disabled = true;
  btnUseLocation.textContent = 'Obtendo localização...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      inputLat.value = position.coords.latitude.toFixed(6);
      inputLong.value = position.coords.longitude.toFixed(6);

      alert('Localização preenchida com sucesso!');

      btnUseLocation.disabled = false;
      btnUseLocation.innerHTML = '<i class="fas fa-map-marker-alt"></i> Usar Minha Localização';
    },
    (error) => {
      alert('Erro ao obter localização: ' + error.message);
      btnUseLocation.disabled = false;
      btnUseLocation.innerHTML = '<i class="fas fa-map-marker-alt"></i> Usar Minha Localização';
    }
  );
});


  // Excluir caso
  getElementSafe('delete-case')?.addEventListener('click', async () => {
    if (!confirm('Tem certeza que deseja excluir este caso permanentemente?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir caso');
      }

      alert('Caso excluído com sucesso!');
      window.location.href = 'list-case.html';

    } catch (error) {
      console.error('Erro:', error);
      alert(`Erro ao excluir caso: ${error.message}`);
    }
  });

  // Inicializar
  setupUI();
  loadCaseDetails();
});






// Modal de Relatório
// Referências dos elementos
const btnGenerateReport = document.getElementById('generate-report');
const reportModal = document.getElementById('report-modal');
const reportForm = document.getElementById('report-form');
const reportCloseBtn = reportModal.querySelector('.close');

// Função para abrir modal
btnGenerateReport.addEventListener('click', () => {
  reportModal.style.display = 'block';
});

// Função para fechar modal (clicando no X)
reportCloseBtn.addEventListener('click', () => {
  reportModal.style.display = 'none';
});

// Fechar modal clicando fora do conteúdo
window.addEventListener('click', (e) => {
  if (e.target === reportModal) {
    reportModal.style.display = 'none';
  }
});

// Função para gerar o PDF
reportForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Importar jsPDF (você já carregou na página)
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Pegar dados do caso na página
  const title = document.getElementById('report-title').value || "Relatório do Caso";
  const notes = document.getElementById('report-notes').value || "";

  const caseTitle = document.getElementById('case-title').textContent;
  const caseId = document.getElementById('case-id').textContent;
  const caseStatus = document.getElementById('case-status').textContent;
  const caseDescription = document.getElementById('case-description').textContent;
  const caseDate = document.getElementById('case-date').textContent;
  const caseExpert = document.getElementById('case-expert').textContent;

  const patientName = document.getElementById('patient-name').textContent;
  const patientDob = document.getElementById('patient-dob').textContent;
  const patientGender = document.getElementById('patient-gender').textContent;
  const patientId = document.getElementById('patient-id').textContent;
  const patientContact = document.getElementById('patient-contact').textContent;

  const incidentDate = document.getElementById('incident-date').textContent;
  const incidentLocation = document.getElementById('incident-location').textContent;
  const incidentDescription = document.getElementById('incident-description').textContent;
  const incidentWeapon = document.getElementById('incident-weapon').textContent;

  // Montar conteúdo do PDF
  let y = 10; // posição vertical inicial

  doc.setFontSize(18);
  doc.text(title, 10, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`ID do Caso: ${caseId}`, 10, y);
  y += 8;
  doc.text(`Título: ${caseTitle}`, 10, y);
  y += 8;
  doc.text(`Status: ${caseStatus}`, 10, y);
  y += 10;

  doc.setFontSize(14);
  doc.text("Informações do Caso", 10, y);
  y += 8;
  doc.setFontSize(12);
  doc.text(`Descrição: ${caseDescription}`, 10, y);
  y += 8;
  doc.text(`Data de Criação: ${caseDate}`, 10, y);
  y += 8;
  doc.text(`Responsável: ${caseExpert}`, 10, y);
  y += 10;

  doc.setFontSize(14);
  doc.text("Informações do Paciente", 10, y);
  y += 8;
  doc.setFontSize(12);
  doc.text(`Nome: ${patientName}`, 10, y);
  y += 8;
  doc.text(`Data de Nascimento: ${patientDob}`, 10, y);
  y += 8;
  doc.text(`Gênero: ${patientGender}`, 10, y);
  y += 8;
  doc.text(`Documento: ${patientId}`, 10, y);
  y += 8;
  doc.text(`Contato: ${patientContact}`, 10, y);
  y += 10;

  doc.setFontSize(14);
  doc.text("Informações do Incidente", 10, y);
  y += 8;
  doc.setFontSize(12);
  doc.text(`Data: ${incidentDate}`, 10, y);
  y += 8;
  doc.text(`Local: ${incidentLocation}`, 10, y);
  y += 8;
  doc.text(`Descrição: ${incidentDescription}`, 10, y);
  y += 8;
  doc.text(`Instrumento/Arma: ${incidentWeapon}`, 10, y);
  y += 10;

  if (notes.trim() !== "") {
    doc.setFontSize(14);
    doc.text("Observações Adicionais", 10, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(notes, 10, y);
  }

  // Salvar arquivo PDF
  doc.save(`relatorio_caso_${caseId}.pdf`);

  // Fechar modal após gerar relatório
  reportModal.style.display = 'none';

  // Resetar o form (opcional)
  reportForm.reset();
});
