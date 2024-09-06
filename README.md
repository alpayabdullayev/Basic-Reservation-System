# Reservation System API documentation

## Table of Contents

- [Title](#title)
- [Description](#description)
- [Installation](#installation)
- [Usage](#usage)

## Description

This repository contains the source code for a Reservation System API. It has dedicated routes for managing venues, users, and authentication using JWT. Users can authenticate, browse available venues, and make reservations. The API handles all types of HTTP requests and performs CRUD operations on the database asynchronously, responding with JSON and the relevant status codes.

## Installation

Reservation system project using Node.js, Express, and MongoDB. VS Code's integrated terminal serves as a good CLI to run the necessary commands and manage the project."

    1. Clone the project
    2. You need rename the file '.env.EXAMPLE' to simply '.env'.
    3. Add your MongoDB URI to the CONNECTION_URL section in the .env file.
    4. npm install
    5. npm run start
    6. Finally we are ready to begin, so enter 'npm run start'

## Usage

Link to project: https://github.com/alpayabdullayev/Basic-ReservationSystem

Once you've entered 'npm run start' and see a message stating that the server is listening, you're ready to test the API. The easiest way to do this is by using Insomnia or Postman. For this demonstration, I'll be using Insomnia, which allows easy toggling between request types and collections. The API provides routes for venues, users, and JWT-based authentication, enabling users to make reservations. All requests and responses are in JSON format. When you're done running the server, use 'Ctrl + C' to stop it. Below is a brief overview of the routes and what the API expects and returns.

### /api/auth

## Auth Routes

| Method | Path                  | Purpose                                            |
| ------ | --------------------- | -------------------------------------------------- |
| POST   | /auth/register        | Register a new user                                |
| POST   | /auth/login           | Login a user and return JWT                        |
| GET    | /auth/verify-email    | Verify user's email after registration             |
| POST   | /auth/forgot-password | Send password reset instructions to user's email   |
| POST   | /auth/reset-password  | Reset the user's password using the token provided |
| POST   | /auth/logout          | Logout the user and invalidate the current session |

POST request creates a new user with the request body:

    {
        "username" : "example",
        "email" : "example@gmail.com",
        "password" : "examplesecure"
    }

### /api/auth/login

    {
        "email" : "example@gmail.com",
        "password" : "examplesecure"
    }

### /api/venues

## Venue Routes

| Method | Path | Purpose                            |
| ------ | ---- | ---------------------------------- |
| POST   | /    | Create a new venue                 |
| PUT    | /:id | Update details of a specific venue |
| GET    | /    | Get a list of all venues           |
| GET    | /:id | Get details about a specific venue |
| DELETE | /:id | Delete a specific venue            |

GET request returns all venues

POST request creates a new venues with the request body:

    {
    "name" : "example",
    "location" : "example",
    "capacity" : 100,
    "description" : "example"
    }

### /api/venues/:id

GET request returns the one venue by its id

PUT request updates a venue by its id with a new name with the request body:

        {
            "name" : "Update example",
            "location" : "Update example",
            "capacity" : 100,
            "description" : "Update example"
        }

DELETE request will delete a venue with that id

### /api/reservations

## Booking Routes

| Method | Path       | Purpose                                  
| ------ | ---------- | ----------------------------------------         | 
| POST   | /          | Create a new reservations                        | 
| GET    | /          | Get all reservationss for the authenticated user |
| DELETE | /:id       | Delete a specific reservations                   |

GET request returns all reservations

POST request creates a new reservations with the request body:

    {
        "venueId" : "venue_id",
        "date" : "2023-09-01",
        "time" : "18:00",
        "numberOfPeople" : 4
    }   


## Docker and Redis Setup

## Prerequisites

- [Docker](#docker)
- [Docker Compose](#dockerCompose)

This project is Dockerized and includes Redis for session management and caching. To run the application in a containerized environment with Redis support, follow the steps below:

    1. Ensure Docker and Docker Compose are installed on your system.
    2. Build and start the application with Docker: => docker-compose up --build
    3. To stop the application, run => docker-compose down
    4. npm install
    5. npm run start
    6. Finally we are ready to begin, so enter 'npm run start'


## Docker Compose File

Here's a summary of the services defined in the docker-compose.yml file:

version: '3.8'

services:
  app:
    container_name: express-app
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=development
      - CONNECTION_URL=${CONNECTION_URL}
      - REDIS_URL=redis://redis-server:6379
      - ACCESS_SECRET_TOKEN=${ACCESS_SECRET_TOKEN}
      - REFRESH_SECRET_TOKEN=${REFRESH_SECRET_TOKEN}
      - RESET_PASSWORD_SECRET=${RESET_PASSWORD_SECRET}
      - EMAIL=${EMAIL}
      - PASS=${PASS}
      - CLIENT_URL=${CLIENT_URL}
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - redis

  redis:
    image: "redis:alpine"
    container_name: redis-server
    ports:
      - "6379:6379"

networks:
  app-network:
    driver: bridge