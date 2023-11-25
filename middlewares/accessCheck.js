const db = require('../db');

const createAccessCheckMiddleware = (param) => {
  return async (req, res, next) => {
    const isAdmin = req.user.role === 1;
    const userId = parseInt(req.user.userId);
    const targetUserId = parseInt(req.params.id);

    // В зависимости от переданного параметра осуществляем нужные проверки
    if (param === 1) {
      if (isAdmin) {
        return next();
      } else {
        return res.status(403).json({ message: 'Доступ запрещен. Недостаточно прав.' });
      }
    } else if (param === 2) {
      if (isAdmin || userId === targetUserId) {
        return next();
      } else {
        return res.status(403).json({ message: 'Доступ запрещен. Недостаточно прав.' });
      }
    } else {
      return res.status(400).json({ message: 'Неверный параметр для проверки доступа.' });
    }
  };
};

module.exports = { createAccessCheckMiddleware };
