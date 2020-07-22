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
    status: String 
});

const MainGallery = mongoose.model('MainGallery', mainGallerySchema);

module.exports = MainGallery;
