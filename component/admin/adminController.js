const adminService = require('./adminService');
const bcrypt = require('bcryptjs'); // For password hashing
const passport = require('passport'); 
const getLogin = (req, res) => {
    res.render('login/login', {login: true});
  }

const postLogin = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error('Authentication error:', err);
            return res.status(500).render('login/login', { 
                login: true, 
                errorMessage: 'An unexpected error occurred. Please try again.' 
            });
        }
        if (!user) {
            return res.status(400).render('login/login', { 
                login: true, 
                errorMessage: info.message || 'Invalid email or password.' 
            });
        }
        if (user.role !== 'admin') {
            return res.status(403).render('login/login', { 
                login: true, 
                errorMessage: 'Access denied. Admins only.' 
            });
        }
        req.login(user, (err) => {
            if (err) {
                console.error('Login error:', err);
                return res.status(500).render('login/login', { 
                    login: true, 
                    errorMessage: 'Login failed. Please try again.' 
                });
            }
            return res.redirect('/admin');
        });
    })(req, res, next);
};

const getlogout = (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).render('about/about', { errorMessage: 'Failed to log out.' });
      }
      // Optional: Destroy the session manually
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).render('about/about', { errorMessage: 'Error clearing session.' });
        }
        // Redirect to login or home page after logout
        res.clearCookie('connect.sid'); // Clear the session cookie
        return res.redirect('/admin/login'); // Adjust redirect as per your app
      });
    });
  };
const getProfile = async (req, res) => {
    try {
      const user = await adminService.findUserById(req.user._id);
      res.render('profile/profile', { user });
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred while fetching the profile.');
    }
  };

// Handle profile update form submission
const updateProfile = async (req, res) => {
    try {
        const { username } = req.body;

        await adminService.updateProfile(req.user._id, username);
        res.redirect('/admin/profile');
    } catch (error) {
        console.error('Error updating profile:', error);
        if (error.message === 'Invalid username format.') {
            return res.status(400).render('profile/profile', {
                user: req.user,
                errorMessage: error.message,
            });
        }
        res.status(500).send('An error occurred while updating the profile.');
    }
};

const updatePassword = async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
  
      await adminService.updatePassword(req.user._id, oldPassword, newPassword);
      res.render('profile/profile', {
        user: req.user,
        successMessage: 'Password updated successfully!',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.message === 'Incorrect old password.' || error.message.includes('New password must include')) {
        return res.status(400).render('profile/profile', {
          user: req.user,
          errorMessage: error.message,
        });
      }
      res.status(500).send('An error occurred while updating the password.');
    }
  };

const getHome = async (req, res) => {
    res.render('index', {home: true});
}

const getAccounts = async (req, res) => {
    const { 
        page = 1, 
        limit = 10,
        sort = 'username',
        order = 'asc',
        search = ''
    } = req.query;

    try {
        const {users, total} = await adminService.getUsers(page, limit, sort, order, search);
        res.json({
            users,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error in getAccounts:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error loading accounts'
        });
    }
}

const manageAccount = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const sort = req.query.sort || 'username';
    const order = req.query.order || 'asc';
    const search = req.query.search || '';

    try {
        const {users, total} = await adminService.getUsers(page, limit, sort, order, search);
        res.render('account/account', { 
            account: true, 
            users,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            searchQuery: search,
            sortField: sort,
            sortOrder: order
        });
    } catch (error) {
        console.error('Error in manageAccount:', error);
        res.status(500).render('error', { 
            message: 'Error loading accounts',
            error: error 
        });
    }
}

const banAccount = async (req, res) => {
    try {
        const accountId = req.params.id;
        const account = await adminService.findUserById(accountId);
        
        // Toggle the status
        const newStatus = account.status === 'active' ? 'banned' : 'active';
        
        await adminService.updateUserById(accountId, {
            status: newStatus
        });
    
        res.json({
            success: true,
            message: `Account ${newStatus === 'active' ? 'unbanned' : 'banned'} successfully`
        });
    } catch (error) {
        console.error('Ban account error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating account status',
            error: error.message
        });
    }
};

