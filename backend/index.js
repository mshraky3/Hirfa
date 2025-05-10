import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
const { Pool } = pg;
import fileUpload from "express-fileupload";
import dotenv from "dotenv";
import cors from "cors";
import sharp from "sharp";
import compression from "compression";
import { createClient } from "redis";

dotenv.config();

const app = express();
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());
app.use(compression());

const db = new Pool({
  user: process.env.user,
  host: process.env.host,
  database: process.env.db,
  password: process.env.password,
  port: 5432,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const redisClient = createClient();
await redisClient.connect();

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query("SELECT id, password FROM account WHERE username = $1", [email]);
    if (result.rows.length > 0 && result.rows[0].password === password) {
      return res.json({ message: "Login successful", stats: 200, id: result.rows[0].id });
    }
    res.json({ stats: 201 });
  } catch (err) {
    console.error("Error during login:", err);
    res.json({ stats: 404 });
  }
});

app.post("/api/register", async (req, res) => {
  const { name, username, password, location, phone_number, description, working_in } = req.body;
  const logo_image = req.files?.logo_image;

  if (!name || !username || !password || !location || !phone_number || !description || !working_in) {
    return res.status(400).json({ mseeg: "All fields are required." });
  }

  if (password.length < 8) {
    return res.status(400).json({ mseeg: "Password must be at least 8 characters long." });
  }

  const checkUsername = await db.query("SELECT * FROM account WHERE username = $1", [username]);
  if (checkUsername.rows.length > 0) {
    return res.status(400).json({ mseeg: "This username is already taken." });
  }

  let webpImageBuffer = null;
  if (logo_image) {
    if (logo_image.size > 50 * 1024 * 1024) {
      return res.status(400).json({ mseeg: "Image size must be under 50 MB." });
    }
    try {
      webpImageBuffer = await sharp(logo_image.data).webp({ quality: 80 }).toBuffer();
    } catch (err) {
      return res.status(400).json({ mseeg: "Invalid image file." });
    }
  }

  const match = location.match(/q=([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?)/);
  let lat = null, lng = null;
  if (match && match[1] && match[2]) {
    lat = parseFloat(match[1]);
    lng = parseFloat(match[2]);
  }

  let query, values;
  if (webpImageBuffer) {
    query = `
      INSERT INTO account (
        username, password, name, logo_image, location, phone_number, description, working_in, lat, lng
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    values = [username, password, name, webpImageBuffer, location, phone_number, description, working_in, lat, lng];
  } else {
    query = `
      INSERT INTO account (
        username, password, name, location, phone_number, description, working_in, lat, lng
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    values = [username, password, name, location, phone_number, description, working_in, lat, lng];
  }

  await db.query(query, values);
  res.status(200).json({ message: "Registration successful! Please log in." });
});

app.post("/api/profile", async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Account ID is required" });

  try {
    const result = await db.query(`
      SELECT id, username, name, logo_image, location, phone_number, description
      FROM account WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) return res.status(404).json({ error: "Account not found" });

    const row = result.rows[0];
    res.json({
      account_id: row.id,
      username: row.username,
      name: row.name,
      logo_image: row.logo_image ? row.logo_image.toString("base64") : null,
      location: row.location,
      phone_number: row.phone_number,
      description: row.description,
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/Workers/types", async (req, res) => {
  try {
    const cached = await redisClient.get("worker_types");
    if (cached) return res.json({ types: JSON.parse(cached) });

    const result = await db.query(`
      SELECT DISTINCT working_in FROM account 
      WHERE working_in IS NOT NULL AND working_in <> '' ORDER BY working_in
    `);

    const types = result.rows.map(r => r.working_in.trim()).filter(Boolean);
    await redisClient.setEx("worker_types", 3600, JSON.stringify(types));
    res.json({ types });
  } catch (err) {
    console.error("Failed to fetch worker types:", err);
    res.status(500).json({ error: "Failed to fetch worker types" });
  }
});

app.post("/api/Workers/filter", async (req, res) => {
  const { userLat, userLng, workerType, page = 1 } = req.body;
  if (typeof userLat !== 'number' || typeof userLng !== 'number' || isNaN(userLat) || isNaN(userLng) || !workerType) {
    return res.status(400).json({ error: "Invalid request parameters" });
  }

  const limit = 15;
  const offset = (page - 1) * limit;

  try {
    const query = `
      SELECT 
        id, name, phone_number, working_in,
        encode(logo_image, 'base64') AS logo_image,
        ROUND(
          6371 * 2 * ASIN(SQRT(
            POWER(SIN(($1 - lat) * PI()/180 / 2), 2) +
            COS($1 * PI()/180) * COS(lat * PI()/180) *
            POWER(SIN(($2 - lng) * PI()/180 / 2), 2)
          ))::numeric, 2
        ) AS distance
      FROM account
      WHERE working_in = $3 AND lat IS NOT NULL AND lng IS NOT NULL
      ORDER BY distance ASC
      LIMIT $4 OFFSET $5
    `;
    const values = [userLat, userLng, workerType, limit, offset];
    const result = await db.query(query, values);

    res.json({
      workers: result.rows,
      page,
      hasMore: result.rows.length === limit
    });
  } catch (err) {
    console.error("Worker filter error:", err);
    res.status(500).json({ error: "Failed to fetch workers" });
  }
});

app.listen(process.env.port, () => {
  console.log(`Server is running on port ${process.env.port}`);
});