const handleError = (err, res) => {
    res.json({
        error: err.message
    });
    console.error(err.message);
};

module.exports = handleError;