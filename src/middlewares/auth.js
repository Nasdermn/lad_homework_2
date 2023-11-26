const jwt = require('jsonwebtoken');
const { NODE_ENV, SECRET_KEY } = process.env;
const db = require('../db');

module.exports = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Bearer')) {
    const error = new Error('Пользователь не авторизован');
    error.status = 401;
    throw error;
  }

  const token = authorization.replace('Bearer ', '');
  let payload;

  try {
    payload = jwt.verify(token, NODE_ENV === 'production' ? SECRET_KEY : 'dev-secret');
    // Получение роли пользователя из базы данных
    const userId = payload.userId;
    const result = await db.query('SELECT role_id FROM users WHERE user_id = $1', [userId]);

    if (result.rows.length > 0) {
      payload.role = result.rows[0].role_id;
    }
  } catch (err) {
    const error = new Error('Пользователь не авторизован');
    error.status = 401;
    throw error;
  }

  req.user = payload;
  next();
};
