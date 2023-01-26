const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MediaSchema = new Schema({
    title:{
        type: String,
        required: [true, 'Title is required']
    },
    description:{
        type: String,
        required: true
    },
    genre:{
        type: String,
        required: true
    },
    views:{
        type: Number,
        default:0
    },
    updated:{
        type: Date,
        default: Date.now
    },
    createdDate:{
        type: Date,
        default: Date.now
    },
    postedBy:{
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    postedByName:{
        type: String,
        required: true
    }
});

MediaSchema.index({'$**': 'text'});

const Media = mongoose.model('Media' , MediaSchema);
module.exports = Media;