// swaggerOptions.js
export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Bims api doc",
      version: "1.0.0",
      description: "API documentation for the app",
    },
    servers: [
      {
        url: "http://localhost:3000", // Update if using a different port or deployment URL
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Path to your API route files
};
