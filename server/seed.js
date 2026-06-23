import { resetDatabase } from "./db.js";

const dishes = resetDatabase();

console.log(`Seeded ${dishes.length} dishes into the persistent dish database.`);
