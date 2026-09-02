const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      req.flash?.('error_msg', 'Authentication required.');
      return res.status(401).redirect('/login');
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      return res.render('error', {
        pageTitle: 'Access Denied',
        errorTitle: '403 Forbidden',
        errorMessage: `Access denied. Role '${req.user.role}' is not authorized to access this resource. Required role(s): ${roles.join(', ')}.`,
        errorCode: 403
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
