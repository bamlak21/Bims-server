import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import listingRouter from "./routes/listing.route.js";
import notificationsRouter from "./routes/notifications.routes.js";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { swaggerOptions } from "./config/swaggerConfig.js";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { RegisterSocket } from "./Socket/socket.js";

dotenv.config({ quiet: true });
console.log("JWT_SECRET:", process.env.JWT_SECRET);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: "*",
  methods: ["GET", "POST"],
});
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json());

app.use(
  cors({
    origin: "*", // or '*', for all origins (not recommended for production)
    credentials: true,
  })
);

RegisterSocket(io);

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/listing", listingRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/uploads", express.static("uploads"));
async function StartServer() {
  try {
    await mongoose
      .connect(process.env.MONGO_URL)
      .then(() => console.log("MongoDB Connected!!"));

    server.listen(process.env.PORT, () => {
      console.log(`Server Running on port: ${process.env.PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
}

StartServer();
