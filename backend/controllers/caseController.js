const Case = require('../models/Case');

// Função para criar um caso (admin e perito)
exports.createCase = async (req, res) => {
  try {
    if (!['admin', 'perito'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Apenas administradores e peritos podem criar casos' });
    }

    const {
      caseId, status, description, patientName, patientDOB, patientAge,
      patientGender, patientID, patientContact, incidentDate, incidentLocation,
      incidentDescription, incidentWeapon, assistentes,
      estado, bairro,
      caseType, identified, injuryRegions,
      assignedUser
    } = req.body;

    // Converte identified para boolean
    const identifiedBool = identified === 'sim';

    // Converte injuryRegions para string (se for array, junta com vírgula)
    const injuryRegionsStr = Array.isArray(injuryRegions) ? injuryRegions.join(', ') : injuryRegions;

    const newCase = new Case({
      caseId,
      status,
      description,
      patientName,
      patientDOB,
      patientAge,
      patientGender,
      patientID,
      patientContact,
      incidentDate,
      incidentLocation,
      incidentDescription,
      incidentWeapon,
      estado,
      bairro,
      caseType,
      identified: identifiedBool,
      injuryRegions: Array.isArray(injuryRegions) ? injuryRegions.join(', ') : injuryRegions,
      assignedUser,
      assistentes: assistentes || [],
      createdBy: req.user.id
    });

    const savedCase = await newCase.save();

    // Retorna o objeto completo salvo no banco
    res.status(201).json(savedCase);


  } catch (err) {
    console.error('Erro ao criar caso:', err.message);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};


// Função para listar todos os casos (todos veem, dados sensíveis ocultos se não for admin)
exports.getCases = async (req, res) => {
  try {
    let cases = await Case.find().select('-__v');

    if (!cases || cases.length === 0) {
      return res.status(404).json({ error: "Nenhum caso encontrado." });
    }

    // Oculta dados sensíveis para quem não é admin
    if (req.user.role !== 'admin') {
      cases = cases.map(caseItem => {
        const caseData = caseItem.toObject ? caseItem.toObject() : caseItem;
        const { patientContact, incidentWeapon, ...safeData } = caseData;
        return safeData;
      });
    }

    res.status(200).json(cases);
  } catch (err) {
    console.error('Erro ao obter casos:', err.message);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// Buscar caso por ID
exports.getCaseById = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id)
    .select('-__v')
    .populate('createdBy', 'name'); // aqui popula só o campo name do usuário


    if (!caseData) {
      return res.status(404).json({ error: 'Caso não encontrado' });
    }

    let responseData = caseData.toObject();
    if (req.user.role !== 'admin') {
      const { patientContact, incidentWeapon, ...safeData } = responseData;
      responseData = safeData;
    }

    res.status(200).json(responseData);
  } catch (err) {
    console.error('Erro ao buscar caso:', err.message);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// Atualizar caso (admin ou perito que criou o caso)
exports.updateCase = async (req, res) => {
  try {
    const foundCase = await Case.findById(req.params.id);
    if (!foundCase) {
      return res.status(404).json({ error: 'Caso não encontrado' });
    }

    if (
      req.user.role !== 'admin' &&
      (req.user.role !== 'perito' || foundCase.assignedUser.toString() !== req.user.id)
    ) {
      return res.status(403).json({ error: 'Acesso negado: você não tem permissão para editar este caso' });
    }

    const updatableFields = [
      'status', 'description', 'patientName', 'patientDOB', 'patientAge',
      'patientGender', 'patientID', 'patientContact', 'incidentDate',
      'incidentLocation', 'incidentDescription', 'incidentWeapon', 'assistentes',
      'estado',
      'bairro',
      'caseType',
      'identified',
      'injuryRegions',
      'responsavel'
          
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        foundCase[field] = req.body[field];
      }
    });

    foundCase.updatedAt = Date.now();
    const updatedCase = await foundCase.save();

    res.status(200).json({
      _id: updatedCase._id,
      status: updatedCase.status,
      patientName: updatedCase.patientName,
      updatedAt: updatedCase.updatedAt
    });
  } catch (err) {
    console.error('Erro ao atualizar caso:', err.message);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// Deletar caso (apenas admin)
exports.deleteCase = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem deletar casos' });
    }

    const deletedCase = await Case.findByIdAndDelete(req.params.id);
    if (!deletedCase) {
      return res.status(404).json({ error: 'Caso não encontrado' });
    }

    res.status(200).json({ message: 'Caso removido com sucesso', deletedCaseId: deletedCase._id });
  } catch (err) {
    console.error('Erro ao deletar caso:', err.message);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// Adicionar evidência (admin, perito, ou assistente do caso)
exports.addEvidence = async (req, res) => {
  try {
    const caseId = req.params.id; // Pega o ID do caso pela URL
    const evidenceData = req.body; // Dados da evidência (ex: { description, fileUrl, date })

    const caseToUpdate = await Case.findById(caseId);
    if (!caseToUpdate) {
      return res.status(404).json({ error: 'Caso não encontrado' });
    }

    const isAdmin = req.user.role === 'admin';
    const isPerito = req.user.role === 'perito';
    const isAssistente = req.user.role === 'assistente';
    const isParticipante = caseToUpdate.assistentes?.includes(req.user.id);

    if (!(isAdmin || isPerito || (isAssistente && isParticipante))) {
      return res.status(403).json({ error: 'Você não tem permissão para adicionar evidência neste caso' });
    }

    caseToUpdate.evidences.push(evidenceData);
    await caseToUpdate.save();

    res.status(201).json({ msg: 'Evidência adicionada com sucesso', case: caseToUpdate });
  } catch (err) {
    console.error('Erro ao adicionar evidência:', err.message);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};


// Gerar relatório (apenas admin e perito)
exports.generateReport = async (req, res) => {
  try {
    if (!['admin', 'perito'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Apenas administradores e peritos podem gerar relatórios' });
    }

    const { caseId } = req.query;
    let caseToReport;

    if (caseId) {
      caseToReport = await Case.findById(caseId);
      if (!caseToReport) {
        return res.status(404).json({ error: 'Caso não encontrado' });
      }
    } else {
      caseToReport = await Case.find();
    }

    res.json({ msg: 'Relatório gerado', case: caseToReport });
  } catch (err) {
    console.error('Erro ao gerar relatório:', err.message);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// Atualizar apenas o status de um caso (admin ou perito criador)
exports.updateCaseStatus = async (req, res) => {
  const { status } = req.body;

  if (!['em andamento', 'finalizado', 'arquivado'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  try {
    const foundCase = await Case.findOne({ caseId: req.params.id }); // usa caseId e não _id

    if (!foundCase) {
      return res.status(404).json({ error: 'Caso não encontrado' });
    }

    const isAdmin = req.user.role === 'admin';
    const isPeritoCriador = req.user.role === 'perito' && foundCase.assignedUser?.toString() === req.user.id;

    if (!isAdmin && !isPeritoCriador) {
      return res.status(403).json({ error: 'Você não tem permissão para atualizar o status deste caso' });
    }

    foundCase.status = status;
    await foundCase.save();

    res.status(200).json({ msg: 'Status atualizado com sucesso', status: foundCase.status });
  } catch (err) {
    console.error('Erro ao atualizar status:', err.message);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};



