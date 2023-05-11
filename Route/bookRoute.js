const express = require('express');
const Router = express.Router();
const bookController = require('./../Controller/bookController');
const authController = require('./../Controller/authController');

Router.route('/book-stats').get(bookController.getBookStats);

Router.route('/')
    .post(bookController.createBook)
    .get(bookController.getBooks);

Router.route('/:id')
    .get(bookController.getBook)
    .patch(bookController.updateBook)
    .delete(authController.protect, authController.restrictTo('admin'), bookController.deleteBook);

module.exports = Router;