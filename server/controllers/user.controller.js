const bcrypt = require("bcrypt");
const mongoose = require('mongoose');
const User = require("../models/user.model");
const db=mongoose.connection;
const validator = require('validator');
const jwt = require("jsonwebtoken");
const expressjwt = require("express-jwt");
const ObjectId = require('mongodb').ObjectId

exports.register =  async(req, res) => {
    let body = req.body
    async function RegiterValid(data){
    
        let errors = {}
    
        data.username = data.username || ' '
        data.email = data.email || ' '
        data.password= data.password|| ' '
    
        //username
    
        if (!validator.isLength(data.username, {
                min: 2,
                max: 30
            })) {
            errors= 'Username should be between 2 and 30 characters'
            return errors;
        }
    
        if (validator.isEmpty(data.username)) {
            errors = 'Username is required'
            return errors;
        }
    
        if (data.username != "" && !validator.isAlphanumeric(data.username)) {
            errors = 'Username can only contain letters and numbers.'
            return errors;
        }
    
        
        let usernameExists = await  db.collection('users').findOne({username: data.username})
        if(usernameExists){
            errors= 'Username already exists.'
            return errors;
        }
    
        //email
    
        if (!validator.isEmail(data.email)){
            errors = 'You must provide a valid email address.'
            return errors;
        }
    
        let emailExists = await db.collection('users').findOne({email: data.email})
        if(emailExists){
            errors= 'email already exists.'
            return errors;
        }
    
    
        //password
    
        if (validator.isEmpty(data.password1)) {
            errors = 'Password is required'
            return errors;
        }
        if (!validator.isLength(data.password1, {
                min: 6,
                max: 30
            })) {
            errors = 'Password should be at least 8 characters'
            return errors;
        }

        if (validator.isEmpty(data.password1)) {
            errors = 'Password is required'
            return errors;
        }
        if (!validator.isLength(data.password1, {
                min: 6,
                max: 30
            })) {
            errors = 'Password should be at least 8 characters'
            return errors;
        }

        if(body.password1 != body.password2){
            errors = "Passwords don't match"
            return errors;
        }
        
        return  errors
    
    
    }
    let erry = await RegiterValid(req.body);
    console.log(erry);


    

    if (!(Object.keys(erry).length === 0)) {
        
        // res.status(400).json(errors);
        return res.status(400).json({error : erry});
    }
    try{
        let salt = bcrypt.genSaltSync(10)
        let hashedPW = body.password1
        hashedPW = hashedPW.toString();
        hashedPW = bcrypt.hashSync(body.password1, salt)
        let user = new User({
            username: body.username,
            email: body.email,
            password1: hashedPW
        })
        console.log(user)
        db.collection('users').insertOne(user,function(err, collection){
            if (err) throw err;
            console.log("Record inserted Successfully");
            const payload = {
                id: user._id,
                email: user.email
            }
            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET_KEY,
                {expiresIn: 86400}
            )
            return res.cookie("token", token,{ maxAge: 1000 * 60 * 10, httpOnly: false }).status(200).json({
                message: "Record Inserted",
                token: token,
                username: user.username,
                email: user.email,
                userId: user._id
            })
                  
        });
    }
    catch(error){
        const status = error.statusCode || 500;
        return res.status(status).json({error : error})
    }
}


exports.login = async(req,res) =>{
    let body  = req.body   
    let user = await db.collection('users').findOne({username: body.username})
    try{
        if(user){
            let isPasswordMatching = await bcrypt.compare(body.password, user.password1);
            if(isPasswordMatching){
                const payload = {
                    id: user._id,
                    email: user.email,
                    username: user.username
                }
                const token = jwt.sign(
                    payload,
                    process.env.JWT_SECRET_KEY,
                    {expiresIn: 86400}
                )
                return res.cookie("token", token,{ maxAge: 1000 * 60 * 10, httpOnly: false }).status(200).json({
                    message:"Logged In",
                    token: token,
                    username: user.username,
                    email: user.email,
                    userId: user._id
                })
                
            }
            else{
                return res.status(400).json({error: "Password does not match"})
            }
        }
        else{
            return res.status(400).json({error: "User does not exist"})
        }
    }
    catch(error){
        const status = error.statusCode || 500;
        return res.status(status).json({error : error})
    }
}

