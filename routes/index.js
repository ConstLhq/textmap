var express = require('express');
var router = express.Router();
var uploadController=require('../app/controllers/uploadController');
var Index= require('../app/controllers/Index')
var User =require('../app/controllers/user')

/* GET home page. */ 
router.get('/', Index.index);
router.post('/dataInput',uploadController.dataInput);
router.post('/mydoc',Index.mydoc);
router.post('/event',Index.event);
router.post('/geocode',Index.geocode);
router.post('/updatexml',Index.updateXml);

router.post('/user/signup', User.signup)
router.post('/user/signin', User.signin)
router.get('/signin', User.showSignin)
router.get('/signup', User.showSignup)
router.get('/logout', User.logout)

module.exports = router;