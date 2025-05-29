const Laudo = require('../models/Laudo');
const Evidence = require('../models/Evidence'); // Importa o modelo Evidence para validação

// Função para criar um laudo
exports.createLaudo = async (req, res) => {
  const { evidence, reportDate, expertName, findings, conclusions } = req.body;

  try {
    // Verifica se a evidência existe
    const foundEvidence = await Evidence.findById(evidence);
    if (!foundEvidence) {
      return res.status(404).json({ error: 'Evidência não encontrada.' });
    }

    // Cria o laudo com o ID do usuário autenticado
    const laudo = new Laudo({
      evidence, // ID da evidência
      user: req.user.id, // Preenche automaticamente o ID do usuário autenticado
      reportDate,
      expertName,
      findings,
      conclusions,
    });

    await laudo.save(); // Salva o laudo no banco de dados
    res.status(201).json(laudo); // Retorna o laudo criado
  } catch (error) {
    res.status(500).json({ error: error.message }); // Tratamento de erro
  }
};

// Função para obter todos os laudos
exports.getAllLaudos = async (req, res) => {
  try {
    const laudos = await Laudo.find()
      .populate('evidence') // Popula os detalhes da evidência
      .populate('user'); // Popula os detalhes do usuário
    res.status(200).json(laudos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Função para obter um laudo por ID
exports.getLaudoById = async (req, res) => {
  try {
    const laudo = await Laudo.findById(req.params.id)
      .populate('evidence') // Popula os detalhes da evidência
      .populate('user'); // Popula os detalhes do usuário
    if (!laudo) {
      return res.status(404).json({ error: 'Laudo não encontrado.' });
    }
    res.status(200).json(laudo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Função para atualizar um laudo por ID
exports.updateLaudo = async (req, res) => {
  const { evidence, reportDate, expertName, findings, conclusions } = req.body;

  try {
    const laudo = await Laudo.findById(req.params.id);
    if (!laudo) {
      return res.status(404).json({ error: 'Laudo não encontrado.' });
    }

    // Atualiza os campos fornecidos ou mantém os valores atuais
    if (evidence) {
      const foundEvidence = await Evidence.findById(evidence);
      if (!foundEvidence) {
        return res.status(404).json({ error: 'Evidência não encontrada.' });
      }
      laudo.evidence = evidence;
    }
    laudo.reportDate = reportDate || laudo.reportDate;
    laudo.expertName = expertName || laudo.expertName;
    laudo.findings = findings || laudo.findings;
    laudo.conclusions = conclusions || laudo.conclusions;

    const updatedLaudo = await laudo.save(); // Salva as alterações no banco de dados
    res.status(200).json(updatedLaudo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Função para deletar um laudo por ID
exports.deleteLaudo = async (req, res) => {
  try {
    const laudo = await Laudo.findByIdAndDelete(req.params.id);
    if (!laudo) {
      return res.status(404).json({ error: 'Laudo não encontrado.' });
    }
    res.status(200).json({ message: 'Laudo deletado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};