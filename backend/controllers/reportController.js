const PDFDocument = require('pdfkit');
const Evidence = require('../models/Evidence'); // Ajuste para seu model

async function generateEvidenceReport(req, res) {
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
}

module.exports = { generateEvidenceReport };
