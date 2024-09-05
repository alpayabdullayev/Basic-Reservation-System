const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectToMongoDB = require("./src/db/connectToMongoDB");
const errorHandler = require("./src/middleware/errorHandler");
const router = require("./src/routes");
const cookieParser = require('cookie-parser');


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(router);

app.use(errorHandler);

const PORT = process.env.PORT;

app.listen(PORT, async () => {
  await connectToMongoDB();
  console.log(`Server Connected PORT :  ${PORT}`);
});
