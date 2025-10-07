import express from "express";
import pg from "pg";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const app = express();
const { Pool } = pg;

// ✅ 1. Validate environment variables with Zod
const envSchema = z.object({
  DB_USER: z.string().min(1, "DB_USER is required"),
  DB_HOST: z.string().min(1, "DB_HOST is required"),
  DB_DATABASE: z.string().min(1, "DB_DATABASE is required"),
  DB_PASSWORD: z.string().min(1, "DB_PASSWORD is required"),
  DB_PORT: z
    .string()
    .regex(/^\d+$/, "DB_PORT must be a valid number")
    .transform((val) => parseInt(val, 10)),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment configuration:", parsedEnv.error.format());
  process.exit(1);
}

const env = parsedEnv.data;

// ✅ 2. Initialize PostgreSQL connection
const pool = new Pool({
  user: env.DB_USER,
  host: env.DB_HOST,
  database: env.DB_DATABASE,
  password: env.DB_PASSWORD,
  port: env.DB_PORT,
});

app.use(express.json());

// ✅ Example (Optional): validate query params
// e.g. /players-scores?limit=10
const querySchema = z.object({
  limit: z
    .string()
    .regex(/^\d+$/, "Limit must be a number")
    .transform((val) => parseInt(val, 10))
    .optional(),
});

// ✅ List All Players and Their Scores
app.get("/players-scores", async (req, res) => {
  try {
    const queryValidation = querySchema.safeParse(req.query);
    if (!queryValidation.success) {
      return res.status(400).json({ error: queryValidation.error.flatten() });
    }

    const { limit } = queryValidation.data;
    const sql = `
      SELECT 
        players.name,
        games.title,
        scores.score
      FROM players
      INNER JOIN scores ON players.id = scores.player_id
      INNER JOIN games ON scores.game_id = games.id
      ORDER BY players.name, games.title
      ${limit ? `LIMIT ${limit}` : ""};
    `;
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ✅ Find Top 3 High Scorers
app.get("/top-players", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        players.name,
        SUM(scores.score) AS total_score
      FROM players
      INNER JOIN scores ON players.id = scores.player_id
      GROUP BY players.name
      ORDER BY total_score DESC
      LIMIT 3;
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ✅ Players Who Didn't Play Any Games
app.get("/inactive-players", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        players.name
      FROM players
      LEFT JOIN scores ON players.id = scores.player_id
      WHERE scores.id IS NULL;
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ✅ Find Most Popular Game Genre
app.get("/popular-genres", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        games.genre,
        COUNT(scores.id) AS times_played
      FROM games
      INNER JOIN scores ON games.id = scores.game_id
      GROUP BY games.genre
      ORDER BY times_played DESC
      LIMIT 1;
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ✅ Recently Joined Players (Last 30 Days)
app.get("/recent-players", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        players.name,
        players.join_date
      FROM players
      WHERE players.join_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY players.join_date DESC;
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(5500, () => {
  console.log("🚀 Server is running on port 5500");
});
