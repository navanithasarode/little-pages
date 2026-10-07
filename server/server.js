const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

//GET 
app.get("/", (req, res) => {
    res.send("Little Pages server is running");
});

app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send("Database connection failed");
    }
});

//PROMPTS
app.get("/prompts/:category", async (req, res) => {
    try {
        const { category } = req.params; 
        const result = await pool.query("SELECT * FROM prompts WHERE category = $1 ORDER BY RANDOM() LIMIT 1", [category]);
        if (result.rows.length === 0){
            return res.status(404).json({message: "No prompts found for this category"});
        }
        res.json(result.rows[0]); 
    } catch(error){
        console.error(error);
        res.status(500).json({message:"Error fetching prompts"});
    }
});

//FIRST JOURNAL ENTRY
app.get("/five-minute/:userId/:date", async (req, res) => {
    try {
        const { userId, date } = req.params;

        const result = await pool.query(
            "SELECT * FROM five_minute_entries WHERE user_id = $1 AND entry_date = $2",
            [userId, date]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No journal entry found for this date" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching 5-minute journal" });
    }
});

//POST
app.post("/five-minute", async (req, res) => {
    try {
        const {
            user_id,
            entry_date,
            weekly_challenge,
            gratitude_1,
            gratitude_2,
            gratitude_3,
            today_great_1,
            today_great_2,
            today_great_3,
            affirmation,
            amazing_1,
            amazing_2,
            amazing_3,
            today_better
        } = req.body;

        const result = await pool.query(
            `INSERT INTO five_minute_entries (
                user_id,
                entry_date,
                weekly_challenge,
                gratitude_1,
                gratitude_2,
                gratitude_3,
                today_great_1,
                today_great_2,
                today_great_3,
                affirmation,
                amazing_1,
                amazing_2,
                amazing_3,
                today_better
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12, $13, $14
            )
            RETURNING *`,
            [
                user_id,
                entry_date,
                weekly_challenge,
                gratitude_1,
                gratitude_2,
                gratitude_3,
                today_great_1,
                today_great_2,
                today_great_3,
                affirmation,
                amazing_1,
                amazing_2,
                amazing_3,
                today_better
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error saving 5-minute journal" });
    }
});

//PUT
app.put("/five-minute/:userId/:date", async (req, res) => {
    try {
        const { userId, date } = req.params;

        const {
            weekly_challenge,
            gratitude_1,
            gratitude_2,
            gratitude_3,
            today_great_1,
            today_great_2,
            today_great_3,
            affirmation,
            amazing_1,
            amazing_2,
            amazing_3,
            today_better
        } = req.body;

        const result = await pool.query(
            `UPDATE five_minute_entries
             SET
                weekly_challenge = $1,
                gratitude_1 = $2,
                gratitude_2 = $3,
                gratitude_3 = $4,
                today_great_1 = $5,
                today_great_2 = $6,
                today_great_3 = $7,
                affirmation = $8,
                amazing_1 = $9,
                amazing_2 = $10,
                amazing_3 = $11,
                today_better = $12,
                updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $13 AND entry_date = $14
             RETURNING *`,
            [
                weekly_challenge,
                gratitude_1,
                gratitude_2,
                gratitude_3,
                today_great_1,
                today_great_2,
                today_great_3,
                affirmation,
                amazing_1,
                amazing_2,
                amazing_3,
                today_better,
                userId,
                date
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "No journal entry found for this date"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error updating 5-minute journal"
        });
    }
});


//ONE_PAGE_DUMP SECOND JOURNAL ENTRY
app.post("/one-page-dump", async (req, res) => {
    try {
        const {
            user_id,
            title,
            content
        } = req.body;

        const result = await pool.query(
            `INSERT INTO journal_entries (
                user_id,
                type,
                title,
                content
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                user_id,
                "one_page_dump",
                title,
                content
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error saving One Page Dump"
        });
    }
});

//GET FOR ONE PAGE DUMP
app.get("/one-page-dump/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(
            `SELECT * FROM journal_entries
             WHERE user_id = $1
             AND type = 'one_page_dump'
             ORDER BY created_at DESC`,
            [userId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error fetching One Page Dump entries"
        });
    }
});

//UPDATE ONE PAGE DUMP
app.put("/one-page-dump/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;

        const result = await pool.query(
            `UPDATE journal_entries
             SET
                title = $1,
                content = $2,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             AND type = 'one_page_dump'
             RETURNING *`,
            [title, content, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "One Page Dump not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error updating One Page Dump"
        });
    }
});

//THIRD JOURNAL ENTRY
app.post("/movie-review", async (req, res) => {
    try {
        const {
            user_id,
            title,
            genre,
            watched_date,
            rating,
            synopsis,
            thoughts,
            picture_quote
        } = req.body;

        const result = await pool.query(
            `INSERT INTO movie_reviews (
                user_id,
                title,
                genre,
                watched_date,
                rating,
                synopsis,
                thoughts,
                picture_quote
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                user_id,
                title,
                genre,
                watched_date,
                rating,
                synopsis,
                thoughts,
                picture_quote
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error saving movie/series review"
        });
    }
});

//GET FOR MOVIE/SERIES REVIEW
app.get("/movie-review/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(
            `SELECT * FROM movie_reviews
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error fetching movie/series reviews"
        });
    }
});

//UPDATE EXISTING MOVIE/SERIES REVIEW
app.put("/movie-review/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            title,
            genre,
            watched_date,
            rating,
            synopsis,
            thoughts,
            picture_quote
        } = req.body;

        const result = await pool.query(
            `UPDATE movie_reviews
             SET
                title = $1,
                genre = $2,
                watched_date = $3,
                rating = $4,
                synopsis = $5,
                thoughts = $6,
                picture_quote = $7,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $8
             RETURNING *`,
            [
                title,
                genre,
                watched_date,
                rating,
                synopsis,
                thoughts,
                picture_quote,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Movie/Series review not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error updating movie/series review"
        });
    }
});

//FOURTH JOURNAL ENTRY
app.post("/random-entry", async (req, res) => {
    try {
        const {
            user_id,
            prompt_id,
            answer
        } = req.body;

        const result = await pool.query(
            `INSERT INTO random_entries (
                user_id,
                prompt_id,
                answer
            )
            VALUES ($1, $2, $3)
            RETURNING *`,
            [
                user_id,
                prompt_id,
                answer
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error saving random journal entry"
        });
    }
});

//GET FOR RANDOM ENTRY- retrieve all random entries for a user
app.get("/random-entry/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(
            `SELECT
                random_entries.id,
                random_entries.user_id,
                random_entries.prompt_id,
                prompts.prompt_text,
                prompts.category,
                random_entries.answer,
                random_entries.created_at,
                random_entries.updated_at
             FROM random_entries
             LEFT JOIN prompts
             ON random_entries.prompt_id = prompts.id
             WHERE random_entries.user_id = $1
             ORDER BY random_entries.created_at DESC`,
            [userId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error fetching random journal entries"
        });
    }
});

//UPDATE RANDOM ENTRY- change answer later
app.put("/random-entry/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { answer } = req.body;

        const result = await pool.query(
            `UPDATE random_entries
             SET
                answer = $1,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [answer, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Random journal entry not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error updating random journal entry"
        });
    }
});
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});