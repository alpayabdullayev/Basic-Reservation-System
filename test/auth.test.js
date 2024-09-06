const request = require("supertest");
const index = require("../index"); // Uygulama dosyanızı buradan import edin

describe("Auth Controller", () => {
  describe("POST /auth/register", () => {
    it("should register a new user", async () => {
      const response = await request(index).post("/api/auth/register").send({
        username: "testuser",
        email: "testuser@example.com",
        password: "password123",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        "message",
        "User created successfully"
      );
    });

    it("should not register an existing user", async () => {
      await request(index).post("/api/auth/register").send({
        username: "testuser",
        email: "testuser@example.com",
        password: "password123",
      });

      const response = await request(index).post("/api/auth/register").send({
        username: "testuser",
        email: "testuser@example.com",
        password: "password123",
      });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("message", "User already exists");
    });
  });
});
