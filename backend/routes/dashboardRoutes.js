const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/faixa-etaria', dashboardController.faixaEtaria);
router.get('/genero-tipo', dashboardController.generoTipo);
router.get('/bairro', dashboardController.bairro);
router.get('/identificacao', dashboardController.identificacao);
router.get('/temporal', dashboardController.temporalDistribuicao);
router.get('/identificacao-regressao', dashboardController.getIdentificacaoRegressao);



module.exports = router;
