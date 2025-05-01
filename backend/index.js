import express from "express";
import bodyParser from "body-parser";
import pg from "pg"
import fileUpload from "express-fileupload"
import multer from 'multer';
import dotenv from 'dotenv';
import cors from "cors";
import sharp from 'sharp'; // Add this import at the top with other imports
import { console } from "inspector";


dotenv.config();
const app = express();
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: !0 }));
cors({ origin: "*", methods: ["GET", "POST"], allowedHeaders: ["Content-Type", "Authorization"] })
app.use(cors());
app.use(bodyParser.json());


const storage = multer.memoryStorage();
const upload = multer({
    storage: storage
});

const db = new pg.Client({ password: process.env.password, host: process.env.host, database: process.env.db, user: process.env.user, port: 5432 })
db.connect()


app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    console.log(email, password)
    try {
        const result = await db.query(`SELECT id, password FROM account WHERE username = $1`, [email]);
        if (result.rows.length > 0 && result.rows[0].password === password) {
            res.json({
                message: "Login successful",
                stats: 200,
                id: result.rows[0].id,
            })
        } else {
            res.json({ stats: 201 })
        }
    } catch (err) {
        console.error("Error during login:", err);
        res.json({ stats: 404 })
    }
});


app.post("/api/register", async (req, res) => {
    try {
        const {
            name,
            username,
            password,
            location,
            phone_number,
            description,
            working_in
        } = req.body;

        const logo_image = req.files?.logo_image; // Optional image upload

        // Validate required fields
        if (!name || !username || !password || !location || !phone_number || !description || !working_in) {
            return res.status(400).json({
                mseeg: "All fields are required: name, username, password, location, phone number, description, and working field."
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                mseeg: "Password must be at least 8 characters long."
            });
        }

        let webpImageBuffer = null;

        // Process image only if uploaded
        if (logo_image) {
            if (logo_image.size > 50 * 1024 * 1024) {
                return res.status(400).json({
                    mseeg: "Image size must be under 50 MB."
                });
            }

            try {
                webpImageBuffer = await sharp(logo_image.data)
                    .webp({ quality: 80 })
                    .toBuffer();
            } catch (sharpError) {
                console.error("Image conversion error:", sharpError);
                return res.status(400).json({
                    mseeg: "Invalid image file. Please upload a valid image."
                });
            }
        }

        // Check if username already exists
        const checkUsernameQuery = "SELECT * FROM account WHERE username = $1";
        const checkUsernameResult = await db.query(checkUsernameQuery, [username]);

        if (checkUsernameResult.rows.length > 0) {
            return res.status(400).json({
                mseeg: "This username is already taken. Please choose a different one."
            });
        }

        // Prepare and execute the insert query
        let insertQuery;
        let values;

        if (webpImageBuffer) {
            insertQuery = `
                INSERT INTO account (
                    username, password, name, logo_image, location, phone_number, description, working_in
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `;
            values = [
                username,
                password,
                name,
                webpImageBuffer,
                location,
                phone_number,
                description,
                working_in
            ];
        } else {
            insertQuery = `
                INSERT INTO account (
                    username, password, name, location, phone_number, description, working_in
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;
            values = [
                username,
                password,
                name,
                location,
                phone_number,
                description,
                working_in
            ];
        }

        const dbres = await db.query(insertQuery, values);

        console.log(dbres);

        return res.status(200).json({
            message: "Registration successful! Please log in."
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            mseeg: "An error occurred during registration."
        });
    }
});


app.post("/api/profile", async (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ error: "Account ID is required" });
    }
    try {
        const query = `
            SELECT 
                a.id AS account_id,
                a.username,
                a.name,
                a.logo_image,
                a.location,
                a.phone_number,
                a.description AS account_description
         
            FROM 
                public.account a

            WHERE 
                a.id = $1;
        `;
        const result = await db.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Account not found" });
        }

        const accountData = {
            account_id: result.rows[0].account_id,
            username: result.rows[0].username,
            name: result.rows[0].name,
            logo_image: result.rows[0].logo_image,
            location: result.rows[0].location,
            phone_number: result.rows[0].phone_number,
            description: result.rows[0].account_description

        };



        res.status(200).json(accountData);
    } catch (error) {
        console.error("Error fetching profile data:", error);
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
            FROM 
                account
        `;
        const workersResult = await db.query(workersQuery);
        const workersWithImages = workersResult.rows.map(worker => ({
            account_id: worker.id,
            account_name: worker.account_name,
            location: worker.location,
            description: worker.description,
            logo_image: worker.logo_image ? worker.logo_image.toString('base64') : null,
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
    try {
        const result = await db.query(`
            SELECT DISTINCT working_in 
            FROM account 
            WHERE working_in IS NOT NULL AND working_in <> ''
            ORDER BY working_in
        `);
        const types = result.rows.map(row => row.working_in.trim()).filter(Boolean);
        res.json({ types });
    } catch (err) {
        console.error("Failed to fetch worker types:", err);
        res.status(500).json({ error: 'Failed to fetch worker types' });
    }
});

app.post("/api/Workers/filter", async (req, res) => {
    const { userLat, userLng, workerType, page = 1 } = req.body;
    if (typeof userLat !== 'number' || typeof userLng !== 'number' || 
        isNaN(userLat) || isNaN(userLng) || !workerType || typeof workerType !== 'string') {
        return res.status(400).json({ error: 'Invalid request parameters' });
    }

    const limit = 15;
    const offset = (page - 1) * limit;

    try {
        const query = `
            SELECT 
                id, 
                name, 
                phone_number,
                working_in,
                encode(logo_image, 'base64') AS logo_image,
                ROUND(
                    6371 * 2 * ASIN(SQRT(
                        POWER(SIN(($1 - lat) * PI()/180 / 2), 2) +
                        COS($1 * PI()/180) * COS(lat * PI()/180) *
                        POWER(SIN(($2 - lng) * PI()/180 / 2), 2)
                    ))::numeric, 2
                ) AS distance
            FROM (
                SELECT 
                    id, 
                    name, 
                    phone_number,
                    working_in,
                    logo_image,
                    (regexp_match(location, 'q=([+-]?\\d+(?:\\.\\d+)?),([+-]?\\d+(?:\\.\\d+)?)'))[1]::FLOAT AS lat,
                    (regexp_match(location, 'q=([+-]?\\d+(?:\\.\\d+)?),([+-]?\\d+(?:\\.\\d+)?)'))[2]::FLOAT AS lng
                FROM account
                WHERE working_in = $3
                AND location ~* 'q=([+-]?\\d+(?:\\.\\d+)?),([+-]?\\d+(?:\\.\\d+)?)'
            ) AS subquery
            WHERE lat IS NOT NULL AND lng IS NOT NULL
            ORDER BY distance ASC
            LIMIT $4 OFFSET $5;
        `;

        const values = [userLat, userLng, workerType, limit, offset];
        const result = await db.query(query, values);

        res.json({ 
            workers: result.rows,
            page,
            hasMore: result.rows.length === limit
        });
    } catch (err) {
        console.error("Error fetching workers:", err);
        res.status(500).json({ error: 'Failed to fetch workers' });
    }
});








app.listen(process.env.port, () => {
    console.log('Server is running on port' + process.env.port);
});

// app.post("/api/addpost", async (req, res) => {
//     try {
//         const {
//             account_name,
//             location,
//             description,
//             account_id,
//             post_title,
//         } = req.body;

//         // Check if files were uploaded
//         if (!req.files || !req.files.images) {
//             return res.status(400).json({ error: "No images uploaded." });
//         }

//         const images = Array.isArray(req.files.images)
//             ? req.files.images
//             : [req.files.images];

//         // Insert post into the `posts` table
//         const postInsertQuery = `
//             INSERT INTO posts (
//                 account_name, location, description, account_id, post_title
//             ) VALUES ($1, $2, $3, $4, $5)
//             RETURNING post_id
//         `;
//         const postValues = [
//             account_name,
//             location,
//             description,
//             account_id,
//             post_title,
//         ];
//         const postResult = await db.query(postInsertQuery, postValues);
//         const postId = postResult.rows[0].post_id;

//         // Process and store images in the `post_images` table
//         for (const image of images) {
//             // Convert image to WebP format
//             const webpImageBuffer = await sharp(image.data)
//                 .webp({ quality: 80 })
//                 .toBuffer();

//             const imageInsertQuery = `
//                 INSERT INTO post_images (image, post_id)
//                 VALUES ($1, $2)
//             `;
//             const imageValues = [webpImageBuffer, postId];
//             await db.query(imageInsertQuery, imageValues);
//         }

//         res.status(200).json({ message: "Post added successfully!" });
//     } catch (err) {
//         console.error("Error adding post:", err);
//         res.status(500).json({ error: "An error occurred while adding the post." });
//     }
// });
// app.get("/api/Posts", async (req, res) => {
//     try {
//         // Query to fetch all posts
//         const postsQuery = `
//             SELECT
//                 p.post_id,
//                 p.account_name,
//                 p.location,
//                 p.description,
//                 p.account_id,
//                 p.post_title
//             FROM
//                 posts p
//         `;
//         const postsResult = await db.query(postsQuery);

//         // Extract post IDs for fetching images
//         const postIds = postsResult.rows.map(post => post.post_id);

//         // Query to fetch all images for the fetched posts
//         const imagesQuery = `
//             SELECT
//                 pi.image_id,
//                 pi.image,
//                 pi.post_id
//             FROM
//                 post_images pi
//             WHERE
//                 pi.post_id = ANY($1)
//         `;
//         const imagesResult = await db.query(imagesQuery, [postIds]);

//         // Organize the data into a structured format
//         const postsWithImages = postsResult.rows.map(post => {
//             const imagesForPost = imagesResult.rows
//                 .filter(imageRow => imageRow.post_id === post.post_id)
//                 .map(imageRow => ({
//                     image_id: imageRow.image_id,
//                     image: imageRow.image ? imageRow.image.toString('base64') : null,
//                 }));
//             return {
//                 post_id: post.post_id,
//                 account_name: post.account_name,
//                 location: post.location,
//                 description: post.description,
//                 account_id: post.account_id,
//                 post_title: post.post_title,
//                 images: imagesForPost,
//             };
//         });

//         res.status(200).json({
//             success: true,
//             data: postsWithImages,
//         });
//     } catch (err) {
//         console.error("Error fetching posts and images:", err);
//         res.status(500).json({
//             success: false,
//             error: "An error occurred while fetching posts and images.",
//         });
//     }
// });