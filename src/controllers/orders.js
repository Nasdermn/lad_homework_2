const db = require('../db');

const getOrderById = (req, res, next) => {
  const id = req.params.id;
  db.query('SELECT user_id FROM users WHERE user_id = $1', [id])
    .then((result) => {
      if (result.rowCount === 0) {
        throw new Error('Данного пользователя не существует.');
      } else {
        return db.query(
          'SELECT orders.order_id, orders.order_date, order_details.product_id, products.title, order_details.quantity FROM orders JOIN order_details USING(order_id) JOIN products USING(product_id) WHERE orders.user_id = $1 ORDER BY orders.order_id, order_details.product_id',
          [id],
        );
      }
    })
    .then((result) => {
      if (result.rowCount > 0) {
        return res.status(200).json(result.rows);
      } else {
        return res.status(404).json('У данного пользователя нет заказов');
      }
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при получении заказов: ${errorMessage}`);
    });
};

const getOrders = (req, res, next) => {
  db.query('SELECT * FROM orders ORDER BY order_id')
    .then((result) => {
      res.status(200).json(result.rows);
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при получении заказов: ${errorMessage}`);
    });
};

const createOrder = (req, res, next) => {
  const id = req.params.id;
  let cartItemsResult;
  let cartId;

  // Проверяем наличие корзины у пользователя
  db.query('SELECT * FROM carts WHERE user_id = $1', [id])
    .then((cart) => {
      if (cart.rowCount === 0) {
        throw new Error('У пользователя нет корзины.');
      }
      cartId = cart.rows[0].cart_id;
      // Получаем товары из корзины
      return db.query(
        'SELECT c.product_id, c.quantity, p.price FROM cart_items c JOIN products p USING(product_id) WHERE c.cart_id = $1',
        [cartId],
      );
    })
    .then((result) => {
      if (result.rowCount === 0) {
        throw new Error('Корзина пользователя пуста.');
      } else cartItemsResult = result;

      const orderDate = new Date(); // Текущая дата

      // Создаем заказ
      return db.query('INSERT INTO orders (user_id, order_date) VALUES ($1, $2) RETURNING *', [
        id,
        orderDate,
      ]);
    })
    .then((orderResult) => {
      const orderId = orderResult.rows[0].order_id;

      // Получаем товары из корзины и добавляем их в заказ
      const orderItemsPromises = cartItemsResult.rows.map((item) => {
        return db.query(
          'INSERT INTO order_details (order_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
          [orderId, item.product_id, item.quantity],
        );
      });

      // Очищаем корзину после создания заказа
      orderItemsPromises.push(db.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]));

      return Promise.all(orderItemsPromises);
    })
    .then(() => {
      res.status(200).send('Заказ успешно создан');
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при создании заказа: ${errorMessage}`);
    });
};

const changeOrder = (req, res, next) => {
  const order_id = req.params.id;
  const { order_date } = req.body;

  db.query('UPDATE orders SET order_date = $1 WHERE order_id = $2 RETURNING *', [
    order_date,
    order_id,
  ])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(404).send('Заказ с указанным ID не найден');
      }
      res.status(200).json(result.rows);
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при изменении заказа: ${errorMessage}`);
    });
};

const deleteOrder = (req, res, next) => {
  const order_id = req.params.id;

  db.query('DELETE FROM order_details WHERE order_id = $1', [order_id])
    .then(() => {
      return db.query('DELETE FROM orders WHERE order_id = $1 RETURNING *', [order_id]);
    })
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(404).send('Заказ с указанным ID не найден');
      }
      res.status(200).send('Заказ успешно удален');
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при удалении заказа: ${errorMessage}`);
    });
};

module.exports = {
  getOrderById,
  getOrders,
  createOrder,
  changeOrder,
  deleteOrder,
};
