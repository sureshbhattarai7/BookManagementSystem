const mongoose = require('mongoose');
const app = require('./app');

process.on('uncaughtException', err => {
    console.log(err.name, err.message);
    console.log('UNCAUGHT EXCEPTION! Shutting down the System.....');
    process.exit(1);
})

const DB = process.env.DATABASE;
mongoose.connect(DB, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(() => {
    console.log('Database connected successfully!');
}).catch(() => {
    console.log('Database connection failed!');
});

const PORT = process.env.PORT;
const server = app.listen(PORT, () => {
    console.log(`App is running at port ${PORT}`);
});

process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    console.log('UNHANDLED REJECTION! SHUTTING DOWN THE SYSTEM......');
    server.close(() => {
        process.exit(1);
    });
});