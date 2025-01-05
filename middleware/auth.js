module.exports = {
    ensureAuthenticated: (req, res, next) => {
        if (req.isAuthenticated()) {
        return next();
    }
  
      // Handle unauthorized access
        res.status(401);
        return res.redirect('/');
    },

    checkPermission: (requiredPermission) => {
      return (req, res, next) => {
            if (!req.isAuthenticated()) {
                res.status(401);
                return res.redirect('/');
            }

            // Check if user has required permission
            if (!req.user.permission || !req.user.permission.includes(requiredPermission)) {
                res.status(403);
              
                return res.render('error', {
                    message: 'Access Denied',
                    error: { status: 403, stack: 'You do not have permission to access this resource' }
                });
            }
          
          next();
      };
    }
  };