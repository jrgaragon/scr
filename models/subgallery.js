"use strict";
const mongoose = require("mongoose");

const subGallerySchema = mongoose.Schema({
  id: String,
  url: String,
  created: {
    type: Date,
    default: Date.now,
  },
  section: String,
  status: String,
  mainGallery: String,
  thumbnail: String,
});

const SubGallery = mongoose.model("subGallery", subGallerySchema);

module.exports = SubGallery;
