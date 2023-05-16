const express = require('express');
const cors = require('cors');
const app = express();
const pool = require('./db');
const {
    Configuration,
    OpenAIApi
} = require('openai');

const formatDate = (date) => {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString("default", { month: "short" });
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${day} ${month} ${year}, ${formattedHours}:${formattedMinutes} ${ampm}`;
};

// Middleware
app.use(cors());
app.use(express.json());

const COSINE_SIMILARITY_THRESHOLD = 0.8;

const configuration = new Configuration({
    apiKey: "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",
});
const openai = new OpenAIApi(configuration);

const createEmbedding = async (text) => {
    const result = await openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: text,
    })


    return result.data.data[0].embedding;
}

//  TODO: 
// - Add date calculating
// - Fix date format (returning as string)

// Routes

// Set new note
app.post('/notes', async (req, res) => {
    try {
        const {
            text,
            date,
        } = req.body;

        const embedding = await createEmbedding(text);

        const newNote = await pool.query(
            'INSERT INTO notes (embedding, text, date) VALUES($1::numeric[], $2, $3) RETURNING *',
            [embedding, text, date]
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
app.get('/notes/search', async (req, res) => {
    try {
        const { searchValue } = req.query;

        if (!searchValue) {
            return res.json({
                error: 'No search value provided'
            });
        }

        const embedding = await createEmbedding(searchValue);

        const result = await pool.query(
            `SELECT text, date, id 
            FROM notes 
            WHERE 1 - (embedding <=> $1::numeric[]::vector(1536)) >= $2;`,
            [embedding, COSINE_SIMILARITY_THRESHOLD]
        );

        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            temperature: 0.7,
            messages: [
                {
                    role: "system",
                    content:
                        "You need to give a human-like answer for search request based on given notes. If notes doesn't includes right answer or not enough information, say 'I don't know'. Use only 1-5 sentences in answer.",
                },
                {
                    role: "user",
                    content: `Question: Adam's birthday? Notes: 1. Date: 9 Oct 2023, 2:00 PM Text: Mom's birthday 6th may 2. Date: 9 Oct 2023, 2:10 PM Text: Happy Birthday to you song need to download 3. Date: 2 Oct 2023, 2:00 PM Text: Adam's Birthday: 04/07/1990`,
                },
                {
                    role: "assistant",
                    content: "Adam's birthday is on 4th July",
                },

                {
                    role: "user",
                    content: `Question: Where I was 9th October? Notes: 1. Date: 9 Oct 2023, 2:00 PM Text: "Dark Knight" is amazing movie! 2. Date: 9 May 2023, 2:10 PM Text: Bacca coffee is amazing place, need to return soon 3. Date: 2 Oct 2023, 2:00 PM Text: Adam's Birthday: 04/07/1990`,
                },
                {
                    role: "assistant",
                    content: "You were in cinema watching 'Dark Knight' movie",
                },
                {
                    role: "user",
                    content: `Question: ${searchValue} Notes: ${result.rows
                        .map((note, index) => `${index + 1}. Date: ${formatDate(+note.date)} Text: ${note.text}`)
                        .join(" ")}`,
                },
            ],
        });

        res.json({ posts: result.rows, aiResponse: completion.data.choices[0].message?.content });
    } catch (err) {
        res.json({
            error: err.message
        });
        console.error(err.message);
    }
});

// Get all notes
app.get('/notes', async (req, res) => {
    try {
        const allNotes = await pool.query('SELECT * FROM notes');
        res.json(allNotes.rows);
    } catch (err) {
        res.json({
            error: err.message
        });
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
        } = req.body;

        const embedding = await createEmbedding(text);

        const updatedNotes = await pool.query(
            'UPDATE notes SET text = $1, date = $2, embedding = $3::numeric[]::vector(1536) WHERE id = $4 RETURNING *',
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
app.delete('/notes/:id', async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const restOfNotes = await pool.query('DELETE FROM notes WHERE id = $1 RETURNING *', [id]);
        res.json(restOfNotes.rows);
    } catch (err) {
        res.json({
            error: err.message
        });
        console.error(err.message);
    }
});

app.listen(5001, () => {
    console.log('Server listening on port 5001');
});
