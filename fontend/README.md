📝 Sistema Odonto-Legal - Documentação
📌 Visão Geral
Sistema especializado em gestão de casos odontológico-legais, permitindo:

Cadastro de casos periciais

Gerenciameno de usuários

Armazenamento de evidências

Geração de relatórios técnicos

Controle de status e acompanhamento

🛠 Tecnologias Utilizadas
Tecnologia	Finalidade
HTML5	Estrutura das páginas
CSS3	Estilização
JavaScript (ES6)	Lógica e interações
Fetch API	Comunicação com backend
Font Awesome	Ícones
jsPDF	Geração de relatórios em PDF
🚀 Como Executar o Projeto
Pré-requisitos
Node.js (v18+)

Navegador moderno (Chrome, Firefox, Edge)

Backend configurado (ou JSON Server para desenvolvimento)

Passo a Passo
Clone o repositório

bash
git clone https://github.com/Juliana162702/odonto-legal-pwa.git
cd odonto-legal
Instale dependências (se necessário)

bash
npm install  # Caso tenha package.json
Inicie o servidor de desenvolvimento

bash
npx serve .  # Ou qualquer servidor HTTP simples
Para simular API (opcional)

bash
npx json-server --watch db.json --port 3001
Acesse no navegador

http://localhost:3000
🌐 Estrutura de Arquivos
odonto-legal/
├── index.html          # Página inicial/login
├── css/
│   └── style.css       # Estilos principais
├── js/
│   ├── list-case.js    # Lógica da lista de casos
│   ├── new-case.js     # Cadastro de casos
│   └── view-case.js    # Visualização detalhada
├── imag/               # Assets/imagens
└── api/                # Endpoints (simulados ou reais)
🔌 Endpoints da API
Método	Endpoint	Descrição
GET	/api/cases	Lista todos casos
POST	/api/cases	Cria novo caso
GET	/api/cases/:id	Detalhes de um caso
PUT	/api/cases/:id/status	Atualiza status
POST	/api/evidences	Adiciona evidência
🎨 Layouts Principais
1. Listagem de Casos
Lista de Casos

2. Cadastro de Caso
Novo Caso

3. Visualização Detalhada
Detalhes

⚙️ Variáveis de Ambiente (se aplicável)
Crie um arquivo .env na raiz:

env
API_BASE_URL=http://localhost:3000
DEBUG_MODE=true
🐛 Solução de Problemas Comuns
Problema: Erro "Unexpected token '<'"
Solução:

Verifique se o backend está rodando

Confira a URL da API nos arquivos JS

Habilite CORS no backend

javascript
// Exemplo de configuração CORS em Express
app.use(cors({
  origin: 'http://localhost:3000'
}));
📄 Licença
Este projeto está sob licença MIT. Veja o arquivo LICENSE para detalhes.

✍️ Nota para desenvolvedores:
Para modificar estilos, edite css/style.css. As cores principais estão definidas como variáveis CSS no início do arquivo.

🔗 Links úteis:

Documentação jsPDF

Ícones disponíveis