const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const ObjectId = Schema.Types.ObjectId;

// Custom schema type to store either ObjectId or string
const ObjectIdOrString = {
  type: Schema.Types.Mixed,
  validate: {
    validator: function (value) {
      // Check if the value is either an ObjectId or a string
      return (
        mongoose.Types.ObjectId.isValid(value) || typeof value === "string"
      );
    },
    message: "Value must be either ObjectId or string",
  },
};

const StartupChallengesSchema = new Schema({
  challengeName: { type: String, required: true },
  challengeDetails: { type: String, required: true },
  thumbnailImage: { type: String, required: true },
  bannerImage: { type: String },
  category: { type: Schema.Types.ObjectId, required: true, ref: 'categories' },
  location: { type: String, },
  slug: { type: String, required: true },
  postedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  pincode: { type: String, required: true },
  state: { type: Schema.Types.ObjectId, required: true, ref: 'State' },
  city: { type: Schema.Types.ObjectId, required: true, ref: 'City' },
  address: { type: String, required: true },
  registrationStartDate: { type: Date, required: true },
  registrationEndDate: { type: Date, required: true },
  resultDate: { type: Date, required: true },
  registrationlink: { type: String, },
  challengeId: { type: String, required: true },
  // prizeAmount: { type: Schema.Types.Decimal128, required: true },
  charges: { type: String, default: 'free' },

  type: { type: String, required: true }, // "premium" or "normal"
  registrationFee: { type: String, default: 'free' }, // If type is "premium"
  paymentStatus: { type: Number, default: 0 }, // 0 => unpaid, 1 => paid
  status: { type: Number, default: 0 }, // 0 => pending, 1 => pending for approval, 2 => Approved, 3 => Rejected
  whoCanParticipate: { type: Array, required: true },
  organizername: { type: String, required: true },
  guidelines: { type: String, required: true },
  organizernumber: { type: String, required: true },
  organizeremail: { type: String, required: true },
  organizerwebsite: { type: String, required: true },
  attachments: { type: Array, }, // Multiple attachments; available if payment is done
  expireDate: { type: Date },
  video_url1: { type: String, },
  video_url2: { type: String, },
  resultdescription: { type: String },
  resultattachment: { type: String, },
  resultstatus: { type: Number, default: 0 },
  resultDate: { type: String, },
  currentResultdate: { type: String, },

  isDeleted: { type: Boolean, default: false },

  isDeletedAdmin: { type: Boolean, default: false }



}, { timestamps: true });

const StartupChallenge = mongoose.model("StartupChallenge", StartupChallengesSchema)
module.exports = StartupChallenge
