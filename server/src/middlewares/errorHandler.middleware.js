// middlewares/errorHandler.middleware.js

const errorHandler = (err, req, res, next) => {
  // Handle case where err might be null or undefined
  if (!err) {
    err = { message: "Unknown error", status: 500 };
  }

  // Log error stack if available
  if (err.stack) {
    console.error(err.stack);
  } else {
    console.error(err.message || "Unknown error");
  }

  // Ensure res is available
  if (!res || !res.status) {
    console.error("Error handler called without valid response object");
    return;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "Duplicate field value entered",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  // Default error - ensure status is a valid number
  const statusCode = (err.status && typeof err.status === 'number' && err.status > 0) 
    ? err.status 
    : 500;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;
