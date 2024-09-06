const venueModel = require("../model/venue.model");
const redisClient = require("../redis/redis-client");
const logger = require("../utils/logger");

/**
 * @swagger
 * tags:
 *   - name: Venue
 *     description: Operations related to venue management
 */

/**
 * @swagger
 * /venues:
 *   post:
 *     tags:
 *       - Venue
 *     summary: Create a new venue
 *     description: Creates a new venue using the provided data. Requires admin role.
 *     security:
 *       - bearerAuth: []  # Assuming JWT Bearer authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Sample Venue"
 *               location:
 *                 type: string
 *                 example: "123 Main Street"
 *               capacity:
 *                 type: integer
 *                 example: 150
 *               description:
 *                 type: string
 *                 example: "A great venue for events."
 *     responses:
 *       200:
 *         description: Venue created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "64e72c4d7b5d9f1cdb123456"
 *                 name:
 *                   type: string
 *                   example: "Sample Venue"
 *                 location:
 *                   type: string
 *                   example: "123 Main Street"
 *                 capacity:
 *                   type: integer
 *                   example: 150
 *                 description:
 *                   type: string
 *                   example: "A great venue for events."
 *                 createdBy:
 *                   type: string
 *                   example: "1234567890"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-09-05T15:00:00Z"
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */

const create = async (req, res, next) => {
  const currentUser = req.user;

  try {
    const venueData = {
      ...req.body,
      createdBy: currentUser.userId,
    };

    const result = new venueModel(venueData);
    await result.save();

    await redisClient.del('venues:*'); 

    // Loglama
    logger.info(`Venue created by user ${currentUser.userId} and cache cleared`);

    res.status(200).json(result);
  } catch (error) {
    logger.error(`Error creating venue: ${error.message}`);
    next(error);
  }
};



/**
 * @swagger
 * /venues:
 *   get:
 *     tags:
 *       - Venue
 *     summary: Get a list of venues
 *     description: Fetches a paginated list of venues. Optionally filters by location.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number to retrieve
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of venues per page
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *           example: "New York"
 *         description: Filter venues by location (case-insensitive)
 *     responses:
 *       200:
 *         description: List of venues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 docs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64e72c4d7b5d9f1cdb123456"
 *                       name:
 *                         type: string
 *                         example: "Sample Venue"
 *                       location:
 *                         type: string
 *                         example: "123 Main Street"
 *                       capacity:
 *                         type: integer
 *                         example: 150
 *                       description:
 *                         type: string
 *                         example: "A great venue for events."
 *                       createdBy:
 *                         type: string
 *                         example: "1234567890"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2023-09-05T15:00:00Z"
 *                 totalDocs:
 *                   type: integer
 *                   example: 100
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 10
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error fetching venues"
 */

const find = async (req, res, next) => {
  const { page = 1, limit = 10, location = "" } = req.query;


  const cacheKey = `venues:${page}:${limit}:${location}`;

  try {

    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      logger.info(`Venues fetched from cache with key ${cacheKey}`);
      console.log("Cache", JSON.parse(cachedData)); 
      return res.status(200).json(JSON.parse(cachedData));
    }

   
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

    const responseData = {
      docs: venues,
      totalDocs: totalCount,
      limit: pageSize,
      page: pageNumber,
      totalPages: Math.ceil(totalCount / pageSize),
    };


    logger.info(`Venues fetched from MongoDB for key ${cacheKey}`);
    console.log("MongoDB", responseData); 

    
    await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 36000 });

    res.status(200).json(responseData);
  } catch (error) {
    logger.error(`Error fetching venues: ${error.message}`);
    next(error);
  }
};
/**
 * @swagger
 * /venues/{id}:
 *   put:
 *     tags:
 *       - Venue
 *     summary: Update a venue
 *     description: Updates the details of an existing venue by its ID. Requires admin role.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the venue to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Venue Name"
 *                 description: Name of the venue (min 3, max 20 characters)
 *               location:
 *                 type: string
 *                 example: "Updated Location"
 *                 description: New location of the venue
 *               capacity:
 *                 type: integer
 *                 example: 200
 *                 description: Capacity of the venue (must be at least 1)
 *               description:
 *                 type: string
 *                 example: "Updated description of the venue"
 *                 description: Detailed description of the venue (min 10, max 500 characters)
 *     responses:
 *       200:
 *         description: Venue updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "64e72c4d7b5d9f1cdb123456"
 *                 name:
 *                   type: string
 *                   example: "Updated Venue Name"
 *                 location:
 *                   type: string
 *                   example: "Updated Location"
 *                 capacity:
 *                   type: integer
 *                   example: 200
 *                 description:
 *                   type: string
 *                   example: "Updated description of the venue"
 *                 createdBy:
 *                   type: string
 *                   example: "1234567890"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-09-05T15:00:00Z"
 *       404:
 *         description: Venue not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Venue not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error updating venue"
 */

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

    await redisClient.del('venues:*'); 

    logger.info(`Venue with id ${id} updated successfully and cache cleared`);
    res.status(200).json(updatedVenue);
  } catch (error) {
    logger.error(`Error updating venue: ${error.message}`);
    next(error);
  }
};

/**
 * @swagger
 * /venues/{id}:
 *   get:
 *     tags:
 *       - Venue
 *     summary: Get a specific venue by ID
 *     description: Fetches a venue's details using the venue's ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the venue to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "64e72c4d7b5d9f1cdb123456"
 *                 name:
 *                   type: string
 *                   example: "Sample Venue"
 *                 location:
 *                   type: string
 *                   example: "123 Main Street"
 *                 capacity:
 *                   type: integer
 *                   example: 150
 *                 description:
 *                   type: string
 *                   example: "A great venue for events."
 *                 createdBy:
 *                   type: string
 *                   example: "1234567890"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-09-05T15:00:00Z"
 *       404:
 *         description: Venue not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Venue not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error fetching venue"
 */

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

/**
 * @swagger
 * /venues/{id}:
 *   delete:
 *     tags:
 *       - Venue
 *     summary: Delete a venue by ID
 *     description: Deletes a venue using the venue's ID. Requires admin role.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the venue to delete.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Venue deleted successfully"
 *       404:
 *         description: Venue not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Venue not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error deleting venue"
 */

const deleteVenue = async (req, res, next) => {
  const { id } = req.params;
  try {
    const venue = await venueModel.findByIdAndDelete(id);

    if (!venue) {
      logger.warn(`Venue with id ${id} not found for deletion`);
      return res.status(404).json({ message: "Venue not found" });
    }

    await redisClient.del('venues:*');

    logger.info(`Venue with id ${id} deleted successfully and cache cleared`);
    res.status(200).json({ message: "Venue deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting venue: ${error.message}`);
    next(error);
  }
};

module.exports = { create, find, update, findOne, deleteVenue };
