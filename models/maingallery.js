'use strict';
const mongoose = require('mongoose');

const mainGallerySchema = mongoose.Schema({
    id: String,     
    url: String,
    created: {
        type: Date,
        default: Date.now
    },
    section: String,
    status: String ,
    rating: {
       type: Number,
       default: 1
    },
    thumbnail: String
});

const MainGallery = mongoose.model('MainGallery', mainGallerySchema);

module.exports = MainGallery;
