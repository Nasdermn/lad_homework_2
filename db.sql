-- Создание таблиц

CREATE TABLE roles (
  role_id SERIAL PRIMARY KEY,
  role VARCHAR
);

CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  firstname VARCHAR,
  lastname VARCHAR,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  role_id INTEGER REFERENCES roles(role_id)
);

CREATE TABLE products (
  product_id SERIAL PRIMARY KEY,
  title VARCHAR UNIQUE,
  type VARCHAR,
  price NUMERIC(10, 2),
  description TEXT
);

CREATE TABLE carts (
  cart_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE cart_items (
  cart_id INTEGER REFERENCES carts(cart_id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(product_id),
  quantity INTEGER,
  PRIMARY KEY (cart_id, product_id)
);

CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  order_date TIMESTAMP
);

CREATE TABLE order_details (
  order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(product_id),
  quantity INTEGER,
  PRIMARY KEY (order_id, product_id)
);

-- Вставка данных

INSERT INTO roles
VALUES
(1, 'Administrator'),
(2, 'Customer');

INSERT INTO users (firstname, lastname, email, password_hash, role_id)
VALUES
('Dan', 'Adminov', 'admin@mail.ru', 'hashed_password', 1),
('John', 'Connor', 'john@gmail.com', 'hashed_password', 2),
('Steve', 'Manson', 'ogst@gmail.com', 'hashed_password', 2),
('Leonard', 'Brown', 'leobrown@gmail.com', 'hashed_password', 2),
('Thomas', 'Wayne', 'twtop@gmail.com', 'hashed_password', 2),
('Vincent', 'McDonut', 'vdevelop@gmail.com', 'hashed_password', 2);

INSERT INTO carts (user_id) VALUES (1), (2), (3), (4), (5), (6);

INSERT INTO products (title, type, price, description)
VALUES
('Adidas sneakers', 'Boots', 19.50, 'Кроссовки от фирмы Adidas'),
('Nike sneakers', 'Boots', 15.00, 'Кроссовки от фирмы Nike'),
('Puma sneakers', 'Boots', 12.80, 'Кроссовки от фирмы Puma'),
('Army boots', 'Boots', 25.00, 'Качественные берцы'),
('Rubber boots', 'Boots', 5.50, 'Резиновые сапоги'),
('Sandals', 'Boots', 3.25, 'Дешёвые сандалии'),
('Jeans', 'Pants', 15.00, 'Обычные джинсы'),
('Black trousers', 'Pants', 12.00, 'Чёрные шорты'),
('Adidas sports shorts', 'Pants', 17.65, 'Спортивные шорты Adidas'),
('Nike sweatpants', 'Pants', 33.33, 'Спортивные штаны Nike'),
('Military pants', 'Pants', 40.00, 'Камуфляжные штаны'),
('Military shorts', 'Pants', 30.00, 'Камуфляжные шорты');