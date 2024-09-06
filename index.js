const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectToMongoDB = require("./src/db/connectToMongoDB");
const errorHandler = require("./src/middleware/errorHandler");
const router = require("./src/routes");
const cookieParser = require("cookie-parser");
const winston = require("winston");
const expressWinston = require("express-winston");
const logger = require("./src/utils/logger");
const { setupSwagger } = require("./src/config/swagger");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(
  expressWinston.logger({
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: "requests.log" }),
    ],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json()
    ),
    meta: true,
    msg: "HTTP {{req.method}} {{req.url}}",
    expressFormat: true,
    colorize: false,
    ignoreRoute: function (req, res) {
      return false;
    },
  })
);

app.use('/docs', express.static('path/to/swagger-ui'));

app.use(router);

app.use(errorHandler);
app.use(
  expressWinston.errorLogger({
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: "errors.log" }),
    ],
  })
);



const PORT = process.env.PORT;
setupSwagger(app);
app.listen(PORT, async () => {
  await connectToMongoDB();
  logger.info("Server is running");
  console.log(`Server Connected PORT :  ${PORT}`);
});
