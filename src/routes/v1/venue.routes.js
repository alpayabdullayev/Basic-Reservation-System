const express = require("express");

const {
  create,
  find,
  update,
  findOne,
  deleteVenue,
} = require("../../controller/venue.controller");
const authenticate = require("../../middleware/authenticate");
const checkRole = require("../../middleware/checkRole");
const validateRequest = require("../../middleware/validateRequest");
const {
  venueSchema,
  updateVenue,
} = require("../../validations/venue-validations");

const VenueRouter = express.Router();

VenueRouter.post(
  "/",
  validateRequest(venueSchema),
  authenticate,
  checkRole("admin"),
  create
);
VenueRouter.put(
  "/:id",
  validateRequest(updateVenue),
  authenticate,
  checkRole("admin"),
  update
);
VenueRouter.get("/", find);
VenueRouter.get("/:id", findOne);
VenueRouter.delete("/:id", authenticate, checkRole("admin"), deleteVenue);

module.exports = VenueRouter;
