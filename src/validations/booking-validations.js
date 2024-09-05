const Joi = require("joi");

const bookingSchema = Joi.object({
  venueId: Joi.string().required(),
  date: Joi.date().required(),
  time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid time format, must be in 'HH:mm' format.",
    }),
  numberOfPeople: Joi.number().integer().required(),
  status: Joi.string()
    .valid("pending", "approved", "rejected")
    .default("pending"),
});

module.exports = { bookingSchema };
