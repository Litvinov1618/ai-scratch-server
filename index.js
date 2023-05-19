const express = require('express');
const cors = require('cors');
const app = express();
const notesRoute = require('./routes/Notes');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/notes', notesRoute);

app.listen(5001, () => {
    console.log(`Server host on: http://localhost:5001`);
});
