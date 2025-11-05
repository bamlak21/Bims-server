import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import adminRouter from "./routes/admin.routes.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import listingRouter from "./routes/listing.route.js";
import notificationsRouter from "./routes/notifications.routes.js";
import commissionsRouter from "./routes/commissions.routes.js";
import dealsRouter from "./routes/deals.routes.js";
import reportRoute from "./routes/report.routes.js";
import chatRoute from "./routes/chat.routes.js";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { swaggerOptions } from "./config/swaggerConfig.js";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { RegisterSocket } from "./Socket/socket.js";
import { incrementRequest } from "./utils/metric.js";

dotenv.config({ quiet: true });
console.log("JWT_SECRET:", process.env.JWT_SECRET);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: "http://localhost:5173",
  methods: ["GET", "POST"],
});
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "*", // or '*', for all origins (not recommended for production)
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.on("finish", () => {
    if (req.originalUrl !== "/api/admin/system-health") {
      incrementRequest(res.statusCode);
    }
  });
  next();
});


RegisterSocket(io);

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);
app.use("/api/listing", listingRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/commissions", commissionsRouter);
app.use("/api/deals", dealsRouter);
app.use("/api/report", reportRoute);
app.use("/api/chat", chatRoute);
app.use("/uploads", express.static("uploads"));
app.get("/", (req, res) => {
  res.send("Server is running!");
});

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
