const router = require('express').Router();
const userControllers = require('../controllers/users');
const productControllers = require('../controllers/products');
const cartControllers = require('../controllers/carts');
const orderControllers = require('../controllers/orders');
const auth = require('../middlewares/auth');
const { createAccessCheckMiddleware } = require('../middlewares/accessCheck');
const checkAdminAccess = createAccessCheckMiddleware(1);
const checkUserAccess = createAccessCheckMiddleware(2);

router.post('/signup', userControllers.registerUser);
router.post('/signin', userControllers.loginUser);

router.use(auth);

router.get('/users/me', userControllers.getCurrentUser);
router.get('/users', checkAdminAccess, userControllers.getUsers);
router.get('/users/:id', checkAdminAccess, userControllers.getUserById);
router.patch('/users/:id', checkUserAccess, userControllers.updateUser);
router.delete('/users/:id', checkAdminAccess, userControllers.deleteUser);

router.get('/products', productControllers.getProducts);
router.get('/products/:id', productControllers.getProductById);
router.post('/products', checkAdminAccess, productControllers.addProduct);
router.patch('/products/:id', checkAdminAccess, productControllers.changeProduct);
router.delete('/products/:id', checkAdminAccess, productControllers.deleteProduct);

router.get('/carts', checkAdminAccess, cartControllers.getCarts);
router.get('/carts/:id', checkUserAccess, cartControllers.getCartContentById);
router.post('/carts/:id', checkAdminAccess, cartControllers.createCart);
router.patch('/carts/:id', checkUserAccess, cartControllers.updateCart);
router.delete('/carts/:id', checkUserAccess, cartControllers.clearCart);

router.get('/orders', checkAdminAccess, orderControllers.getOrders);
router.get('/orders/:id', checkUserAccess, orderControllers.getOrderById);
router.post('/orders/:id', checkUserAccess, orderControllers.createOrder);
router.patch('/orders/:id', checkAdminAccess, orderControllers.changeOrder);
router.delete('/orders/:id', checkAdminAccess, orderControllers.deleteOrder);

module.exports = router;
