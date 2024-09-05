const Joi = require("joi");

const venueSchema = Joi.object({
    name: Joi.string().min(3).max(20).required(),
    location: Joi.string().required(),
    capacity: Joi.number().min(1).required(),
    description: Joi.string().min(10).max(500).required(),
});

const updateVenue = Joi.object({
    name: Joi.string().min(3).max(20),
    location: Joi.string(),
    capacity: Joi.number().min(1),
    description: Joi.string().min(10).max(500),
});

module.exports = {venueSchema,updateVenue};
