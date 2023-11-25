const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { SALT_ROUNDS, SECRET_KEY } = process.env;

const getCurrentUser = (req, res, next) => {
  const userId = req.user.userId;
  db.query('SELECT user_id, firstname, lastname, email, role_id FROM users WHERE user_id = $1', [
    userId,
  ])
    .then((result) => {
      if (result.rowCount !== 0) {
        return res.status(200).json(result.rows);
      } else return res.json('Пользователя по данному id не существует');
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при получении пользователя: ${errorMessage}`);
    });
};

const getUserById = (req, res, next) => {
  const id = req.params.id;
  db.query('SELECT user_id, firstname, lastname, email, role_id FROM users WHERE user_id = $1', [
    id,
  ])
    .then((result) => {
      if (result.rowCount !== 0) {
        return res.status(200).json(result.rows);
      } else return res.json('Пользователя по данному id не существует');
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при получении пользователя: ${errorMessage}`);
    });
};

const getUsers = (req, res, next) => {
  const { firstname, lastname, email } = req.body;
  const values = [];
  let queryText = 'SELECT user_id, firstname, lastname, email, role_id FROM users';

  if (firstname || lastname || email) {
    queryText += ' WHERE';
    if (firstname) {
      queryText += ` firstname = $${values.length + 1}`;
      values.push(firstname);
    }

    if (lastname) {
      queryText += `${values.length > 0 ? ' AND' : ''} lastname = $${values.length + 1}`;
      values.push(lastname);
    }

    if (email) {
      queryText += `${values.length > 0 ? ' AND' : ''} email = $${values.length + 1}`;
      values.push(email);
    }
  }
  queryText += ' ORDER BY user_id';

  db.query(queryText, values)
    .then((result) => {
      if (result.rowCount !== 0) {
        return res.status(200).json(result.rows);
      } else return res.status(404).json('Пользователей с указанными данными не найдено');
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при поиске пользователей: ${errorMessage}`);
    });
};

const registerUser = (req, res, next) => {
  const { firstname, lastname, email, password, role } = req.body;

  if (!firstname || !lastname || !email || !password || !role) {
    res.status(400).json({ message: 'Не все обязательные поля были предоставлены.' });
    return;
  }

  let userId;
  bcrypt
    .hash(password, parseInt(SALT_ROUNDS))
    .then((hash) => {
      // Создаём пользователя
      return db.query(
        'INSERT INTO users (firstname, lastname, email, password_hash, role_id) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
        [firstname, lastname, email, hash, role],
      );
    })
    .then((result) => {
      userId = result.rows[0].user_id;
      // Проверяем существование корзины
      return db.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
    })
    .then((result) => {
      if (result.rows.length === 0) {
        // Создаём корзину
        return db.query('INSERT INTO carts (user_id) VALUES ($1)', [userId]);
      } else {
        res.status(409).json({ message: 'Корзина для данного пользователя уже существует.' });
      }
    })
    .then(() => {
      res.status(200).send('Пользователь и корзина для него успешно созданы');
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при создании пользователя: ${errorMessage}`);
    });
};

const loginUser = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Не все обязательные поля были предоставлены.' });
    return;
  }

  // Находим пользователя по email
  db.query('SELECT * FROM users WHERE email = $1', [email])
    .then((result) => {
      if (result.rowCount === 0) {
        // Если пользователя с таким email нет, возвращаем ошибку
        res.status(401).json({ message: 'Неправильный email или пароль.' });
        return;
      }

      const user = result.rows[0];

      // Сравниваем предоставленный пароль с хешем пароля в базе данных
      bcrypt.compare(password, user.password_hash).then((passwordsMatch) => {
        if (!passwordsMatch) {
          // Если пароли не совпадают, возвращаем ошибку
          res.status(401).json({ message: 'Неправильный email или пароль.' });
          return;
        }

        // Генерация JWT-токена
        const token = jwt.sign({ userId: user.user_id }, SECRET_KEY, { expiresIn: '1h' });

        // Возвращаем токен в ответе
        res.status(200).json({ message: 'Вход успешно выполнен', token });
      });
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при входе пользователя: ${errorMessage}`);
    });
};

const updateUser = (req, res, next) => {
  const id = req.params.id;
  const { firstname, lastname } = req.body;

  const updateParams = [];
  const queryParams = [];

  if (firstname) {
    updateParams.push(`firstname = $${updateParams.length + 1}`);
    queryParams.push(firstname);
  }

  if (lastname) {
    updateParams.push(`lastname = $${updateParams.length + 1}`);
    queryParams.push(lastname);
  }

  const updateQuery = `UPDATE users SET ${updateParams.join(', ')} WHERE user_id = $${
    updateParams.length + 1
  } RETURNING *`;

  db.query(updateQuery, [...queryParams, id])
    .then((result) => {
      const response = {
        message: 'Данные пользователя успешно изменены:',
        firstname: result.rows[0].firstname,
        lastname: result.rows[0].lastname,
      };
      res.status(200).json(response);
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при обновлении пользователя: ${errorMessage}`);
    });
};

const deleteUser = (req, res, next) => {
  const id = req.params.id;
  //Удаляем пользователя, а все связанные записи в других таблицах удалятся автоматически благодаря ON DELETE CASCADE
  db.query('DELETE FROM users WHERE user_id = $1', [id])
    .then(() => {
      res.status(200).send('Пользователь успешно удален');
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при удалении пользователя: ${errorMessage}`);
    });
};

module.exports = {
  getCurrentUser,
  getUserById,
  getUsers,
  registerUser,
  loginUser,
  updateUser,
  deleteUser,
};
