const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const auth = require('../controllers/authController');
const products = require('../controllers/productController');
const orders = require('../controllers/orderController');
const upload = require('../controllers/uploadController');

// auth
router.post('/admin/login', auth.login);
router.post('/admin/logout', auth.logout);
router.get('/admin/me', auth.me);

// public (customer side - no login)
router.get('/products', products.list);
router.get('/payment', orders.getPayment);
router.post('/orders', orders.create);
router.get('/orders/:id/track', orders.track);

// admin only
router.post('/products', requireAdmin, products.create);
router.put('/products/:id', requireAdmin, products.update);
router.delete('/products/:id', requireAdmin, products.remove);
router.get('/orders', requireAdmin, orders.list);
router.put('/orders/:id/status', requireAdmin, orders.setStatus);
router.delete('/orders/:id', requireAdmin, orders.remove);
router.put('/payment', requireAdmin, orders.setPayment);
router.post('/upload', requireAdmin, upload.image);

module.exports = router;
