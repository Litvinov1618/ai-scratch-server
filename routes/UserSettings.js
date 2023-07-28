const express = require('express');
const pool = require('../db');
const handleError = require('../handleError');

const router = express.Router();

// Set new user settings
router.post('/', async (req, res) => {
    try {
        const {
            notes_similarity_threshold,
            email,
            ai_response_temperature,
            show_ai_response,
        } = req.body;

        const newNote = await pool.query(
            `INSERT INTO user_settings (notes_similarity_threshold, email, ai_response_temperature, show_ai_response) VALUES($1, $2, $3, $4)
            RETURNING notes_similarity_threshold, email, ai_response_temperature, show_ai_response;`,
            [notes_similarity_threshold, email, ai_response_temperature, show_ai_response]
        );

        res.json(newNote.rows[0]);
    } catch (err) {
        handleError(err, res);
    }
});

// Get user settings by email
router.get('/:email', async (req, res) => {
    try {
        const { email } = req.params;

        const userSettings = await pool.query(
            `SELECT * FROM user_settings WHERE email = $1;`,
            [email]
        );

        res.json(userSettings.rows[0] || {});
    } catch (err) {
        handleError(err, res);
    }
});

// Update user settings by email
router.put('/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const {
            notes_similarity_threshold,
            ai_response_temperature,
            show_ai_response,
        } = req.body;

        const updatedUserSettings = await pool.query(
            `UPDATE user_settings SET notes_similarity_threshold = $1, ai_response_temperature = $2, show_ai_response = $3 WHERE email = $4 RETURNING *;`,
            [notes_similarity_threshold, ai_response_temperature, show_ai_response, email]
        );

        res.json(updatedUserSettings.rows[0]);
    } catch (err) {
        handleError(err, res);
    }
});

// Delete user settings by email
router.delete('/:email', async (req, res) => {
    try {
        const { email } = req.params;

        const deletedUserSettings = await pool.query(
            `DELETE FROM user_settings WHERE email = $1 RETURNING *;`,
            [email]
        );

        res.json(deletedUserSettings.rows[0]);
    } catch (err) {
        handleError(err, res);
    }
});

module.exports = router;