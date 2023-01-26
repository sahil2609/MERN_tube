const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');
const User = require("../models/user.model");
const db=mongoose.connection;
const ObjectId = require('mongodb').ObjectId
const isAuthenticated = async(req,res,next) =>{
    
    try{
        const token = req.cookies['token'];
        if(!token){
            return res.json({
                isLoggedIn:false,
                error: "Please login first"
            })
        }
        const verify = jwt.verify(token,process.env.JWT_SECRET_KEY);
        console.log(verify)
        const idm = req.params.userId;
        req.user = await User.findById(verify.id);
        let userd = await db.collection('users').findOne({_id : ObjectId(idm)})
        if(userd.email != req.user.email){
            return res.json({
                isLoggedIn: true,
                error: "Failed to Authenticate"
            })
        }
        next()
    }
    catch{
        return res.json({
            isLoggedIn: false,
            error: "Failed to Authenticate"
        })
    }
}

module.exports = isAuthenticated;