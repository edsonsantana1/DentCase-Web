const express = require('express');
const router = express.Router();
const { register, login, refreshToken } = require('../controllers/authController'); // Importa o método refreshToken

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken); // Nova rota para Refresh Token

module.exports = router;