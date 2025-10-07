import express from "express";
import pg from "pg";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const app = express();
const { Pool } = pg;

/* ----------------------------- DATABASE SETUP ----------------------------- */
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

app.use(express.json());

/* ------------------------------- ZOD SCHEMAS ------------------------------ */

// Schema for adding a player
const playerSchema = z.object({
  name: z.string().min(2, "Player name must be at least 2 characters"),
  join_date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
});

// Schema for updating player
const updatePlayerSchema = z.object({
  name: z.string().min(2).optional(),
  join_date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
    .optional(),
});

// Schema for validating route params (id)
const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number"),
});

/* ------------------------------- CRUD ROUTES ------------------------------ */

// ✅ Create Player
app.post("/add-player", async (req, res) => {
  const validation = playerSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.flatten() });
  }

  const { name, join_date } = validation.data;

  try {
    const result = await pool.query(
      "INSERT INTO players (name, join_date) VALUES ($1, $2) RETURNING *",
      [name, join_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ✅ Update Player
app.put("/update-player/:id", async (req, res) => {
  const paramValidation = idParamSchema.safeParse(req.params);
  if (!paramValidation.success) {
    return res.status(400).json({ error: paramValidation.error.flatten() });
  }

  const bodyValidation = updatePlayerSchema.safeParse(req.body);
  if (!bodyValidation.success) {
    return res.status(400).json({ error: bodyValidation.error.flatten() });
  }

  const { id } = paramValidation.data;
  const { name, join_date } = bodyValidation.data;

  try {
    const result = await pool.query(
      `
      UPDATE players 
      SET 
        name = COALESCE($1, name),
        join_date = COALESCE($2, join_date)
      WHERE id = $3
      RETURNING *;
      `,
      [name ?? null, join_date ?? null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ✅ Delete Player
app.delete("/delete-player/:id", async (req, res) => {
  const validation = idParamSchema.safeParse(req.params);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.flatten() });
  }

  const { id } = validation.data;

  try {
    const result = await pool.query("DELETE FROM players WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Player not found" });
    }
    res.json({ message: `Player with ID ${id} deleted successfully.` });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// --------------------- GAMES CRUD ---------------------

// GET all games
app.get("/games", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM games ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET game by id
app.get("/games/:id", async (req, res) => {
  const validation = idParamSchema.safeParse(req.params);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.flatten() });
  }
  const { id } = validation.data;
  try {
    const result = await pool.query("SELECT * FROM games WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Game not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new game
app.post("/games", async (req, res) => {
  const gameSchema = z.object({
    title: z.string().min(1),
    genre: z.string().min(1),
  });

  const validation = gameSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.flatten() });
  }

  const { title, genre } = validation.data;

  try {
    const result = await pool.query(
      "INSERT INTO games (title, genre) VALUES ($1, $2) RETURNING *",
      [title, genre]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update game
app.put("/games/:id", async (req, res) => {
  const paramValidation = idParamSchema.safeParse(req.params);
  if (!paramValidation.success) {
    return res.status(400).json({ error: paramValidation.error.flatten() });
  }

  const gameUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    genre: z.string().min(1).optional(),
  });

  const bodyValidation = gameUpdateSchema.safeParse(req.body);
  if (!bodyValidation.success) {
    return res.status(400).json({ error: bodyValidation.error.flatten() });
  }

  const { id } = paramValidation.data;
  const { title, genre } = bodyValidation.data;

  try {
    const result = await pool.query(
      `
      UPDATE games
      SET
        title = COALESCE($1, title),
        genre = COALESCE($2, genre)
      WHERE id = $3
      RETURNING *;
      `,
      [title ?? null, genre ?? null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Game not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE game
app.delete("/games/:id", async (req, res) => {
  const validation = idParamSchema.safeParse(req.params);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.flatten() });
  }

  const { id } = validation.data;

  try {
    const result = await pool.query("DELETE FROM games WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Game not found" });
    }
    res.json({ message: `Game with ID ${id} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------- SCORES CRUD ---------------------

// Zod schema for score
const scoreSchema = z.object({
  player_id: z.number(),
  game_id: z.number(),
  score: z.number().nonnegative(),
  date_played: z.string().refine((val) => !isNaN(Date.parse(val))),
});

const updateScoreSchema = z.object({
  player_id: z.number().optional(),
  game_id: z.number().optional(),
  score: z.number().nonnegative().optional(),
  date_played: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
});

// GET all scores
app.get("/scores", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM scores ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET score by id
app.get("/scores/:id", async (req, res) => {
  const validation = idParamSchema.safeParse(req.params);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.flatten() });
  }

  const { id } = validation.data;
  try {
    const result = await pool.query("SELECT * FROM scores WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Score not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new score
app.post("/scores", async (req, res) => {
  const validation = scoreSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.flatten() });
  }

  const { player_id, game_id, score, date_played } = validation.data;

  try {
    const result = await pool.query(
      "INSERT INTO scores (player_id, game_id, score, date_played) VALUES ($1, $2, $3, $4) RETURNING *",
      [player_id, game_id, score, date_played]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update score
app.put("/scores/:id", async (req, res) => {
  const paramValidation = idParamSchema.safeParse(req.params);
  if (!paramValidation.success) {
    return res.status(400).json({ error: paramValidation.error.flatten() });
  }

  const bodyValidation = updateScoreSchema.safeParse(req.body);
  if (!bodyValidation.success) {
    return res.status(400).json({ error: bodyValidation.error.flatten() });
  }

  const { id } = paramValidation.data;
  const { player_id, game_id, score, date_played } = bodyValidation.data;

  try {
    const result = await pool.query(
      `
      UPDATE scores
      SET
        player_id = COALESCE($1, player_id),
        game_id = COALESCE($2, game_id),
        score = COALESCE($3, score),
        date_played = COALESCE($4, date_played)
      WHERE id = $5
      RETURNING *;
      `,
      [player_id ?? null, game_id ?? null, score ?? null, date_played ?? null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Score not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE score
app.delete("/scores/:id", async (req, res) => {
  const validation = idParamSchema.safeParse(req.params);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.flatten() });
  }

  const { id } = validation.data;

  try {
    const result = await pool.query("DELETE FROM scores WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Score not found" });
    }
    res.json({ message: `Score with ID ${id} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ------------------------------- SERVER START ------------------------------ */
app.listen(5500, () => {
  console.log("🚀 Server running on http://localhost:5500");
});
