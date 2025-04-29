import express from "express";
import bodyParser from "body-parser";
import pg from "pg"
import fileUpload from "express-fileupload"
import multer from 'multer';
import dotenv from 'dotenv';
import cors from "cors";
import sharp from 'sharp'; // Add this import at the top with other imports


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

// const db=new pg.Client({user:"users_x5qf_user",host:"dpg-crd1mqg8fa8c73bg324g-a",port:5432,password:"gdFRLYxirPld1F0MrJ1rsK6LVlDDvFjj",database:"users_x5qf",})
const db = new pg.Client({ password: process.env.password, host: process.env.host, database: process.env.db, user: process.env.user, port: 5432 })
db.connect()


app.post("/api/login", async (req, res) => {
    const { email , password } = req.body;
    console.log(email , password)
    try {
        const result = await db.query(`SELECT id, password, account_type FROM account WHERE username = $1`,[email]);
        if (result.rows.length > 0 && result.rows[0].password === password) {
            res.json({
                message: "Login successful",
                stats: 200,
                id: result.rows[0].id,
                account_type:result.rows[0].account_type
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
            account_type,
        } = req.body;

        const logo_image = req.files?.logo_image; // Get the uploaded file

        // Check if all required fields are provided
        if (!name || !username || !password || !location || !phone_number || !account_type) {
            console.log("All fields are required.");
            return res.status(400).json({ mseeg: "All fields are required." });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({ mseeg: "The password must be more than 8 characters long." });
        }

        // Validate file upload
        if (!logo_image) {
            return res.status(400).json({ mseeg: "Please select an image." });
        }

        if (logo_image.size > 50 * 1024 * 1024) {
            return res.status(400).json({ mseeg: "Image size must be under 50 MB." });
        }

        // Convert image to WebP format
        let webpImageBuffer;
        try {
            webpImageBuffer = await sharp(logo_image.data)
                .webp({ quality: 80 })
                .toBuffer();
        } catch (sharpError) {
            console.error("Image conversion error:", sharpError);
            return res.status(400).json({ mseeg: "Invalid image file. Please upload a valid image." });
        }

        // Check if the username already exists in the database
        const checkUsernameQuery = "SELECT * FROM account WHERE username = $1";
        const checkUsernameResult = await db.query(checkUsernameQuery, [username]);

        if (checkUsernameResult.rows.length > 0) {
            // Username already exists
            return res.status(400).json({ mseeg: "This username is already taken. Please log in or choose a different username." });
        }

        // Insert into database
        const insertQuery = `
            INSERT INTO account (
                username, password, name, logo_image, location, phone_number, description, account_type
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        const values = [
            username,
            password,
            name,
            webpImageBuffer,
            location,
            phone_number,
            description,
            account_type,
        ];

        const dbres = await db.query(insertQuery, values);
        console.log(dbres);

        // Return success response
        return res.status(200).json({ message: "Registration successful! Please login." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ mseeg: "An error occurred during registration." });
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
                a.description AS account_description,
                a.account_type
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
            description: result.rows[0].account_description,
            account_type: result.rows[0].account_type,
         
        };



        res.status(200).json(accountData);
    } catch (error) {
        console.error("Error fetching profile data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});




app.get("/api/Workers", async (req, res) => {
    try {
        // Query to fetch all worker accounts
        const workersQuery = `
            SELECT 
                id,
                name AS account_name,
                location,
                description,
                account_type,
                logo_image
            FROM 
                account
            WHERE 
                account_type = 'worker'
        `;
        const workersResult = await db.query(workersQuery);

        // Convert logo images to base64 if they exist
        const workersWithImages = workersResult.rows.map(worker => ({
            account_id: worker.id,
            account_name: worker.account_name,
            location: worker.location,
            description: worker.description,
            account_type: worker.account_type,
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