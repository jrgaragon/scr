'use strict';
const mongoose = require('mongoose');


const imageSchema = mongoose.Schema({
    id: String,
    image: Buffer,
    imageName: String,
    url: String,
    created: {
        type: Date,
        default: Date.now
    },
    section: String,
    model: String,
    size: Number,
    gallery: String
});

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;
