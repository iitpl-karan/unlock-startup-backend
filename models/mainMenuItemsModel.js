const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mainMenuSchema = new Schema({
  ID: {
    type: Number,
    required: true
  },
  menu_name: {
    type: String,
    required: true
  },
  menu_icon: {
    type: String
  },
  menu_url: {
    type: String,
    required: true
  },
  parent_id: {
    type: Number,
    required: true
  },
  sort_order: {
    type: Number,
  },
  status: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: String,
    default: Date.now()
  },
  updatedAt: {
    type: String,
    default: Date.now()
  }
});

module.exports = mongoose.model("MainMenuItem", mainMenuSchema);
