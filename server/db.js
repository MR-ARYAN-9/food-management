import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");
const storePath = path.join(dataDir, "dishes-store.json");
const seedPath = path.join(dataDir, "dishes.json");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function readSeedDishes() {
  return JSON.parse(fs.readFileSync(seedPath, "utf8")).map((dish) => ({
    ...dish,
    updatedAt: new Date().toISOString()
  }));
}

function ensureStore() {
  if (!fs.existsSync(storePath)) {
    writeStore(readSeedDishes());
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(storePath, "utf8"));
}

function writeStore(dishes) {
  fs.writeFileSync(storePath, `${JSON.stringify(dishes, null, 2)}\n`);
}

function normalizeDish(row) {
  return {
    dishId: Number(row.dishId),
    dishName: String(row.dishName),
    imageUrl: String(row.imageUrl),
    isPublished: Boolean(row.isPublished),
    updatedAt: row.updatedAt
  };
}

export function resetDatabase() {
  writeStore(readSeedDishes());
  return getAllDishes();
}

export function getAllDishes() {
  return readStore()
    .map(normalizeDish)
    .sort((firstDish, secondDish) => firstDish.dishId - secondDish.dishId);
}

export function getDishById(dishId) {
  return getAllDishes().find((dish) => dish.dishId === Number(dishId)) ?? null;
}

export function setDishPublished(dishId, isPublished) {
  const targetDishId = Number(dishId);
  const dishes = getAllDishes();
  const dishIndex = dishes.findIndex((dish) => dish.dishId === targetDishId);

  if (dishIndex === -1) {
    return null;
  }

  dishes[dishIndex] = {
    ...dishes[dishIndex],
    isPublished,
    updatedAt: new Date().toISOString()
  };

  writeStore(dishes);
  return dishes[dishIndex];
}

export function toggleDishPublished(dishId) {
  const dish = getDishById(dishId);

  if (!dish) {
    return null;
  }

  return setDishPublished(dishId, !dish.isPublished);
}
