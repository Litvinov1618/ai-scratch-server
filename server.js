const express = require('express');
const cors = require('cors');
const app = express();
const pool = require('./db');

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// Set new note
app.post('/notes', async (req, res) => {
    try {
        const {
            text,
            date,
            embedding
        } = req.body;

        const newNote = await pool.query(
            'INSERT INTO notes (text, date, embedding) VALUES($1, $2, $3) RETURNING *',
            [text, date, embedding]
        );

        res.json(newNote.rows[0]);
    } catch (err) {
        console.error(err.message);
    }
});

// Get all notes
app.get('/notes', async (req, res) => {
    try {
        const allNotes = await pool.query('SELECT * FROM notes');
        res.json(allNotes.rows);
    } catch (err) {
        console.error(err.message);
    }
});

// Alter note
app.put('/notes/:id', async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const {
            text,
            date,
            embedding
        } = req.body;

        const updatedNotes = await pool.query(
            'UPDATE notes SET text = $1, date = $2, embedding = $3 WHERE id = $4 RETURNING *',
            [text, date, embedding, id]
        );

        res.json(updatedNotes.rows);
    } catch (err) {
        console.error(err.message);
    }
});

// Delete note
app.delete('/notes/:id', async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const restOfNotes = await pool.query('DELETE FROM notes WHERE id = $1 RETURNING *', [id]);
        res.json(restOfNotes.rows);
    } catch (err) {
        console.error(err.message);
    }
});

app.listen(5001, () => {
    console.log('Server listening on port 5001');
});
