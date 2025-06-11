document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'https://dentcase-backend.onrender.com/api';

  // Utilitário para pegar elementos com segurança
  function getElementSafe(id) {
    return document.getElementById(id);
  }

  // Menu toggle
  const menuToggle = getElementSafe('menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
  }

  // Parâmetros da URL
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('id');
  if (!caseId) {
    alert('Caso não encontrado.');
    window.location.href = 'list-case.html';
    return;
  }

  // Autenticação
  const userRole = localStorage.getItem('userRole');
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Você precisa estar logado para acessar esta página.');
    window.location.href = 'login.html';
    return;
  }

  // Elementos comuns
  const evidenceModal = getElementSafe('evidence-modal');
  const reportModal = getElementSafe('report-modal');
  const viewMode = getElementSafe('view-mode');
  const editMode = getElementSafe('edit-mode');
  const editButton = getElementSafe('edit-case');
  const cancelEdit = getElementSafe('cancel-edit');
  const saveEdit = getElementSafe('save-edit');
  const statusSelect = getElementSafe('case-status-select');
  const evidenceForm = getElementSafe('evidence-form');

  // Fechar modais
  document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', () => {
      if (evidenceModal) evidenceModal.style.display = 'none';
      if (reportModal) reportModal.style.display = 'none';
    });
  });

  // Mapa de estados (invertido para busca por nome)
  const estadosMap = {
    'Rondônia': 11, 'Acre': 12, 'Amazonas': 13, 'Roraima': 14, 'Pará': 15,
    'Amapá': 16, 'Tocantins': 17, 'Maranhão': 21, 'Piauí': 22, 'Ceará': 23,
    'Rio Grande do Norte': 24, 'Paraíba': 25, 'Pernambuco': 26, 'Alagoas': 27,
    'Sergipe': 28, 'Bahia': 29, 'Minas Gerais': 31, 'Espírito Santo': 32,
    'Rio de Janeiro': 33, 'São Paulo': 35, 'Paraná': 41, 'Santa Catarina': 42,
    'Rio Grande do Sul': 43, 'Mato Grosso do Sul': 50, 'Mato Grosso': 51,
    'Goiás': 52, 'Distrito Federal': 53
  };

  // Permissões de UI
  async function setupUI() {
    try {
      const res = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao verificar permissões.');
      }
      
      const data = await res.json();
      const isOwner = data.assignedUser?.toString() === userId;

      // Elementos condicionais
      const deleteCaseBtn = getElementSafe('delete-case');
      const addEvidenceBtn = getElementSafe('add-evidence');
      
      if (userRole === 'admin') {
        if (editButton) editButton.classList.remove('hidden');
        if (deleteCaseBtn) deleteCaseBtn.classList.remove('hidden');
        if (addEvidenceBtn) addEvidenceBtn.classList.remove('hidden');
      } else if (userRole === 'perito') {
        if (editButton) editButton.classList.toggle('hidden', !isOwner);
        if (deleteCaseBtn) deleteCaseBtn.classList.add('hidden');
        if (addEvidenceBtn) addEvidenceBtn.classList.toggle('hidden', !isOwner);
      } else if (userRole === 'assistente') {
        if (editButton) editButton.classList.add('hidden');
        if (deleteCaseBtn) deleteCaseBtn.classList.add('hidden');
        if (addEvidenceBtn) addEvidenceBtn.classList.toggle('hidden', !(data.assignedUser?.toString() === userId));
      }
    } catch (error) {
      console.error('Erro ao configurar UI:', error);
      alert(`Erro de permissão: ${error.message}`);
    }
  }

  // Função segura para definir texto
  function setText(id, text) {
    const el = getElementSafe(id);
    if (el) el.textContent = text;
  }

  // Carregar dados do caso
  async function loadCaseDetails() {
    try {
      const res = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao carregar caso.');
      }
      
      const c = await res.json();

      // Atualizar status
      if (statusSelect) {
        const statusVal = c.status?.toLowerCase().replace(/\s+/g, '_') || 'aberto';
        statusSelect.value = statusVal;
        statusSelect.className = `status-select status-${statusVal}`;
      }

      // Preencher campos de visualização (PROTEÇÃO CONTRA ELEMENTOS AUSENTES)
      const safeSetText = (id, text) => {
        const el = getElementSafe(id);
        if (el) el.textContent = text;
      };

      safeSetText('case-title', `${c.patientName} - ${c.incidentDescription?.slice(0,50) || ''}${c.incidentDescription?.length > 50 ? '...' : ''}`);
      safeSetText('case-id', `#${c.caseId || c._id}`);
      safeSetText('case-description', c.description || 'Sem descrição');
      safeSetText('case-date', c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : 'Não informado');
      safeSetText('case-expert', c.createdBy?.name || 'Responsável não informado');

      safeSetText('patient-name', c.patientName || 'Não informado');
      safeSetText('patient-dob', c.patientDOB ? new Date(c.patientDOB).toLocaleDateString('pt-BR') : 'Não informado');
      safeSetText('patient-gender', c.patientGender || 'Não informado');
      safeSetText('patient-id', c.patientID || 'Não informado');
      safeSetText('patient-contact', c.patientContact || 'Não informado');

      safeSetText('incident-date', c.incidentDate ? new Date(c.incidentDate).toLocaleString('pt-BR') : 'Não informado');
      safeSetText('incident-location', c.incidentLocation || 'Não informado');
      safeSetText('incident-description', c.incidentDescription || 'Não informado');
      safeSetText('incident-weapon', c.incidentWeapon || 'Não informado');

      // Estado: converter código para nome
      const estadoCode = c.estado;
      const estadoName = Object.keys(estadosMap).find(key => estadosMap[key] === estadoCode);
      safeSetText('estado', estadoName || 'Não informado');
      
      safeSetText('bairro', c.bairro || 'Não informado');
      safeSetText('case-type', c.caseType || 'Não informado');
      safeSetText('identified', c.identified ? 'Sim' : 'Não');
      safeSetText('injury-regions', Array.isArray(c.injuryRegions) ? c.injuryRegions.join(', ') : 'Não informado');

      // Preencher formulário de edição
      populateEditForm(c);

      // Carregar evidências
      await loadEvidences();
    } catch (error) {
      console.error('Erro ao carregar caso:', error);
      alert(`Erro: ${error.message}`);
      window.location.href = 'list-case.html';
    }
  }

  // Preencher form de edição
  function populateEditForm(c) {
    const safeSetValue = (id, value) => {
      const el = getElementSafe(id);
      if (el) el.value = value;
    };

    const safeSetChecked = (id, checked) => {
      const el = getElementSafe(id);
      if (el) el.checked = checked;
    };

    safeSetValue('edit-case-description', c.description || '');
    safeSetValue('edit-case-expert', c.createdBy?.name || '');
    safeSetValue('edit-patient-name', c.patientName || '');
    safeSetValue('edit-patient-dob', c.patientDOB ? new Date(c.patientDOB).toISOString().slice(0,10) : '');
    safeSetValue('edit-patient-gender', c.patientGender?.toLowerCase() || 'nao_informado');
    safeSetValue('edit-patient-id', c.patientID || '');
    safeSetValue('edit-patient-contact', c.patientContact || '');

    safeSetValue('edit-incident-date', c.incidentDate ? new Date(c.incidentDate).toISOString().slice(0,16) : '');
    safeSetValue('edit-incident-location', c.incidentLocation || '');
    safeSetValue('edit-incident-description', c.incidentDescription || '');
    safeSetValue('edit-incident-weapon', c.incidentWeapon || '');

    // Estado: converter código para nome
    const estadoCode = c.estado;
    const estadoName = Object.keys(estadosMap).find(key => estadosMap[key] === estadoCode);
    safeSetValue('edit-estado', estadoName || '');
    
    safeSetValue('edit-bairro', c.bairro || '');
    safeSetValue('edit-case-type', c.caseType || '');
    safeSetChecked('edit-identified', !!c.identified);
    
    const injuryRegionsEl = getElementSafe('edit-injury-regions');
    if (injuryRegionsEl) {
      injuryRegionsEl.value = Array.isArray(c.injuryRegions) ? 
        c.injuryRegions.join(', ') : '';
    }
  }

  // Alternar modos de visualização/edição
  function toggleEditMode(enable) {
    if (viewMode) viewMode.style.display = enable ? 'none' : 'block';
    if (editMode) editMode.style.display = enable ? 'block' : 'none';
  }
  
  if (editButton) {
    editButton.addEventListener('click', () => toggleEditMode(true));
  }
  
  if (cancelEdit) {
    cancelEdit.addEventListener('click', () => toggleEditMode(false));
  }

  // Salvar edição
  if (saveEdit) {
    saveEdit.addEventListener('click', async e => {
      e.preventDefault();
      
      const getValue = (id) => {
        const el = getElementSafe(id);
        return el ? el.value : '';
      };
      
      // Converter nome do estado para código
      const estadoName = getValue('edit-estado');
      const estadoCode = estadosMap[estadoName] || '';
      
      const updated = {
        description: getValue('edit-case-description'),
        status: statusSelect ? statusSelect.value.replace(/_/g, ' ') : 'aberto',
        createdBy: getValue('edit-case-expert'),
        patientName: getValue('edit-patient-name'),
        patientDOB: getValue('edit-patient-dob'),
        patientGender: getValue('edit-patient-gender'),
        patientID: getValue('edit-patient-id'),
        patientContact: getValue('edit-patient-contact'),
        incidentDate: getValue('edit-incident-date'),
        incidentLocation: getValue('edit-incident-location'),
        incidentDescription: getValue('edit-incident-description'),
        incidentWeapon: getValue('edit-incident-weapon'),
        estado: estadoCode,
        bairro: getValue('edit-bairro'),
        caseType: getValue('edit-case-type'),
        identified: !!getElementSafe('edit-identified')?.checked,
        injuryRegions: getValue('edit-injury-regions').split(',').map(s => s.trim())
      };
      
      try {
        const res = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(updated)
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Erro ao atualizar caso');
        }
        
        alert('Caso atualizado com sucesso!');
        await loadCaseDetails();
        toggleEditMode(false);
      } catch (error) {
        console.error('Erro ao atualizar caso:', error);
        alert(`Falha: ${error.message}`);
      }
    });
  }

  // Carregar evidências
  async function loadEvidences() {
    const list = getElementSafe('evidence-list');
    const emptyMsg = getElementSafe('empty-evidence-message');
    
    if (!list) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/evidences/case/${caseId}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      
      if (!res.ok) throw new Error('Erro ao carregar evidências');
      
      const items = await res.json();
      
      if (!items || !items.length) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        list.innerHTML = '';
        return;
      }
      
      if (emptyMsg) emptyMsg.style.display = 'none';
      list.innerHTML = '';
      
      items.forEach(ev => {
        const div = document.createElement('div');
        div.className = 'evidence-item';
        div.innerHTML = `
          <div class="evidence-content">
            <h4>${ev.collectionDate ? new Date(ev.collectionDate).toLocaleDateString('pt-BR') : 'Data não informada'}${ev.collectionTime ? ' - ' + ev.collectionTime : ''}</h4>
            <p>${ev.description || 'Descrição não informada'}</p>
            ${ev.latitude && ev.longitude ? 
              `<p><strong>Local:</strong> ${ev.latitude}, ${ev.longitude}</p>` : ''}
            ${ev.imageUrl ? 
              `<img src="${ev.imageUrl}" class="evidence-image">` : ''}
            <p><strong>Adicionada por:</strong> ${ev.addedBy?.name || 'Não informado'}</p>
            <button class="btn-generate-report" data-evidence-id="${ev._id}">Gerar Laudo</button>
          </div>`;
        list.appendChild(div);
      });
    } catch (error) {
      console.error('Erro ao carregar evidências:', error);
      if (emptyMsg) {
        emptyMsg.textContent = 'Erro ao carregar evidências.';
        emptyMsg.style.display = 'block';
      }
    }
  }

  // Gerar Laudo PDF
  const evidenceList = getElementSafe('evidence-list');
  if (evidenceList) {
    evidenceList.addEventListener('click', async e => {
      if (!e.target.classList.contains('btn-generate-report')) return;
      const evId = e.target.getAttribute('data-evidence-id');
      if (!evId) return;
      
      try {
        const res = await fetch(`${API_BASE_URL}/evidences/${evId}/report`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        });
        
        if (!res.ok) throw new Error('Erro ao gerar laudo.');
        
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } catch (error) {
        console.error('Erro ao gerar laudo:', error);
        alert(`Falha: ${error.message}`);
      }
    });
  }

  // Abrir modal de adicionar evidência
  getElementSafe('add-evidence')?.addEventListener('click', () => {
    const today = new Date().toISOString().split('T')[0];
    getElementSafe('collection-date').value = today;
    if (evidenceModal) evidenceModal.style.display = 'block';
  });

  // Submeter evidência 
  if (evidenceForm) {
    evidenceForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const form = e.target;
      const description = form.querySelector('#evidence-description-field').value.trim();
      const fileInput = form.querySelector('#evidence-file');
      const file = fileInput.files[0];
      
      if (!description) {
        alert('Por favor, insira uma descrição para a evidência.');
        return;
      }

      const formData = new FormData();
      formData.append('case', caseId);
      formData.append('collectionDate', form.querySelector('#collection-date').value || new Date().toISOString());
      formData.append('collectionTime', form.querySelector('#collection-time').value || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      formData.append('description', description);
      formData.append('latitude', form.querySelector('#evidence-lat').value.trim() || '');
      formData.append('longitude', form.querySelector('#evidence-long').value.trim() || '');
      formData.append('imageUrl', form.querySelector('#evidence-image-url').value.trim() || '');
      
      if (file) {
        formData.append('imageFile', file);
      }

      try {
        const response = await fetch(`${API_BASE_URL}/evidences`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao adicionar evidência');
        }

        alert('Evidência adicionada com sucesso!');
        evidenceModal.style.display = 'none';
        form.reset();
        await loadEvidences();

      } catch (error) {
        console.error('Erro:', error);
        alert(`Falha ao adicionar evidência: ${error.message}`);
      }
    });
  }

  // Usar Minha Localização
  const btnUseLocation = getElementSafe('get-location');
  const inputLat = getElementSafe('evidence-lat');
  const inputLong = getElementSafe('evidence-long');

  if (btnUseLocation && inputLat && inputLong) {
    btnUseLocation.addEventListener('click', () => {
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
  }

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

  // Gerar Relatório Geral
  const generateReportBtn = getElementSafe('generate-report');
  const reportForm = getElementSafe('report-form');
  
  if (generateReportBtn && reportModal) {
    generateReportBtn.addEventListener('click', () => {
      reportModal.style.display = 'block';
    });
  }
  
  if (reportForm) {
    reportForm.addEventListener('submit', e => {
      e.preventDefault();
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      let y = 20;
      const margin = 15;
      const width = doc.internal.pageSize.getWidth();

      const title = getElementSafe('report-title')?.value.toUpperCase() || 'RELATÓRIO DO CASO';
      const notes = getElementSafe('report-notes')?.value || '';

      doc.setFontSize(22);
      doc.text(title, width / 2, y, { align: 'center' });
      y += 10;
      doc.setFontSize(12);

      const safeGetText = (id) => {
        const el = getElementSafe(id);
        return el ? el.textContent : 'Não informado';
      };

      const addField = (label, value) => {
        doc.setFont(undefined, 'bold'); 
        doc.text(`${label}:`, margin, y);
        doc.setFont(undefined, 'normal');
        
        const safeValue = value || 'Não informado';
        const lines = doc.splitTextToSize(safeValue, width - margin - 40);
        
        lines.forEach((line, i) => {
          doc.text(line, margin + 40, y + (i * 7));
        });
        
        y += (lines.length * 7) + 4;
      };

      addField('ID DO CASO', safeGetText('case-id'));
      addField('TÍTULO', safeGetText('case-title'));
      addField('DESCRIÇÃO', safeGetText('case-description'));
      addField('PACIENTE', safeGetText('patient-name'));
      addField('INCIDENTE', safeGetText('incident-description'));

      if (notes) {
        y += 10;
        doc.setFont(undefined, 'bold'); 
        doc.text('OBSERVAÇÕES:', margin, y);
        y += 8;
        doc.setFont(undefined, 'normal');
        const noteLines = doc.splitTextToSize(notes, width - margin * 2);
        noteLines.forEach((line, i) => {
          doc.text(line, margin, y + (i * 7));
        });
      }

      doc.save(`relatorio_caso_${caseId}.pdf`);
      if (reportModal) reportModal.style.display = 'none';
      reportForm.reset();
    });
  }

  // Inicialização
  setupUI();
  loadCaseDetails();
});