"use strict";
const mongoose = require("mongoose");

const logSchema = mongoose.Schema({
  id: String,
  url: String,
  created: {
    type: Date,
    default: Date.now,
  },    
  fixed: Boolean,
  status: String  
});

const Log = mongoose.model("Log", logSchema);

module.exports = Log;