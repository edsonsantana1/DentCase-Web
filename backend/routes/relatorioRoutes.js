const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');

// Rotas CRUD para Relatórios
router.post('/', relatorioController.createRelatorio);
router.get('/', relatorioController.getAllRelatorios);
router.get('/:id', relatorioController.getRelatorioById);
router.put('/:id', relatorioController.updateRelatorio);
router.delete('/:id', relatorioController.deleteRelatorio);

module.exports = router;