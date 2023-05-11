const express = require('express');
const userController = require('./../Controller/userController');
const authController = require('./../Controller/authController');
const Router = express.Router();

Router.route('/signup').post(authController.signup);
Router.route('/login').post(authController.loginUser);
Router.route('/forgotPassword').post(authController.forgotPassword);
Router.route('/resetPassword/:token').patch(authController.resetPassword);
Router.patch('/updatePassword', authController.protect, authController.updatePassword);
Router.patch('/updateCurrentData', authController.protect, userController.updateCurrentData);
Router.delete('/deleteCurrentData', authController.protect, userController.deleteCurrentData);

Router.route('/user-stats').get(userController.getUserStats);

Router.route('/')
    .post(authController.signup)
    .get(authController.protect, userController.getUsers);

Router.route('/:id').get(userController.getUser)
   
module.exports = Router;