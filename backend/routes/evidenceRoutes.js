const express = require('express');
const router = express.Router();
const evidenceController = require('../controllers/evidenceController');
const upload = require('../middleware/upload');

// Rota para criar uma nova evidência
router.post('/', upload.single('imageFile'), evidenceController.createEvidence);

// Rota para obter todas as evidências
router.get('/', evidenceController.getAllEvidence);
// Rota para obter evidências por ID de caso
router.get('/case/:caseId', evidenceController.getEvidenceByCaseId);

// Rota para obter uma evidência por ID
router.get('/:id', evidenceController.getEvidenceById);

// Rota para atualizar uma evidência por ID
router.put('/:id', evidenceController.updateEvidence);

// Rota para deletar uma evidência por ID
router.delete('/:id', evidenceController.deleteEvidence);

// Rota para gerar o laudo em PDF da evidência
router.get('/:id/report', evidenceController.generateEvidenceReport);

module.exports = router;