exports.logout = (req, res) => {
    res.clearCookie('token')
    console.log("signed out")
    return res.status(200).json({
      message: "signed out"
    })
}

exports.delete = async(req,res) => {
    const id = req.params.userId;
    User.findByIdAndDelete(id)
    .then(result => {
        console.log(result);
        res.clearCookie('token')
        return res.status(200).json({message: "Profile deleted"})
    })
    .catch(err => {
        const status = err.statusCode || 500;
        return res.status(status).json({error : err})
      
    });
}

exports.edit = async(req,res) => {
    const idm = req.params.userId;
    let body = req.body
    let user = await db.collection('users').findOne({_id : ObjectId(idm)})
    let isPasswordMatching = await bcrypt.compare(body.old_password, user.password1);
    if(!isPasswordMatching) return res.status(200).json({error: "Incorect Password"});
    let errors = {}
    let data = body
    data.username = data.username || ' '
    data.email = data.email || ' '
    data.password= data.password|| ' '

    //username

    if (!validator.isLength(data.username, {
            min: 2,
            max: 30
        })) {
        errors = 'Username should be between 2 and 30 characters'
        return errors;
    }

    if (validator.isEmpty(data.username)) {
        errors = 'Username is required'
        return errors;
    }

    if (data.username != "" && !validator.isAlphanumeric(data.username)) {
        errors = 'Username can only contain letters and numbers.'
        return errors;
    }
    
    
    let usernameExists = await  db.collection('users').findOne({username: data.username})
    if(usernameExists && usernameExists.username != data.username){
        errors= 'Username already exists.'
        return errors;
    }
    if (validator.isEmpty(data.password1)) {
        errors = 'Password is required'
        return errors;
    }
    if (!validator.isLength(data.password1, {
            min: 6,
            max: 30
        })) {
        errors = 'Password should be at least 8 characters'
        return errors;
    }

    if(body.password1 != body.password2){
        errors= "Passwords don't match"
        return errors;
    }
    if (!(Object.keys(errors).length === 0)) {
        
        // res.status(400).json(errors);
        return res.status(400).json({error : errors});
    }
    let salt = bcrypt.genSaltSync(10)
    let hashedPW = body.password1
    hashedPW = hashedPW.toString();
    hashedPW = bcrypt.hashSync(body.password1, salt)
    User.findByIdAndUpdate(idm, {username: body.username, password1:hashedPW})
    .then(updated => {
        if(!updated){
            return res.status(400).json({error: "Profile updation failed"})
        }
        return res.status(200).json({message: "Profile updated"});
    })
    .catch(err => {
        return res.status(400).json({error : err});
    });
}

exports.isLoggedIn = async(req, res, next) =>{
    const token = req.cookies['token'];
    console.log(token)
    if(!token){
        return res.json({
            isLoggedIn:false,
            error: "Please login first"
        })
    }
    next()
}

exports.userByID = async (req, res, next, id) => {
    try {
      let user = await User.findById(id)
      if (!user)
        return res.status(400).json({
          error: "User not found"
        })
      req.profile = user
      next()
    } catch (err) {
      return res.status('400').json({
        error: "Could not retrieve user"
      })
    }
}

exports.list = async(req, res) =>{
    try{
        let users = await User.find().select('username email')
        res.status(200).json(users)  
    }
    catch(err){
        return res.status(400).josn(err)
    }
    
}
exports.Profile = async(req, res) =>{
    try{
        let user = req.profile
        user.hashedPW = null
        return res.status(200).json(user)
    }
    catch{
        return res.status(404).json({
            error: "Could not fetch user info"
        })
    }
}