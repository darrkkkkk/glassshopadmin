var express = require('express');
var router = express.Router();
var adminController = require('./adminController');
const { ensureAuthenticated, checkPermission } = require('../../middleware/auth');

/* GET home page. */
router.get('/', adminController.getLogin);
router.get('/admin/api/dashboard/revenue/:range', ensureAuthenticated, adminController.getRevenueStats);
router.get('/admin',ensureAuthenticated, adminController.getHome);


router.get('/admin/login', adminController.getLogin);
router.post('/admin/login', adminController.postLogin);
router.post('/admin/check-availability', adminController.checkAvailability);

router.get('/admin/logout',ensureAuthenticated, adminController.getlogout);
/* Get management pages*/
router.get('/admin/api/accounts',ensureAuthenticated, checkPermission('accounts'), adminController.getAccounts);
router.get('/admin/manage-accounts',ensureAuthenticated, checkPermission('accounts'), adminController.manageAccount);
router.put('/admin/manage-accounts/ban/:id',ensureAuthenticated,  adminController.banAccount);
router.get('/admin/profile',ensureAuthenticated,  adminController.getProfile);

// Route to update the user profile
router.post('/admin/profile',ensureAuthenticated, adminController.updateProfile);
router.post('/admin/update-password', ensureAuthenticated, adminController.updatePassword);

/* Product management */
router.get('/admin/api/products',ensureAuthenticated, checkPermission('products'), adminController.getProducts);
router.get('/admin/api/products/:id',ensureAuthenticated, adminController.getProductById);
router.put('/admin/api/products/:id',ensureAuthenticated, adminController.updateProduct);
router.post('/admin/api/products/:id/images',ensureAuthenticated, adminController.addProductImage);
router.delete('/admin/api/products/:id/images/:index',ensureAuthenticated, adminController.removeProductImage);
router.delete('/admin/api/products/:id',ensureAuthenticated, adminController.deleteProduct);
router.post('/admin/api/products', ensureAuthenticated, checkPermission('products'), adminController.addProduct);
router.get('/admin/manage-products',ensureAuthenticated, checkPermission('products'), adminController.manageProduct);

/* Order management */
router.get('/admin/api/orders', ensureAuthenticated, checkPermission('orders'), adminController.getOrders);
router.get('/admin/api/orders/:id', ensureAuthenticated, checkPermission('orders'), adminController.getOrderById);
router.put('/admin/api/orders/:id/status', ensureAuthenticated, checkPermission('orders'), adminController.updateOrderStatus);
router.get('/admin/manage-orders', ensureAuthenticated, checkPermission('orders'), adminController.manageOrder);


module.exports = router;
