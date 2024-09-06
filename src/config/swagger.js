const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   security:
 *     - BearerAuth: []
 */


const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Reservation System',
    version: '1.0.0',
    description: 'API docs',
  },
  servers: [
    {
      url: `/api`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
};


const options = {
  swaggerDefinition,
    apis: ['./src/routes/v1/*.js', './src/controller/*.js'], 
};


const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  console.log('Swagger Spec:', swaggerSpec); 
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

console.log('Swagger Spec:', swaggerSpec); 


module.exports = {
  setupSwagger,
  swaggerSpec
};