const express = require('express');
const router = express.Router();
const { isValidObjectId } = require('mongoose');
const {
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// Validação de ID nas rotas que precisam
router.get('/:id', authMiddleware, async (req, res, next) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ msg: 'ID inválido' });
  }
  next();
}, getUser);

// Listar todos os usuários (apenas admin) com paginação
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin']), // Somente admin pode listar
  getAllUsers
);

// Obter um único usuário por ID
router.get(
  '/:id',
  authMiddleware,
  getUser
);

// Atualizar um usuário (somente admin pode atualizar qualquer usuário)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']), // Apenas admin pode atualizar usuários
  updateUser
);

// Deletar um usuário (somente admin pode deletar qualquer usuário)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']), // Apenas admin pode deletar usuários
  deleteUser
);

// Criar novo usuário (apenas admin)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin']), // Apenas admin pode criar novos usuários
  createUser
);

module.exports = router;
