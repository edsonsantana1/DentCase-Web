const apiUrl = 'https://dentcase-backend.onrender.com/api/users';
const usersContainer = document.getElementById('users-list-container');
const userForm = document.getElementById('userForm');
const modal = document.getElementById('userModal');
const modalTitle = document.getElementById('modalTitle');
const searchInput = document.getElementById('search-user');
const filterRole = document.getElementById('filter-role');
const filterDate = document.getElementById('filter-date');
const searchButton = document.querySelector('.btn-search');

// Mapeia valores do frontend para enum do schema
function mapFrontendRoleToBackend(rawRole) {
  const map = {
    'administrador': 'admin',
    'perito': 'perito',
    'assistente': 'assistente'
  };
  return map[rawRole] || 'assistente';
}

// Funções auxiliares (mantidas conforme antes)
function formatUserType(role) {
  const roleMap = {
    'admin': 'Administrador',
    'perito': 'Perito',
    'assistente': 'Assistente'
  };
  return roleMap[role] || role || 'Não definido';
}
function formatDate(dateString) {
  if (!dateString) return 'Nunca acessou';
  const d = new Date(dateString);
  return isNaN(d) ? 'Data inválida' : d.toLocaleDateString('pt-BR');
}
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) window.location.href = 'index.html';
  return token;
}

// Menu toggle
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.querySelector('.sidebar').classList.toggle('active');
});

// Abre modal para novo/editar
function openUserModal(mode, userId = null, event) {
  if (event) event.stopPropagation();
  userForm.reset();
  document.getElementById('userId').value = '';
  document.getElementById('deleteBtn').style.display = 'none';

  if (mode === 'new') {
    modalTitle.textContent = 'Novo Usuário';
    modal.style.display = 'block';
    return;
  }

  // modo view/edit
  const token = checkAuth();
  fetch(`${apiUrl}/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.ok ? res.json() : Promise.reject(res))
    .then(user => {
      modalTitle.textContent = 'Editar Usuário';
      document.getElementById('userId').value = user._id;
      document.getElementById('userName').value = user.nome;
      document.getElementById('userEmail').value = user.email;
      // já vem no formato do schema ('admin','perito','assistente')
      document.getElementById('userRole').value = user.role;
      document.getElementById('deleteBtn').style.display = 'inline-block';
      document.getElementById('userPassword').placeholder = 'Nova senha (deixe em branco para manter)';
      modal.style.display = 'block';
    })
    .catch(async err => {
      const msg = (err.json ? (await err.json()).msg : err.message) || 'Erro ao carregar usuário';
      alert(msg);
    });
}

// Fecha modal
function closeUserModal() {
  modal.style.display = 'none';
}

// Excluir usuário
function deleteUser(event) {
  if (event) event.stopPropagation();
  const id = document.getElementById('userId').value;
  const token = checkAuth();
  if (!confirm('Deseja realmente excluir este usuário?')) return;

  fetch(`${apiUrl}/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.ok ? res : Promise.reject(res))
    .then(() => {
      closeUserModal();
      loadUsers();
      alert('Usuário excluído com sucesso!');
    })
    .catch(async err => {
      const msg = (await err.json()).msg || 'Erro ao excluir usuário';
      alert(msg);
    });
}

// Criar/Atualizar usuário
userForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  const id = document.getElementById('userId').value;
  const rawRole = document.getElementById('userRole').value;
  const senha = document.getElementById('userPassword').value;
  const confirmSenha = document.getElementById('userConfirmPassword').value;
  const token = checkAuth();

  if (senha && senha !== confirmSenha) {
    return alert('As senhas não coincidem!');
  }
  if (!id && !senha) {
    return alert('Senha obrigatória para novos usuários!');
  }

  // Monta payload
  const userData = {
    nome: document.getElementById('userName').value.trim(),
    email: document.getElementById('userEmail').value.trim(),
    role: mapFrontendRoleToBackend(rawRole)
  };
  if (senha) userData.senha = senha;

  try {
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `${apiUrl}/${id}` : apiUrl;
    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.msg || err.message || `Status ${res.status}`);
    }
    closeUserModal();
    loadUsers();
    alert(`Usuário ${id ? 'atualizado' : 'criado'} com sucesso!`);
  } catch (error) {
    alert('Erro ao salvar usuário: ' + error.message);
  }
});

// Carrega e renderiza usuários
async function loadUsers() {
  const token = checkAuth();
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.append('search', searchInput.value.trim());
  if (filterRole.value !== 'all') {
    // mapeia front→back apenas para filtro
    const mapRole = { 'administrador':'admin','perito':'perito','assistente':'assistente' };
    params.append('role', mapRole[filterRole.value] || filterRole.value);
  }
  if (filterDate.value) {
    params.append('sort', filterDate.value==='recentes' ? '-createdAt':'createdAt');
  }
  const url = `${apiUrl}?${params}`;
  try {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error((await res.json()).msg || 'Erro ao carregar usuários');
    const users = await res.json();
    renderUsers(users);
  } catch (err) {
    usersContainer.innerHTML = `<p class="error-message">Erro ao carregar usuários: ${err.message}</p>`;
  }
}

// Monta a listagem
function renderUsers(users) {
  usersContainer.innerHTML = '';
  if (!users.length) {
    usersContainer.innerHTML = `
      <div class="empty-message">
        <h3>Nenhum usuário encontrado</h3>
        <p>${searchInput.value ? 'Tente outros critérios.' : 'Clique em "Novo Usuário".'}</p>
      </div>`;
    return;
  }
  users.forEach(u => {
    const div = document.createElement('div');
    div.className = 'user-list-item';
    div.innerHTML = `
      <div class="user-list-content" onclick="openUserModal('view','${u._id}',event)">
        <div class="user-list-main">
          <h3 class="user-name">${u.nome}</h3>
          <span class="user-role role-${u.role}">${formatUserType(u.role)}</span>
        </div>
        <div class="user-list-details">
          <p><strong>Email:</strong> ${u.email}</p>
          <p><strong>Matrícula:</strong> ${u.matricula}</p>
          <p><strong>Cadastrado em:</strong> ${formatDate(u.createdAt)}</p>
        </div>
      </div>`;
    usersContainer.appendChild(div);
  });
}

// Filtros e init
searchInput.addEventListener('input', () => { clearTimeout(this.timer); this.timer = setTimeout(loadUsers, 500); });
searchButton.addEventListener('click', loadUsers);
filterRole.addEventListener('change', loadUsers);
filterDate.addEventListener('change', loadUsers);

window.addEventListener('DOMContentLoaded', loadUsers);
