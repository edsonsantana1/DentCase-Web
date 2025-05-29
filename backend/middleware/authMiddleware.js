const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const header = req.header('Authorization');
  if (!header) {
    return res.status(401).json({ msg: 'Sem token, autorização negada' });
  }

  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ msg: 'Formato de token inválido' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id); // busca o user completo

    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }

    // ✅ Atribui id e role ao req.user
    req.user = {
      id: user._id,
      role: user.role,
    };

    next();
  } catch (err) {
    console.error('Erro na verificação do token:', err.message);
    return res.status(401).json({ msg: 'Token inválido ou expirado' });
  }
};

const roleMiddleware = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ msg: 'Acesso negado' });
  }
  next();
};

module.exports = { authMiddleware, roleMiddleware };
