const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('Error Trace:', err);

  // Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with ID of ${err.value}`;
    error = { statusCode: 404, message };
  }

  // Mongoose Duplicate Key (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    error = { statusCode: 409, message };
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    error = { statusCode: 400, message };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = { statusCode: 401, message: 'Invalid authentication token' };
  }

  if (err.name === 'TokenExpiredError') {
    error = { statusCode: 401, message: 'Authentication token has expired' };
  }

  const statusCode = error.statusCode || res.statusCode || 500;
  const errorMessage = error.message || 'Server Error. Something went wrong on our end.';

  // Render HTML error page for browser requests
  if (req.accepts('html')) {
    return res.status(statusCode).render('error', {
      pageTitle: `Error ${statusCode}`,
      errorTitle: `${statusCode} Error`,
      errorMessage: process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'Internal Server Error'
        : errorMessage,
      errorCode: statusCode,
      stack: process.env.NODE_ENV === 'development' ? err.stack : null
    });
  }

  // JSON fallback
  res.status(statusCode).json({
    success: false,
    error: errorMessage
  });
};

module.exports = errorHandler;
