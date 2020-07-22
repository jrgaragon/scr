"use strict";
const mongoose = require("mongoose");

const gallerySchema = mongoose.Schema({
  id: String,
  url: String,
  created: {
    type: Date,
    default: Date.now,
  },
  section: String,
  model: String,
  gallery: String,
  fixed: Boolean,
  status: String,
});

const Gallery = mongoose.model("Gallery", gallerySchema);

module.exports = Gallery;
