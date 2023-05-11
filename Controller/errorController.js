const AppError = require('./../Utils/appError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
}

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    console.log(value);

    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
}

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);

    const message = `Invalid data. ${errors.join('. ')}`;
    return new AppError(message, 400);
}

const handleJWTError = () => new AppError('Invalid token! Please log in again.', 401);
const handleTokenExpiredError = () => new AppError('Your token has been expired! Please log in again!!', 401);

const sendErrorDevelopment = (err, res) => {
    res.status(err.statusCode).json({
        status: 'error',
        error: err,
        message: err.message,
        stack: err.stack
    })
};

const sendErrorProduction = (err, res) => {
    //Operational, trusted error: Send message to the client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: 'error',
            message: err.message
        })
    } else {
        //Programming or other unknown error: Do not leak the error
        console.error('Error!');
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!'
        })
    }
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        return sendErrorDevelopment(err, res);
    } else if (process.env.NODE_ENV.trim() === 'production') {
        let error = { ...err };
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleTokenExpiredError();
        sendErrorProduction(err, res);
    }
};

