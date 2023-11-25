const db = require('../db');

const getProductById = (req, res, next) => {
  const id = req.params.id;
  db.query('SELECT * FROM products WHERE product_id = $1', [id])
    .then((result) => {
      if (result.rowCount !== 0) {
        return res.status(200).json(result.rows);
      } else return res.status(404).json('Товара по данному id не существует');
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при получении товара: ${errorMessage}`);
    });
};

const getProducts = (req, res, next) => {
  db.query('SELECT * FROM products ORDER BY product_id')
    .then((result) => {
      res.json(result.rows);
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при получении товаров: ${errorMessage}`);
    });
};

const addProduct = (req, res, next) => {
  const { title, type, price, description } = req.body;

  if (!title || !type || !price || !description) {
    res.status(400).json({ message: 'Не все обязательные поля были предоставлены.' });
    return;
  }

  db.query('INSERT INTO products (title, type, price, description) VALUES ($1, $2, $3, $4)', [
    title,
    type,
    price,
    description,
  ])
    .then(() => {
      res.status(200).send('Новый товар успешно создан и добавлен в базу');
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при добавлении товара: ${errorMessage}`);
    });
};

const changeProduct = (req, res, next) => {
  const id = req.params.id;
  const { price, description } = req.body;

  if (!price && !description) {
    res.status(400).json({ message: 'Введите новую цену или новое описание.' });
    return;
  }

  const updateParams = [];
  const queryParams = [];

  if (price !== undefined) {
    updateParams.push(`price = $${updateParams.length + 1}`);
    queryParams.push(price);
  }

  if (description !== undefined) {
    updateParams.push(`description = $${updateParams.length + 1}`);
    queryParams.push(description);
  }

  const updateQuery = `UPDATE products SET ${updateParams.join(', ')} WHERE product_id = $${
    queryParams.length + 1
  }`;

  db.query(updateQuery, [...queryParams, id])
    .then(() => {
      res.status(200).send('Данные товара успешно изменены');
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при изменении товара: ${errorMessage}`);
    });
};

const deleteProduct = (req, res, next) => {
  const id = req.params.id;
  db.query('DELETE FROM products WHERE product_id = $1', [id])
    .then(() => {
      res.status(200).send('Товар успешно удален');
    })
    .catch((error) => {
      const errorMessage = error.message || 'Внутренняя ошибка сервера';
      return res.status(500).json(`Ошибка при удалении корзины: ${errorMessage}`);
    });
};

module.exports = {
  getProductById,
  getProducts,
  addProduct,
  changeProduct,
  deleteProduct,
};
