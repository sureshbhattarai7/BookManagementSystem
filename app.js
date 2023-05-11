const express = require('express');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const AppError = require('./Utils/appError');
const globalErrorHandler = require('./Controller/errorController');

const userRoute = require('./Route/userRoute');
const bookRoute = require('./Route/bookRoute');
const { default: helmet } = require('helmet');

const app = express();

//GLOBAL MIDDLEWARE

//Set security HTTP headers
app.use(helmet());

//Development logging
if (process.env.NODE_ENV = "development") {
    app.use(morgan('dev'));
}

//Limit requests from the same IP
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP. Please try again in an hour'
});
app.use('/api', limiter);

//Body parser, reading data from body into req.body
app.use(express.json());

//Data sanitization against NOSQL QUERY INJECTION
app.use(mongoSanitize());

//Data sanitization against XSS 
app.use(xss());

app.use('/api/v1/users', userRoute);
app.use('/api/v1/books', bookRoute);

app.all('*', (req, res, next) => {
    next(new AppError(`Can not find ${req.originalUrl} at this server`, 404));
})

app.use(globalErrorHandler);

module.exports = app;