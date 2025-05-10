import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
const { Pool } = pg;
import multer from "multer";
import dotenv from "dotenv";
import cors from "cors";
import sharp from "sharp";

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({ origin: "*", methods: ["GET", "POST"], allowedHeaders: ["*"] }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

const db = new Pool({
    password: process.env.password,
    host: process.env.host,
    database: process.env.db,
    user: process.env.user,
    port: 5432,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

let cachedWorkerTypes = [];
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query("SELECT id FROM account WHERE username = $1 AND password = $2", [email, password]);
        if (result.rows.length > 0) {
            res.json({ message: "Login successful", stats: 200, id: result.rows[0].id });
        } else {
            res.json({ stats: 201 });
        }
    } catch (err) {
        res.json({ stats: 404 });
    }
});

app.post("/api/register", upload.single("logo_image"), async (req, res) => {
    const { name, username, password, location, phone_number, description, working_in } = req.body;
    if (!name || !username || !password || !location || !phone_number || !description || !working_in) {
        return res.status(400).json({ mseeg: "All fields are required." });
    }
    if (password.length < 8) {
        return res.status(400).json({ mseeg: "Password must be at least 8 characters long." });
    }

    let webpImageBuffer = null;
    if (req.file) {
        if (req.file.size > 50 * 1024 * 1024) {
            return res.status(400).json({ mseeg: "Image size must be under 50 MB." });
        }
        try {
            webpImageBuffer = await sharp(req.file.buffer)
                .webp({ quality: 80 })
                .toBuffer();
        } catch (err) {
            return res.status(400).json({ mseeg: "Invalid image file." });
        }
    }

    try {
        const check = await db.query("SELECT * FROM account WHERE username = $1", [username]);
        if (check.rows.length > 0) {
            return res.status(400).json({ mseeg: "This username is already taken." });
        }

        let insertQuery, values;
        if (webpImageBuffer) {
            insertQuery = `
                INSERT INTO account (
                    username, password, name, logo_image, location, phone_number, description, working_in
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `;
            values = [username, password, name, webpImageBuffer, location, phone_number, description, working_in];
        } else {
            insertQuery = `
                INSERT INTO account (
                    username, password, name, location, phone_number, description, working_in
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;
            values = [username, password, name, location, phone_number, description, working_in];
        }

        await db.query(insertQuery, values);
        return res.status(200).json({ message: "Registration successful!" });
    } catch (err) {
        return res.status(500).json({ mseeg: "An error occurred during registration." });
    }
});

app.post("/api/profile", async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "Account ID is required" });

    try {
        const result = await db.query(`
            SELECT 
                id, username, name, logo_image, location, phone_number, description
            FROM account
            WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) return res.status(404).json({ error: "Account not found" });

        const data = result.rows[0];
        res.status(200).json({
            account_id: data.id,
            username: data.username,
            name: data.name,
            logo_image: data.logo_image ? data.logo_image.toString("base64") : null,
            location: data.location,
            phone_number: data.phone_number,
            description: data.description
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/Workers", async (req, res) => {
    try {
        const workersQuery = `
            SELECT 
                id,
                name AS account_name,
                location,
                description,
                logo_image
            FROM account
        `;
        const workersResult = await db.query(workersQuery);

        const workersWithImages = workersResult.rows.map(worker => ({
            account_id: worker.id,
            account_name: worker.account_name,
            location: worker.location,
            description: worker.description,
            logo_image: worker.logo_image ? Buffer.from(worker.logo_image).toString('base64') : null
        }));

        res.status(200).json({
            success: true,
            data: workersWithImages,
        });
    } catch (err) {
        console.error("Error fetching worker accounts:", err);
        res.status(500).json({
            success: false,
            error: "An error occurred while fetching worker accounts.",
        });
    }
});

app.get("/api/Workers/types", async (req, res) => {
    if (Date.now() - lastFetchTime < CACHE_TTL && cachedWorkerTypes.length > 0) {
        return res.json({ types: cachedWorkerTypes });
    }

    try {
        const result = await db.query(`
            SELECT DISTINCT working_in 
            FROM account 
            WHERE working_in IS NOT NULL AND working_in <> ''
            ORDER BY working_in
        `);
        cachedWorkerTypes = result.rows.map(row => row.working_in.trim()).filter(Boolean);
        lastFetchTime = Date.now();
        res.json({ types: cachedWorkerTypes });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch worker types" });
    }
});

app.post("/api/Workers/filter", async (req, res) => {
    const { userLat, userLng, workerType, page = 1 } = req.body;
    
    if (typeof userLat !== "number" || typeof userLng !== "number" || 
        isNaN(userLat) || isNaN(userLng) || !workerType) {
        return res.status(400).json({ error: "Invalid request parameters" });
    }

    const limit = 15;
    const offset = (page - 1) * limit;

    try {
        await db.query(`
            UPDATE account 
            SET 
                lat = CAST(SPLIT_PART(SPLIT_PART(location, 'q=', 2), ',', 1) AS FLOAT),
                lng = CAST(SPLIT_PART(SPLIT_PART(location, 'q=', 2), ',', 2) AS FLOAT)
            WHERE location LIKE '%q=%' 
            AND (lat IS NULL OR lng IS NULL)
        `);

        const result = await db.query(`
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
            WHERE working_in ILIKE $3
              AND lat IS NOT NULL
              AND lng IS NOT NULL
            ORDER BY distance ASC
            LIMIT $4 OFFSET $5
        `, [userLat, userLng, workerType, limit, offset]);
        
        res.json({ 
            workers: result.rows, 
            page, 
            hasMore: result.rows.length === limit 
        });
    } catch (err) {
        console.error("Filter error:", err);
        res.status(500).json({ 
            error: "Failed to fetch workers",
            details: err.message 
        });
    }
});

app.listen(process.env.port, () => {
    console.log("Server is running on port " + process.env.port);
});