const getProducts = async (req, res) => {
    const { 
        page = 1, 
        limit = 5,
        sort = 'productId',
        order = 'asc',
        search = ''
    } = req.query;

    try {
        const {products, total} = await adminService.getProducts(page, limit, sort, order, search);
        res.json({
            products,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error loading products'
        });
    }
}

const manageProduct = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const sort = req.query.sort || 'productId';
    const order = req.query.order || 'asc';
    const search = req.query.search || '';

    try {
        const {products, total} = await adminService.getProducts(page, limit, sort, order, search);
        res.render('product/product', { 
            product: true, 
            products,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            searchQuery: search,
            sortField: sort,
            sortOrder: order
        });
    } catch (error) {
        res.status(500).render('error', { 
            message: 'Error loading products',
            error 
        });
    }
}

const getProductById = async (req, res) => {
    try {
        const product = await adminService.findProductById(req.params.id);
        res.json(product);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const product = await adminService.updateProductById(req.params.id, req.body);
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const addProductImage = async (req, res) => {
    try {
        const product = await adminService.addProductImage(req.params.id, req.body.imageUrl);
        res.json({ success: true, images: product.image });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const removeProductImage = async (req, res) => {
    try {
        const product = await adminService.removeProductImage(req.params.id, parseInt(req.params.index));
        res.json({ success: true, images: product.image });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        await adminService.deleteProduct(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const addProduct = async (req, res) => {
    try {
        // Validate required fields
        const requiredFields = ['name', 'price', 'brand', 'material', 'sex', 'stock'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        const product = await adminService.addProduct(req.body);
        res.json({
            success: true,
            product,
            message: 'Product added successfully'
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const manageOrder = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order || 'desc';
    const status = req.query.status || '';

    try {
        const {orders, total} = await adminService.getOrders(page, limit, sort, order, status);
        res.render('order/order', { 
            order: true, 
            orders,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            status,
            sortField: sort,
            sortOrder: order
        });
    } catch (error) {
        res.status(500).render('error', { 
            message: 'Error loading orders',
            error 
        });
    }
};

const getOrders = async (req, res) => {
    const { 
        page = 1, 
        limit = 10,
        sort = 'createdAt',
        order = 'desc',
        status = ''
    } = req.query;

    try {
        const {orders, total} = await adminService.getOrders(page, limit, sort, order, status);
        res.json({
            orders,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error loading orders'
        });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const order = await adminService.updateOrderStatus(req.params.id, req.body.status);
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await adminService.findOrderById(req.params.id);
        res.json(order);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

const getRevenueStats = async (req, res) => {
    try {
        const stats = await adminService.getRevenueStats(req.params.range);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// AJAX endpoint for checking username/email availability
const checkAvailability = async (req, res) => {
    const { username, email } = req.body;
    try {
      let usernameExists = false;
      let emailExists = false;
  
      if (username) {
        usernameExists = await adminService.findUserByUsername(username);
      }
  
      if (email) {
        emailExists = await adminService.findUserByEmail(email);
      }
  
      res.json({
        usernameAvailable: !usernameExists,
        emailAvailable: !emailExists,
      });
    } catch (error) {
      console.error('Error checking availability:', error);
      res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getHome,
    getLogin,
    postLogin,
    getlogout,
    getAccounts,
    manageAccount,
    banAccount,
    getProducts,
    manageProduct,
    addProduct,
    manageOrder,
    getOrders,
    updateOrderStatus,
    getOrderById,
    getRevenueStats,

    checkAvailability,

    getProductById,
    updateProduct,
    addProductImage,
    removeProductImage,
    deleteProduct,
    manageOrder,
    getProfile,
    updateProfile,
    updatePassword
}