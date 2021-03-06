const Users = require('../models/userModel');
const Payments = require('../models/paymentModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userController = {
    register: async (req, res) => {
        try{
            const {name, email, password} = req.body;

            //Check user exist
            const user = await Users.findOne({email});
            if (user) return res.status(400).json({message: "The email is already exist"});

            //Password's length is more than 6 characters
            if (password.length < 6){
                return res.status(400).json({message: "The password is at least 6 characters long"});
            }

            //Password Encryption
            const passwordHash = await bcrypt.hash(password, 10);
            const newUser = new Users({
                name, email, password: passwordHash
            });

            //Save user to database
            await newUser.save();

            //Create token to authentication
            const accesstoken = createAccessToken({id: newUser._id});
            const refreshtoken = createRefreshToken({id: newUser._id});

            res.cookie('refreshtoken', refreshtoken, {
                httpOnly: true,
                path: '/user/refresh_token',
                maxAge: 7*24*60*60*1000
            });

            res.json({accesstoken});
        }
        catch(err){
            return res.status(500).json({message: err.message});
        }
    },

    login: async (req, res) => {
        try{
            const { email, password } = req.body;

            const user = await Users.findOne({email: email});
            if (!user) return res.status(400).json({message: "User does not exist"});

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({message: "Incorrect password"});

            //Create access token and refresh token if login success
            const accesstoken = createAccessToken({id: user._id});
            const refreshtoken = createRefreshToken({id: user._id});

            res.cookie('refreshtoken', refreshtoken, {
                httpOnly: true,
                path: '/user/refresh_token',
                maxAge: 7*24*60*60*1000
            });

            res.json({accesstoken});

        }
        catch(err){
            return res.status(500).json({message: err.message});
        }
    },

    logout: async (req, res) => {
        try{
            res.clearCookie('refreshtoken', {path: '/user/refresh_token'});
            return res.json({message: "Logged out"});
        }
        catch(err){
            return res.status(500).json({message: err.message});
        }
    },

    refreshToken: (req, res) => {
        try {
            const rf_token = req.cookies.refreshtoken;
            if(!rf_token) return res.status(400).json({msg: "Please Login or Register"})

            jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) =>{
                if(err) return res.status(400).json({msg: "Please Login or Register"});

                const accesstoken = createAccessToken({id: user.id});

                res.json({accesstoken});
            })

        } catch (err) {
            return res.status(500).json({msg: err.message});
        }
        
    },

    getUser: async (req, res) =>{
        try{
            const user = await Users.findById(req.user.id).select('-password');
            if(!user) return res.status(400).json({message: "User does not exist"});

            res.json(user)
        }
        catch(err){
            return res.status(500).json({message: err.message});
        }
    },

    addCart: async (req, res) => {
        try{
            const user = await Users.findById(req.user.id);
            if (!user) return res.status(400).json({msg: "User does not exist"});

            await Users.findOneAndUpdate({_id: req.user.id}, {
                cart: req.body.cart
            });

            return res.json({msg: "???? th??m v??o gi???"});
        }
        catch(err){
            return res.status(500).json({message: err.message});
        }
    },

    history: async(req, res) => {
        try{
            const history = await Payments.find({user_id: req.user.id});

            res.json(history);
        }
        catch(err){
            return res.status(500).json({msg: err.message})
        }
    }
}

const createAccessToken = (user) => {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '11m'});
}

const createRefreshToken = (user) => {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'});
}

module.exports =  userController;