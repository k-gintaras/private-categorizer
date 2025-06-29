-- Tags table for categorization
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    tag_group TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Colors table for predefined color schemes
CREATE TABLE IF NOT EXISTS colors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color_palette TEXT NOT NULL, -- JSON-encoded array of colors
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics 
CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL, -- Foreign key to files table
    file_type TEXT NOT NULL, -- 'video', 'audio', 'image', 'text'
    last_viewed TIMESTAMP DEFAULT NULL, -- Common to all types
    total_watch_time INTEGER DEFAULT 0, -- Common to all types
    view_count INTEGER DEFAULT 0, -- Common to all types
    skips TEXT DEFAULT NULL, -- JSON array for video/audio skips
    scroll_up_count INTEGER DEFAULT NULL, -- For image/text
    scroll_down_count INTEGER DEFAULT NULL, -- For image/text
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL, -- Links to the files table
    timestamp INTEGER NOT NULL, -- Time (in seconds) of the like within the media
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When the like was added
    FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dislikes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL, -- Links to the files table
    timestamp INTEGER NOT NULL, -- Time (in seconds) of the like within the media
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When the like was added
    FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL UNIQUE, -- Links to the files table, ensures one favorite per file
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When the favorite was added
    FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER,
    path TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    subtype TEXT NOT NULL,
    size INTEGER,
    last_modified TIMESTAMP,
    metadata TEXT DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES files (id)
);

-- Optional: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_files_parent_id ON files(parent_id);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);
CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);

-- Junction table to associate files with tags
CREATE TABLE IF NOT EXISTS file_tags (
    file_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE,
    UNIQUE (file_id, tag_id)
);
