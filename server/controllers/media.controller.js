const bcrypt = require("bcrypt");
const mongoose = require('mongoose');
const Media = require("../models/media.model");
const User = require("../models/user.model");
const db=mongoose.connection;
const formidable = require('formidable');
const fs = require('fs');
const jwt = require("jsonwebtoken");
const ObjectId = require('mongodb').ObjectId
const _ = require('lodash');

let gridfs = null
mongoose.connection.on('connected', () => {
    gridfs = new mongoose.mongo.GridFSBucket(db.db)
})

exports.create = (req, res) => {
    let form = new formidable.IncomingForm()
    form.keepExtensions = true
    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: "Video could not be uploaded"
            })
        }
        let media = new Media(fields)
        media.postedBy= req.profile
        media.postedByName = req.profile.username
        if(files.video){
            let writestream = gridfs.openUploadStream(media._id, {
            contentType: files.video.type || 'binary/octet-stream'})
            fs.createReadStream(files.video._writeStream.path).pipe(writestream)
        }
        try {
            let result = await media.save()
            console.log(result)
            res.status(200).json(result)
        }catch (err){
            return res.status(400).json({
                error: err
            })
        }
    })
}

exports.mediaByID = async (req, res, next, id) => {
    try{
        console.log(id)
        let media = await Media.findById(id).populate('postedBy', '_id name').exec()
        if (!media){
            return res.status('400').json({
            error: "Media not found"
            })
        }
        req.media = media
        let files = await gridfs.find({filename:media._id}).toArray()
        if (!files[0]) {
            res.status(404).send({
                error: 'No video found'
            })
        }     
        req.file = files[0]
        next()
    }catch(err) {
        return res.status(404).send({
            error: 'Could not retrieve media file'
        })
    }
}

exports.relatedVideos = async(req, res) =>{
    try{
        let vdos = await Media.find({"_id": {"$ne": req.media}, "genre": req.media.genre})
                    .limit(4)
                    .sort({views: -1}).populate('postedBy', '_id name')
                    .exec()
        res.json(vdos)
    }
    catch(err){
        return res.status(404).json({
            error : err
        })
    }
}

exports.incrementViews = async(req, res) =>{
    try {
        await Media.findByIdAndUpdate(req.media._id, {$inc: {"views": 1}}, {new: true}).exec()
        var media = await Media.findById(req.media._id)
        return res.status(200).json(media)
    } catch(err){
        return res.status(404).json({
            error: err
        })
    }
}

exports.read = async(req, res) =>{
    try{
        var media = await Media.findById(req.media._id)
        return res.status(200).json(media)
    }
    catch(err){
        return res.status(404).json({
            error: err
        })
    }
}

exports.deleteVideo = async(req, res) =>{
    try{
        let vid = req.media
        let deletedVid = await vid.remove()
        gridfs.delete(req.file._id)
        res.json(deletedVid)
    }
    catch(err){
        return res.status(404).json({
            error: err
        })
    }
}

exports.isOwner = async(req ,res, next) =>{
    try{
        const token = req.cookies['token'];
        if(!token){
            return res.json({
                isLoggedIn:false,
                error: "Please login first"
            })
        }
        const verify = jwt.verify(token,process.env.JWT_SECRET_KEY);
        const idm = req.media.postedBy._id;
        var uu = await User.findById(verify.id);
        let userd = await db.collection('users').findOne({_id : ObjectId(idm)})
        if(userd.email != uu.email){
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

exports.edit = async(req, res) =>{
    try{
        let media = req.media
        console.log(req.body)
        media = _.extend(media, req.body)
        media.updated = Date.now()
        await media.save()
        return res.status(200).json(media)
    }
    catch{
        return res.status(404).json({
            error: "Failed to edit"
        })
    }
    
}

exports.mediaByUser = async(req, res) =>{
    try{
        var media = await Media.find({postedBy: req.profile})
        return res.status(200).json(media)
    }
    catch{
        return res.status(404).json({
            error: "Failed to fetch"
        })
    }
      
}

exports.mostViews = async(req, res) =>{
    try{
        let media = await Media.find({})
                .limit(9)
                .populate('postedBy' , "_id, name")
                .sort({views: -1})
                .exec()
        return res.status(200).json(media)
    }
    catch{
        return res.status(404).json({
            error: "Failed to fetch"
        })
    }
}


exports.search = async(req, res) =>{
    try{
        const media = await Media.find({
            "$text" :{
                "$search" : req.body.search
            }
        },{
            score:{
                $meta : "textScore"
            },
            title:1,
            description:1,
            genre:1,
            views:1,
            updated:1,
            createdDate:1,
            postedBy:1,
            postedByName:1,
        })
        .populate('postedBy' , "_id, name")
        .sort({
            score :{
                $meta : "textScore"
            }
        })
    
        return res.status(200).json(media)
    }
    catch{
        return res.status(404).json({
            error: "Failed to search"
        })
    }
    
}