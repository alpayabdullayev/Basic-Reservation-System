const venueModel = require("../model/venue.model");

const create = async (req, res, next) => {
  const currentUser = req.user;
  // !  console.log("currentUser", currentUser);

  try {
    const venueData = {
      ...req.body,
      createdBy: currentUser.userId,
    };

    const result = new venueModel(venueData);
    await result.save();
    logger.info(`Venue created by user ${currentUser.userId}`);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Error creating venue: ${error.message}`);
    next(error);
  }
};

const find = async (req, res, next) => {
  const { page = 1, limit = 10, location = "" } = req.query;

  try {
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    const query = {};
    if (location) {
      query.location = new RegExp(location, "i");
    }

    const totalCount = await venueModel.countDocuments(query);
    const venues = await venueModel
      .find(query)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    logger.info(`Venues fetched for page ${pageNumber} with limit ${pageSize}`);

    res.status(200).json({
      docs: venues,
      totalDocs: totalCount,
      limit: pageSize,
      page: pageNumber,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (error) {
    logger.error(`Error fetching venues: ${error.message}`);
    next(error);
  }
};

const update = async (req, res, next) => {
  const { id } = req.params;

  try {
    const venue = await venueModel.findById(id);

    if (!venue) {
      logger.warn(`Venue with id ${id} not found for update`);
      return res.status(404).json({ message: "Venue not found" });
    }

    const updatedVenue = await venueModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    logger.info(`Venue with id ${id} updated successfully`);
    res.status(200).json(updatedVenue);
  } catch (error) {
    logger.error(`Error updating venue: ${error.message}`);
    next(error);
  }
};

const findOne = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await venueModel.findById(id);

    if (!result) {
      logger.warn(`Venue with id ${id} not found`);
      return res.status(404).json({ message: "Venue not found" });
    }

    logger.info(`Venue with id ${id} found`);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Error fetching venue with id ${id}: ${error.message}`);
    next(error);
  }
};

const deleteVenue = async (req, res, next) => {
  const { id } = req.params;
  try {
    const venue = await venueModel.findByIdAndDelete(id);

    if (!venue) {
      logger.warn(`Venue with id ${id} not found for deletion`);
      return res.status(404).json({ message: "Venue not found" });
    }

    logger.info(`Venue with id ${id} deleted successfully`);
    res.status(200).json({ message: "Venue deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting venue: ${error.message}`);
    next(error);
  }
};

module.exports = { create, find, update, findOne, deleteVenue };
