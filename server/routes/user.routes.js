const express = require('express')
const userController = require('../controllers/user.controller')
const isAuthenticated = require("../helpers/verifyJWT")

const router = express.Router()

router.route('/register')
    .post(userController.register)

router.route('/list')
    .get(userController.list)

router.route('/login')
    .post(userController.login)
router.route('/users/:userId')
    .get(userController.isLoggedIn, userController.Profile)
    .delete(userController.isLoggedIn, isAuthenticated ,userController.delete)
    .put(userController.isLoggedIn, isAuthenticated , userController.edit)

router.route('/logout')
    .get(userController.logout)    

router.param('userId', userController.userByID)    

module.exports = router;