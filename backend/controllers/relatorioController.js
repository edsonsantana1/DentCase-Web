const Relatorio = require('../models/Relatorio');
const Case = require('../models/Case'); // Importa o modelo Case para buscar o usuário

// Função para criar um relatório
exports.createRelatorio = async (req, res) => {
  const { case: caseId, reportDate, title, description } = req.body;

  try {
    // Busca o caso pelo ID fornecido
    const foundCase = await Case.findById(caseId);
    if (!foundCase) {
      return res.status(404).json({ error: 'Caso não encontrado' });
    }

    // Cria o relatório e insere automaticamente o usuário do caso
    const relatorio = new Relatorio({
      case: caseId,
      user: foundCase.user, // Preenche o usuário automaticamente
      reportDate,
      title,
      description,
    });

    // Salva o relatório no banco de dados
    await relatorio.save();
    res.status(201).json(relatorio); // Retorna o relatório criado
  } catch (error) {
    res.status(400).json({ error: error.message }); // Tratamento de erro
  }
};

// Função para obter todos os relatórios
exports.getAllRelatorios = async (req, res) => {
  try {
    const relatorios = await Relatorio.find().populate('case'); // Popula os detalhes do caso
    res.status(200).json(relatorios);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Função para obter um relatório por ID
exports.getRelatorioById = async (req, res) => {
  try {
    const relatorio = await Relatorio.findById(req.params.id).populate('case'); // Popula os detalhes do caso
    if (!relatorio) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }
    res.status(200).json(relatorio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Função para atualizar um relatório por ID
exports.updateRelatorio = async (req, res) => {
  try {
    const relatorio = await Relatorio.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!relatorio) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }
    res.status(200).json(relatorio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Função para deletar um relatório por ID
exports.deleteRelatorio = async (req, res) => {
  try {
    const relatorio = await Relatorio.findByIdAndDelete(req.params.id);
    if (!relatorio) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }
    res.status(200).json({ message: 'Relatório deletado com sucesso' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};