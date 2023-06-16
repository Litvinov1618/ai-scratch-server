CREATE DATABASE notes;

CREATE TABLE notes(
    id SERIAL PRIMARY KEY,
    text TEXT,
    date BIGINT,
    EMBEDDING VECTOR(1536)
);

CREATE TABLE user_settings (
  notes_similarity_threshold FLOAT CHECK (notes_similarity_threshold >= 0 AND notes_similarity_threshold <= 1),
  ai_response_temperature FLOAT CHECK (ai_response_temperature >= 0 AND ai_response_temperature <= 1),
  show_ai_response BOOLEAN,
  email VARCHAR(255) UNIQUE
);
