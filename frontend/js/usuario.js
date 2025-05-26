const apiUrl = 'http://localhost:3000/api/users';
const usersContainer = document.getElementById('users-list-container');
const userForm = document.getElementById('userForm');
const modal = document.getElementById('userModal');
const modalTitle = document.getElementById('modalTitle');
const searchInput = document.getElementById('search-user');
const filterRole = document.getElementById('filter-role');
const filterDate = document.getElementById('filter-date');
const searchButton = document.querySelector('.btn-search');

// Funções auxiliares
function formatUserType(role) {
  if (!role) {
    console.warn('Role não definido:', role);
    return 'Não definido';
  }

  const roleMap = {
    'admin': 'Administrador',
    'administrador': 'Administrador',
    'expert': 'Perito',
    'perito': 'Perito',
    'assistant': 'Assistente',
    'assistente': 'Assistente'
  };

  const normalizedRole = role.toString().trim().toLowerCase();
  return roleMap[normalizedRole] || role;
}

function formatDate(dateString) {
  if (!dateString) return 'Nunca acessou';
  try {
    const date = new Date(dateString);
    return isNaN(date) ? 'Data inválida' : date.toLocaleDateString('pt-BR');
  } catch {
    return 'Data inválida';
  }
}

function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
    return false;
  }
  return token;
}

// Menu toggle
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.querySelector('.sidebar').classList.toggle('active');
});

// Modal functions
function openUserModal(mode, userId = null, event) {
  if (event) event.stopPropagation();
  
  userForm.reset();
  document.getElementById('userId').value = '';
  document.getElementById('deleteBtn').style.display = 'none';

  if (mode === 'new') {
    modalTitle.textContent = 'Novo Usuário';
    modal.style.display = 'block';
  } else if (mode === 'view' && userId) {
    const token = checkAuth();
    if (!token) return;

    fetch(`${apiUrl}/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async res => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Erro ao carregar usuário');
        }
        return res.json();
      })
      .then(user => {
        modalTitle.textContent = 'Editar Usuário';
        document.getElementById('userId').value = user._id;
        document.getElementById('userName').value = user.nome || '';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userRole').value = user.role || 'assistant';
        document.getElementById('deleteBtn').style.display = 'inline-block';
        document.getElementById('userPassword').placeholder = 'Nova senha (deixe em branco para manter)';
        modal.style.display = 'block';
      })
      .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao carregar usuário: ' + error.message);
      });
  }
}

function closeUserModal() {
  modal.style.display = 'none';
}

// Delete user
function deleteUser(event) {
  if (event) event.stopPropagation();
  
  const id = document.getElementById('userId').value;
  const token = checkAuth();
  if (!token) return;

  if (!confirm('ATENÇÃO: Esta ação é irreversível. Deseja realmente excluir este usuário?')) return;

  fetch(`${apiUrl}/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(async res => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao excluir usuário');
      }
      closeUserModal();
      loadUsers();
      alert('Usuário excluído com sucesso!');
    })
    .catch(error => {
      console.error('Erro:', error);
      alert('Erro ao excluir usuário: ' + error.message);
    });
}

// Save user (create/update)
userForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  const id = document.getElementById('userId').value;
  const password = document.getElementById('userPassword').value;
  const confirmPassword = document.getElementById('userConfirmPassword').value;
  const token = checkAuth();
  if (!token) return;

  if (password && password !== confirmPassword) {
    alert('As senhas não coincidem!');
    return;
  }

  if (!id && !password) {
    alert('A senha é obrigatória para novos usuários!');
    return;
  }

  const userData = {
    nome: document.getElementById('userName').value.trim(),
    email: document.getElementById('userEmail').value.trim(),
    role: document.getElementById('userRole').value
  };

  if (password) userData.senha = password;

  try {
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `${apiUrl}/${id}` : apiUrl;

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao salvar usuário');
    }

    closeUserModal();
    loadUsers();
    alert(`Usuário ${id ? 'atualizado' : 'criado'} com sucesso!`);
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao salvar usuário: ' + error.message);
  }
});

