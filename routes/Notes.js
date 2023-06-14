const express = require('express');
const createAiSearchResponse = require('../createAiSearchResponse');
const createEmbedding = require('../createEmbedding');
const pool = require('../db');
const aiResponseErrorHandler = require('../aiResponseErrorHandler');
const router = express.Router();

// Set new note
router.post('/', async (req, res) => {
    try {
        const {
            date,
            user_email
        } = req.body;

        const newNote = await pool.query(
            `INSERT INTO notes (date, user_email) VALUES($1, $2)
            RETURNING id, text, date, user_email;`,
            [date, user_email]
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
    let notes = [];
    let aiResponse = "";

    const { search_value, user_email } = req.query;

    if (!user_email) {
        res.json({
            error: 'No user email provided',
            notes: [],
            aiResponse,
        });

        return;
    }

    if (!search_value) {
        res.json({
            error: 'No search value provided',
            notes: [],
            aiResponse,
        });

        return;
    }

    try {
        const embedding = await createEmbedding(search_value);
        const cosineSimilarityThreshold = process.env.COSINE_SIMILARITY_THRESHOLD;

        const result = await pool.query(
            `SELECT text, date, id
            FROM notes
            WHERE user_email=$1 AND (1 - (embedding <=> $2::numeric[]::vector(1536))) >= $3;`,
            [user_email, embedding, cosineSimilarityThreshold]
        );

        notes = result?.rows || [];
    } catch (err) {
        if (err?.response?.config?.url.includes('openai')) {
            const message = aiResponseErrorHandler(err.response);

            console.error(err.response.status, err.response.data);
            res.json({
                error: message,
                notes,
                aiResponse,
            });

            return;
        }

        console.error(err.message);
        res.json({
            error: err.message,
            notes,
            aiResponse,
        });

        return;
    }

    if (notes.length === 0) {
        res.json({
            notes,
            aiResponse,
        });
        
        return;
    }

    try {
        aiResponse = await createAiSearchResponse(search_value, notes) || "";
    } catch (err) {
        const message = aiResponseErrorHandler(err.response);

        console.error(err.response.status, err.response.data);
        res.json({
            notes,
            error: message,
            aiResponse,
        });

        return;
    }

    res.json({
        notes,
        aiResponse
    });
});

// Get all notes
router.get('/', async (req, res) => {
    try {
        const {
            user_email
        } = req.query;
        const allNotes = await pool.query(
            `SELECT id, text, date, delta FROM notes
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
            delta,
            date,
        } = req.body;

        const embedding = await createEmbedding(text);

        const updatedNotes = await pool.query(
            `UPDATE notes SET text = $1, date = $2, embedding = $3::numeric[]::vector(1536), delta = $5
            WHERE id = $4 RETURNING id, text, date;`,
            [text, date, embedding, id, delta]
        );

        res.json(updatedNotes.rows);
    } catch (err) {
        if (err?.response?.config?.url.includes('openai')) {
            res.json({
                error: `OpenAI API error. Code: ${err.response.status}, Message Code: ${err.response.data.code}, Message: ${err.response.data.message}`
            });

            console.error(err.response.status, err.response.data);
            return;
        }

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