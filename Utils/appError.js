class AppError extends Error{
    constructor(message, statusCode) {
        super(message); //super calls the parent constructor

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.costructor);
    };
};

module.exports = AppError;