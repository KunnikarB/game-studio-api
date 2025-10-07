import express from "express";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});



app.use(express.json());

// ✅ List All Players and Their Scores
app.get("/players-scores", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
      players.name,
      games.title,
      scores.score
      FROM players
      INNER JOIN scores ON players.id = scores.player_id
      INNER JOIN games ON scores.game_id = games.id
      ORDER BY players.name, games.title;`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ✅ Find Top 3 High Scorers
app.get("/top-players", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
      players.name,
      SUM(scores.score) AS total_score
      FROM players
      INNER JOIN scores ON players.id = scores.player_id
      GROUP BY players.name
      ORDER BY total_score DESC
      LIMIT 3;`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// ✅ Players Who Didn't Play Any Games
app.get("/inactive-players", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
      players.name
      FROM players
      LEFT JOIN scores ON players.id = scores.player_id
      WHERE scores.id IS NULL;`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ✅ Find Most Popular Game Genre
app.get("/popular-genres", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
      games.genre,
      COUNT(scores.id) AS times_played
      FROM games
      INNER JOIN scores ON games.id = scores.game_id
      GROUP BY games.genre
      ORDER BY times_played DESC
      LIMIT 1;`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ✅ Recently Joined Players (Last 30 Days)
app.get("/recent-players", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
      players.name,
      players.join_date
      FROM players
      WHERE players.join_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY players.join_date DESC;`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(5500, () => {
  console.log("🚀 Server is running on port 5500");
});
