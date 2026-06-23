import cors from "cors";
import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import { getAllDishes, getDishById, setDishPublished, toggleDishPublished } from "./db.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
    methods: ["GET", "PATCH"]
  }
});

const port = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

function emitDishUpdate(dish) {
  io.emit("dish:updated", dish);
  io.emit("dishes:changed", getAllDishes());
}

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, service: "DishOps API" });
});

app.get("/api/dishes", (_request, response) => {
  response.json(getAllDishes());
});

app.patch("/api/dishes/:dishId/toggle", (request, response) => {
  const dishId = Number(request.params.dishId);
  const updatedDish = toggleDishPublished(dishId);

  if (!updatedDish) {
    return response.status(404).json({ message: "Dish not found" });
  }

  emitDishUpdate(updatedDish);
  return response.json(updatedDish);
});

app.patch("/api/dishes/:dishId", (request, response) => {
  const dishId = Number(request.params.dishId);
  const { isPublished } = request.body;

  if (typeof isPublished !== "boolean") {
    return response.status(400).json({ message: "isPublished must be a boolean" });
  }

  if (!getDishById(dishId)) {
    return response.status(404).json({ message: "Dish not found" });
  }

  const updatedDish = setDishPublished(dishId, isPublished);
  emitDishUpdate(updatedDish);
  return response.json(updatedDish);
});

io.on("connection", (socket) => {
  socket.emit("dishes:changed", getAllDishes());
});

server.listen(port, "127.0.0.1", () => {
  console.log(`DishOps API listening at http://127.0.0.1:${port}`);
});
