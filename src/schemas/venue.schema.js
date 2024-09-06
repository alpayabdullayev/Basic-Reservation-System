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

  venueSchema.pre('save', async function (next) {
    if (this.isModified('name') || this.isNew) {
      let slug = slugify(this.name, {
        lower: true,
        strict: true,
      });
  

      let existingVenue = await this.constructor.findOne({ slug });
      let counter = 1;
  
      while (existingVenue) {

        slug = `${slugify(this.name, { lower: true, strict: true })}-${counter}`;
        existingVenue = await this.constructor.findOne({ slug });
        counter++;
      }
  
      this.slug = slug;
    }
    next();
  });

  module.exports = venueSchema;