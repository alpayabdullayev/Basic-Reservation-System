const Joi = require("joi");

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(20).required(),
  password: Joi.string()
    .pattern(new RegExp("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{8,30}$"))
    .required()
    .messages({
      "string.pattern.base":
        "Password must be at least 8 characters long and include at least one letter and one number.",
    }),
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address.",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address.",
  }),
  password: Joi.string()
    .pattern(new RegExp("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{8,30}$"))
    .required()
    .messages({
      "string.pattern.base":
        "Password must be at least 8 characters long and include at least one letter and one number.",
    }),
});

const resetPasswordSchema = Joi.object({
  newPassword: Joi.string()
    .pattern(new RegExp("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{8,30}$"))
    .required()
    .messages({
      "string.pattern.base":
        "Password must be at least 8 characters long and include at least one letter and one number.",
    }),
});

module.exports = {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
};
