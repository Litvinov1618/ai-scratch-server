const openai = require('./openai');

const createEmbedding = async (text) => {
    const result = await openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: text,
    });

    return result.data.data[0].embedding;
};

module.exports = createEmbedding;