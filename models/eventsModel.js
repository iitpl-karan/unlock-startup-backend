const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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

const EventsSchema = new Schema({
  eventName: { type: String, required: true },
  // postedBy: ObjectIdOrString, // Custom schema type for postedBy field
  postedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  slug: { type: String, required: true },
  eventDetails: { type: String, required: true },
  video_url1: { type: String, },
  video_url2: { type: String, },
  reference_url: { type: String, default: "" },
  thumbnailImage: { type: String, required: true },
  coverImage: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, required: true, ref: 'categories' },
  eventType: { type: [Schema.Types.ObjectId], required: true, ref: 'eventype' },
  registerationfee: { type: String, default: "Free" },
  guidelines: { type: String },
  charges: { type: String, default: 'free' },
  state: { type: Schema.Types.ObjectId, required: true, ref: 'State' },
  city: { type: Schema.Types.ObjectId, required: true, ref: 'City' },
  organizernumber: { type: String, required: true },
  organizeremail: { type: String, required: true },
  organizerwebsite: { type: String, required: true },
  organizername: { type: String, required: true },
  // address: { type: String, required: true },
  pincode: { type: String, required: true },
  document1: { type: String }, // Field for the first PDF
  document2: { type: String },
  startime: { type: String },
  endtime: { type: String },
  eventId: { type: String, required: true },
  // time: { type: String, required: true },  
  registrationEndDate: { type: String, required: true },
  registrationStartDate: { type: String, required: true },
  eventDate: { type: Date, required: true },
  eventMode: { type: String, required: true }, // "online" or "offline"
  eventAddress: { type: String, default: 'Null' },
  whoCanParticipate: { type: Array, required: true },
  expireDate: { type: Date },

  // whoCanParticipate: { type: String, required: true },
  status: { type: Number, default: 0 }, // 0 => pending, 1 => pending for approval, 2 => Approved, 3 => Rejected
  paymentStatus: { type: Number, default: 0 }, // 0 => unpaid, 1 => paid
  isDeleted: { type: Boolean, default: false },
  isDeletedAdmin: { type: Boolean, default: false }


}, { timestamps: true });
// },);


module.exports = mongoose.model("Event", EventsSchema);