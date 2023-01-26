const express = require('express')
const userController = require('../controllers/user.controller')
const mediaController = require('../controllers/media.controller')

const router = express.Router()

router.route('/media/new/:userId')
    .post(userController.isLoggedIn, mediaController.create)

router.route('/media/by/:userId')
    .get(mediaController.mediaByUser)

router.route('/media/byy/:mediaId')
    .get(mediaController.read)
    
router.route('/media/popular')
    .get(mediaController.mostViews)

router.route('/media/search')
    .post(mediaController.search)

router.route('/media/:mediaId')
    .get(mediaController.incrementViews)
    .delete(userController.isLoggedIn, mediaController.isOwner, mediaController.deleteVideo)
    .put(userController.isLoggedIn, mediaController.isOwner, mediaController.edit)


router.route('/media/related/:mediaId')
    .get(mediaController.relatedVideos)


router.param('userId', userController.userByID) 
router.param('mediaId', mediaController.mediaByID)
module.exports = router;