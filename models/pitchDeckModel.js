const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PitchDeckSchema = new Schema({
  pitchDeckName: { type: String, required: true },
  slug: { type: String, required: true },
  price: { type: Number, required: true },

  pitchDeckDetails: { type: String, required: true },
  attachments: { type: Array, required: true }, // Multiple attachments; available if payment is done
  thumbnailImage : { type: String, required: true },
  coverImage : { type: Array, required: true },

  category: { type: Schema.Types.ObjectId, required: true, ref: 'pitchcategories' },

  paymentStatus: { type: String, default: 0 }, // 0 => unpaid, 1 => paid
  status: { type: Number, default: 0 }, // 0 => pending, 1 => pending for approval, 4 => Approved, 5 => Rejected
  pitchDeckDate: { type: Date, required: true },
  createdAt: { type: Date},
  updatedAt: { type: Date},

  isDeleted: { type: Boolean, default: false }



});

module.exports = mongoose.model("PitchDeck", PitchDeckSchema);