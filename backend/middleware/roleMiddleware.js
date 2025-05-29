const express = require('express');
const router = express.Router();
const laudoController = require('../controllers/laudoController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware'); // Agora importa os dois

// ✅ Apenas admin e perito podem criar laudos
router.post('/', authMiddleware, roleMiddleware(['admin', 'perito']), laudoController.createLaudo);

// ✅ Todos autenticados podem visualizar laudos
router.get('/', authMiddleware, laudoController.getAllLaudos);
router.get('/:id', authMiddleware, laudoController.getLaudoById);

// ✅ Apenas admin e perito podem atualizar e deletar laudos
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'perito']), laudoController.updateLaudo);
router.delete('/:id', authMiddleware, roleMiddleware(['admin', 'perito']), laudoController.deleteLaudo);

module.exports = router;
