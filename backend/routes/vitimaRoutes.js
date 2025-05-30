// vitimaRoutes.js
const express = require('express');
const router = express.Router();
const vitimaController = require('../controllers/vitimaController');

router.post('/', vitimaController.createVitima);
router.get('/', vitimaController.listVitimas);

module.exports = router;
