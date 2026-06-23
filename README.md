# DishOps Dashboard

A full-stack dish management dashboard built for the assignment. It includes a persistent file-backed dish database, Express API, React dashboard, and real-time updates through Socket.IO.

## Features

- Seeded `dishes` database with `dishId`, `dishName`, `imageUrl`, and `isPublished`
- REST API to list dishes and toggle publish status
- Professional responsive React dashboard
- Optimistic UI updates with backend persistence
- Live updates when dish status changes from any backend/API client

## Run Locally

```bash
npm install
npm run seed
npm run dev
```

Open `http://127.0.0.1:5173`.

## API

- `GET /api/dishes` returns all dishes
- `PATCH /api/dishes/:dishId/toggle` toggles one dish
- `PATCH /api/dishes/:dishId` updates `isPublished` directly

Example backend-only change that updates every open dashboard in real time:

```bash
curl -X PATCH http://127.0.0.1:4000/api/dishes/1 -H "Content-Type: application/json" -d "{\"isPublished\":false}"
```

## Project Structure

```text
server/
  data/dishes.json
  data/schema.sql
  db.js
  index.js
  seed.js
src/
  App.jsx
  main.jsx
  styles.css
```
