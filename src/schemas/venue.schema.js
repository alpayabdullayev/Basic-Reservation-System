const mongoose = require("mongoose");
const slugify = require('slugify');

const venueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    capacity: { type: Number, required: true },
    description: { type: String, required: true },
    slug: { type: String, unique: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
  },
  { timestamps: true }
);

venueSchema.pre("save", function (next) {
  if (this.isModified("name") || this.isNew) {
    this.slug = slugify(this.name, {
      lower: true,   
      strict: true,  
    });
  }
  next();
});

module.exports = venueSchema;