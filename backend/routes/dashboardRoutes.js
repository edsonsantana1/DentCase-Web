const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/faixa-etaria', dashboardController.faixaEtaria);
router.get('/genero-tipo', dashboardController.generoTipo);
router.get('/bairro', dashboardController.bairro);
router.get('/faixa-regiao', dashboardController.faixaRegiao);
router.get('/identificacao', dashboardController.identificacao);
router.get('/temporal', dashboardController.temporalDistribuicao);
router.get('/boxplot-bairro', dashboardController.boxplotCasosPorBairro);
router.get('/identificacao-regressao', dashboardController.getIdentificacaoRegressao);
router.get('/identificacao-casos', dashboardController.identificacaoCasos);
router.get('/boxplot-comparacao', dashboardController.boxplotComparacaoCasos);
router.get('/distribuicao-temporal', dashboardController.distribuicaoTemporal);


module.exports = router;
