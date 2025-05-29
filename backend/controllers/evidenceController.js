const path = require('path');
const Evidence = require('../models/Evidence');
const PDFDocument = require('pdfkit');


// Criar nova evidência
exports.createEvidence = async (req, res) => {
  try {
    const {
      case: caseId,
      latitude,
      longitude,
      description,
      collectionDate,
      collectionTime,
      imageUrl // URL direta (opcional)
    } = req.body;

    if (!caseId || !description || !collectionDate || !collectionTime) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    // Definir URL da imagem
    let finalImageUrl = imageUrl || null;

    // Se um arquivo foi enviado via input[type="file"], use o caminho dele
    if (req.file) {
      const filename = req.file.filename;
      finalImageUrl = `http://localhost:3000/uploads/${filename}`;
    }

    const evidence = new Evidence({
      case: caseId,
      imageUrl: finalImageUrl,
      latitude: latitude || null,
      longitude: longitude || null,
      description,
      collectionDate,
      collectionTime,
      addedBy: req.userId // se você estiver controlando quem adicionou
    });

    await evidence.save();
    res.status(201).json({ message: 'Evidência salva com sucesso', evidence });

  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar evidência: ' + error.message });
  }
};


// Obter todas as evidências
exports.getAllEvidence = async (req, res) => {
  try {
    const evidences = await Evidence.find().populate('case');
    res.status(200).json(evidences);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar evidências: ' + error.message });
  }
};
// Obter evidências por ID do caso
exports.getEvidenceByCaseId = async (req, res) => {
  try {
    const { caseId } = req.params;
    const evidences = await Evidence.find({ case: caseId }).populate('case');

    res.status(200).json(evidences);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar evidências do caso: ' + error.message });
  }
};

// Obter evidência por ID
exports.getEvidenceById = async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.id).populate('case');
    if (!evidence) {
      return res.status(404).json({ error: 'Evidência não encontrada' });
    }
    res.status(200).json(evidence);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar evidência: ' + error.message });
  }
};

// Atualizar evidência por ID
exports.updateEvidence = async (req, res) => {
  try {
    const evidence = await Evidence.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!evidence) {
      return res.status(404).json({ error: 'Evidência não encontrada' });
    }
    res.status(200).json({ message: 'Evidência atualizada com sucesso', evidence });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar evidência: ' + error.message });
  }
};

// Deletar evidência por ID
exports.deleteEvidence = async (req, res) => {
  try {
    const evidence = await Evidence.findByIdAndDelete(req.params.id);
    if (!evidence) {
      return res.status(404).json({ error: 'Evidência não encontrada' });
    }
    res.status(200).json({ message: 'Evidência deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar evidência: ' + error.message });
  }
};


exports.generateEvidenceReport = async (req, res) => {
  try {
    const evidenceId = req.params.id;
    const evidence = await Evidence.findById(evidenceId).populate('addedBy');

    if (!evidence) {
      return res.status(404).json({ message: 'Evidência não encontrada' });
    }

    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=evidence_${evidenceId}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).text('Laudo da Evidência', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Descrição: ${evidence.description || 'Não informada'}`);
    doc.text(`Data da Coleta: ${evidence.collectionDate?.toLocaleDateString() || 'Não informada'}`);
    doc.text(`Hora da Coleta: ${evidence.collectionTime || 'Não informada'}`);
    doc.text(`Localização: ${evidence.latitude || 'Não informada'}, ${evidence.longitude || 'Não informada'}`);
    doc.text(`Adicionado por: ${evidence.addedBy?.name || 'Não informado'}`);

    doc.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao gerar relatório' });
  }
};
