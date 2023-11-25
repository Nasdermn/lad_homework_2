const db = require('../db');

const getCartContentById = (req, res, next) => {
  const id = req.params.id;

  db.query('SELECT user_id FROM users WHERE user_id = $1', [id])
    .then((result) => {
      if (result.rowCount === 0) {
        throw new Error('Данного пользователя не существует.');
      } else {
        return db.query(
          'SELECT user_id, cart_id, product_id, title, price, quantity FROM carts JOIN cart_items USING(cart_id) JOIN products USING(product_id) WHERE user_id = $1',
          [id],
        );
      }
    })
    .then((result) => {
      if (result.rowCount > 0) {
        return res.status(200).json(result.rows);
      } else {
        return res.status(404).json('Корзина данного пользователя пустая');
      }
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при получении корзины: ${errorMessage}`);
    });
};

const getCarts = (req, res, next) => {
  db.query('SELECT * FROM carts ORDER BY user_id')
    .then((result) => {
      res.status(200).json(result.rows);
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при получении списка: ${errorMessage}`);
    });
};

const createCart = (req, res, next) => {
  const id = req.params.id;
  //Проверка на существование пользователя
  db.query('SELECT * FROM users WHERE user_id = $1', [id]).then((result) => {
    if (result.rowCount) {
      //Проверка на существование корзины
      db.query('SELECT * FROM carts WHERE user_id = $1', [id])
        .then((result) => {
          if (result.rows[0] === undefined) {
            //Создание корзины
            db.query('INSERT INTO carts (user_id) VALUES ($1) RETURNING *', [id])
              .then((result) => {
                res.status(200).json(result.rows);
              })
              .catch((error) => {
                const errorMessage = error.message || 'Внутренняя ошибка сервера';
                return res.status(500).json(`Ошибка при создании корзины: ${errorMessage}`);
              });
          } else {
            res.status(409).json({ message: 'Корзина для данного пользователя уже существует.' });
          }
        })
        .catch((error) => {
          const errorMessage = error.message || 'Внутренняя ошибка сервера';
          return res.status(500).json(`Ошибка при создании корзины: ${errorMessage}`);
        });
    } else {
      res.status(409).json({ message: 'Пользователя по указанному id не существует.' });
    }
  });
};

const updateCart = (req, res, next) => {
  const id = req.params.id;
  const { product_id } = req.body;
  let cartId;
  // Проверяем наличие корзины у пользователя
  db.query('SELECT * FROM carts WHERE user_id = $1', [id])
    .then((cartResult) => {
      if (!product_id || cartResult.rowCount === 0) {
        throw new Error('Данный пользователь не имеет корзины или не передан id продукта');
      }
      cartId = cartResult.rows[0].cart_id;
      return db.query('SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2', [
        cartId,
        product_id,
      ]);
    })
    .then((cartItemResult) => {
      if (cartItemResult.rowCount > 0) {
        // Запись уже существует, увеличиваем quantity
        const newQuantity = cartItemResult.rows[0].quantity + 1;
        return db.query(
          'UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3 RETURNING *',
          [newQuantity, cartId, product_id],
        );
      } else {
        // Запись не существует, добавляем новую запись
        return db.query(
          'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
          [cartId, product_id, 1],
        );
      }
    })
    .then((result) => {
      res.status(200).json({ message: 'Товар успешно добавлен в корзину:', data: result.rows });
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при обновлении корзины: ${errorMessage}`);
    });
};

const clearCart = (req, res, next) => {
  const id = req.params.id;

  db.query(
    'DELETE FROM cart_items WHERE cart_id IN (SELECT cart_id FROM carts WHERE user_id = $1)',
    [id],
  )
    .then(() => {
      res.status(200).send('Корзина успешно очищена');
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при очистке корзины: ${errorMessage}`);
    });
};

module.exports = {
  getCartContentById,
  getCarts,
  createCart,
  updateCart,
  clearCart,
};
