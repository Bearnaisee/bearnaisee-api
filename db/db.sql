CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255) DEFAULT NULL,
    description VARCHAR(255) DEFAULT NULL,
    display_name VARCHAR(50),
    location VARCHAR(40) DEFAULT NULL,
    website VARCHAR(40) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    UNIQUE(username),
    UNIQUE(email)
);
CREATE TABLE user_follows_user (
    user_id INT NOT NULL REFERENCES users(id),
    follower_id INT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, follower_id)
);
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    /* Should be lowercased */
    tag VARCHAR(40) NOT NULL,
    UNIQUE(tag)
);
CREATE TABLE languages (
    id SERIAL PRIMARY KEY,
    /* Should be lowercased */
    iso_code VARCHAR(2) NOT NULL,
    UNIQUE(iso_code)
);
INSERT INTO languages (iso_code)
VALUES('en');
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    language_id INT REFERENCES languages(id) DEFAULT 1,
    title VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    cover_image VARCHAR(255),
    public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (slug, user_id)
);
CREATE TABLE recipe_steps (
    id SERIAL PRIMARY KEY,
    recipe_id INT NOT NULL REFERENCES recipes(id),
    step SMALLINT DEFAULT 1,
    optional BOOLEAN DEFAULT FALSE,
    estimated_time INT,
    content TEXT
);
CREATE TABLE recipe_comments (
    id SERIAL PRIMARY KEY,
    recipe_id INT NOT NULL REFERENCES recipes(id),
    user_id INT NOT NULL REFERENCES users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE user_likes_recipe(
    recipe_id INT NOT NULL REFERENCES recipes(id),
    user_id INT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (recipe_id, user_id)
);
CREATE TABLE user_follows_tag (
    user_id INT REFERENCES users(id) NOT NULL,
    tag_id INT REFERENCES tags(id) NOT NULL,
    UNIQUE(user_id, tag_id)
);
CREATE TABLE recipe_has_tags (
    recipe_id INT NOT NULL REFERENCES recipes(id),
    tag_id INT NOT NULL REFERENCES tags(id),
    UNIQUE(recipe_id, tag_id)
);
CREATE TABLE metrics (
    id SERIAL PRIMARY KEY,
    metric VARCHAR(255) NOT NULL,
    UNIQUE(metric)
);
CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    ingredient VARCHAR(255) NOT NULL,
    UNIQUE(ingredient)
);
CREATE TABLE recipe_has_ingredients (
    recipe_id INT NOT NULL REFERENCES recipes(id),
    ingredient_id INT NOT NULL REFERENCES ingredients(id),
    metric_id INT NOT NULL REFERENCES metrics(id),
    amount NUMERIC,
    UNIQUE(recipe_id, ingredient_id, metric_id)
);