// Load and render users with filters
async function loadUsers() {
  const token = checkAuth();
  if (!token) return;

  try {
    // Construir parâmetros de filtro
    const params = new URLSearchParams();
    
    // Filtro por busca
    if (searchInput.value.trim()) {
      params.append('search', searchInput.value.trim());
    }
    
    // Filtro por tipo
    if (filterRole.value !== 'all') {
      // Mapeia os valores do frontend para os valores do banco
      const roleMap = {
        'administrador': 'admin',
        'perito': 'expert',
        'assistente': 'assistant'
      };
      const backendRole = roleMap[filterRole.value] || filterRole.value;
      params.append('role', backendRole);
    }
    
    // Ordenação
    if (filterDate.value) {
      params.append('sort', filterDate.value === 'recentes' ? '-createdAt' : 'createdAt');
    }

    const url = `${apiUrl}?${params.toString()}`;
    console.log('URL da requisição:', url); // Para depuração

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao carregar usuários');
    }

    const users = await response.json();
    renderUsers(users);
  } catch (error) {
    console.error('Erro:', error);
    showError('Erro ao carregar usuários: ' + error.message);
  }
}

function renderUsers(users) {
  usersContainer.innerHTML = '';

  if (!users || users.length === 0) {
    usersContainer.innerHTML = `
      <div class="empty-message">
        <h3>Nenhum usuário encontrado</h3>
        <p>${searchInput.value ? 'Tente alterar os critérios de busca' : 'Clique em "Novo Usuário" para adicionar'}</p>
      </div>
    `;
    return;
  }

  users.forEach(user => {
    if (!user) return;
    
    const userElement = document.createElement('div');
    userElement.className = 'user-list-item';
    userElement.innerHTML = `
      <div class="user-list-content" onclick="openUserModal('view', '${user._id}', event)">
        <div class="user-list-main">
          <h3 class="user-name">${user.nome || 'Nome não informado'}</h3>
          <span class="user-role role-${user.role ? user.role.toLowerCase() : 'indefinido'}">
            ${formatUserType(user.role)}
          </span>
        </div>
        <div class="user-list-details">
          <div class="user-detail-group">
            <p><strong>Email:</strong> ${user.email || 'Não informado'}</p>
            <p><strong>Matrícula:</strong> ${user.matricula || 'N/A'}</p>
          </div>
          <div class="user-detail-group">
            <p><strong>Cadastrado em:</strong> ${formatDate(user.createdAt)}</p>
          </div>
        </div>
      </div>
    `;
    usersContainer.appendChild(userElement);
  });
}

function showError(message) {
  usersContainer.innerHTML = `
    <div class="error-message">
      <h3>Erro ao carregar usuários</h3>
      <p>${message}</p>
      <button class="btn btn-retry" onclick="loadUsers()">
        <i class="fas fa-sync-alt"></i> Tentar novamente
      </button>
    </div>
  `;
}

// Event listeners para filtros
searchInput.addEventListener('input', () => {
  // Adiciona um pequeno delay para evitar muitas requisições
  clearTimeout(this.searchTimer);
  this.searchTimer = setTimeout(() => {
    loadUsers();
  }, 500);
});

searchButton.addEventListener('click', loadUsers);
filterRole.addEventListener('change', loadUsers);
filterDate.addEventListener('change', loadUsers);

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  loadUsers();
});
// Executa ao carregar o DOM
document.addEventListener("DOMContentLoaded", () => {
  loadUsers(); // Carrega os usuários ao abrir a página

  // Busca ao digitar
  document.getElementById("search-user").addEventListener("input", () => {
    loadUsers(); // Atualiza lista com base na busca
  });

  // Filtro por tipo
  document.getElementById("filter-role").addEventListener("change", () => {
    loadUsers(); // Atualiza lista com base no tipo selecionado
  });

  // Ordenação por data
  document.getElementById("filter-date").addEventListener("change", () => {
    loadUsers(); // Atualiza lista com base na ordenação
  });

  // Fecha modal ao clicar fora dele
  window.addEventListener("click", (event) => {
    const modal = document.getElementById("userModal");
    if (event.target === modal) {
      closeUserModal();
    }
  });
});