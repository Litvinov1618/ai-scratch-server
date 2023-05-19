const express = require('express');
const createAiSearchResponse = require('../createAiSearchResponse');
const createEmbedding = require('../createEmbedding');
const pool = require('../db');
const router = express.Router();

// Set new note
router.post('/', async (req, res) => {
    try {
        const {
            text,
            date,
            user_email
        } = req.body;

        const embedding = await createEmbedding(text);

        const newNote = await pool.query(
            `INSERT INTO notes (embedding, text, date, user_email) VALUES($1::numeric[], $2, $3, $4)
            RETURNING id, text, date, user_email;`,
            [embedding, text, date, user_email]
        );

        res.json(newNote.rows[0]);
    } catch (err) {
        res.json({
            error: err.message
        });
        console.error(err.message);
    }
});

// Search notes by query
router.get('/search', async (req, res) => {
    try {
        const { searchValue } = req.query;

        if (!searchValue) {
            return res.json({
                error: 'No search value provided'
            });
        }

        const embedding = await createEmbedding(searchValue);
        const cosineSimilarityThreshold = process.env.COSINE_SIMILARITY_THRESHOLD;

        const result = await pool.query(
            `SELECT text, date, id
            FROM notes
            WHERE 1 - (embedding <=> $1::numeric[]::vector(1536)) >= $2;`,
            [embedding, cosineSimilarityThreshold]
        );

        const aiResponse = await createAiSearchResponse(searchValue, result.rows);

        res.json({ posts: result.rows, aiResponse });
    } catch (err) {
        res.json({
            error: err.message
        });
        console.error(err.message);
    }
});

// Get all notes
router.get('/', async (req, res) => {
    try {
        const {
            user_email
        } = req.query;
        const allNotes = await pool.query(
            `SELECT id, text, date FROM notes
            WHERE user_email=$1 ORDER BY date DESC;`,
            [user_email]
        );
        res.json(allNotes.rows);
    } catch (err) {
        res.json({
            error: err.message
        });
        console.error(err.message);
    }
});

// Alter note
router.put('/:id', async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const {
            text,
            date,
        } = req.body;

        const embedding = await createEmbedding(text);

        const updatedNotes = await pool.query(
            `UPDATE notes SET text = $1, date = $2, embedding = $3::numeric[]::vector(1536)
            WHERE id = $4 RETURNING id, text, date;`,
            [text, date, embedding, id]
        );

        res.json(updatedNotes.rows);
    } catch (err) {
        res.json({
            error: err.message
        });
        console.error(err.message);
    }
});

// Delete note
router.delete('/:id', async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const restOfNotes = await pool.query(
            `DELETE FROM notes WHERE id = $1
            RETURNING id, text, date;`,
            [id]);
        res.json(restOfNotes.rows);
    } catch (err) {
        res.json({
            error: err.message
        });
        console.error(err.message);
    }
});

module.exports = router;