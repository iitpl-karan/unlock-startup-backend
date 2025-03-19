const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const pagesSchema = new Schema(
  
  
  {
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  metatitle: {
    type: String,
    required: true,
  },
  metadescription: {
    type: String,
    required: true,
  },
  metaimage: {
    type: String,
  },
  status: {
    type: Number,
    default: 1,
  },
 
}, {timestamps : true}

);

module.exports = mongoose.model("Page", pagesSchema);
