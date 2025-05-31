const express = require('express');
const router = express.Router();
const { 
  createCase, 
  getCases, 
  getCaseById,
  updateCase, 
  deleteCase,
  addEvidence,
  generateReport,
  updateCaseStatus // <-- Importa a nova função
} = require('../controllers/caseController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// Criar caso (admin ou perito)
router.post('/', authMiddleware, roleMiddleware(['admin', 'perito']), createCase); 

// Listar casos (todos autenticados)
router.get('/', authMiddleware, getCases); 

// Gerar relatório (admin ou perito)
router.get('/report', authMiddleware, roleMiddleware(['admin', 'perito']), generateReport);

// Obter caso por ID
router.get('/:id', authMiddleware, getCaseById); 

// Atualizar caso (admin ou perito que criou)
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'perito']), updateCase); 

// Atualizar somente o status do caso (admin ou perito)
router.put('/:id/status', authMiddleware, roleMiddleware(['admin', 'perito']), updateCaseStatus); 

// Deletar caso (apenas admin)
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteCase); 

// Adicionar evidência (admin, perito, ou assistente participante)
router.post('/:id/evidence', authMiddleware, roleMiddleware(['admin', 'perito', 'assistente']), addEvidence);


module.exports = router;
