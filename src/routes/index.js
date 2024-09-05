const express = require("express");
const v1Router = require("./v1");


const router = express.Router();

router.use("/api", v1Router);

module.exports = router;
