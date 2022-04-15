const router = require('express').Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

router.post('/register', userController.register);
router.post('/login', userController.login);

router.get('/logout', userController.logout);
router.get('/refresh_token', userController.refreshToken);
router.get('/infor', auth, userController.getUser);
router.get('/history', auth, userController.history);

router.patch('/addcart', auth, userController.addCart);



module.exports = router