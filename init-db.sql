-- Tags table for categorization
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    tag_group TEXT NOT NULL,
    color TEXT NOT NULL,
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
CREATE TABLE analytics (
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

-- Sample data for tags
INSERT INTO tags (name, tag_group, color) VALUES
('weird', 'funk', '#6e40aa'),
('funky', 'funk', '#7d3faf'),
('modern', 'age', '#b7e64c'),
('classical', 'age', '#75f65a'),
('loud', 'volume', '#19cdbc'),
('quiet', 'volume', '#1bc2c7');

-- Sample data for tags
INSERT INTO colors (name,  color_palette) VALUES
('cubehelix', '#000000, #040104, #080308, #0c050d, #0f0612, #120817, #140a1c, #160d21, #180f26, #19122b, #1a1530, #1a1835, #1b1c39, #1a1f3d, #1a2341, #1a2744, #192b47, #182f4a, #17344b, #17384d, #163d4e, #15414e, #15464e, #154a4e, #154f4d, #16534c, #17574a, #185b48, #1a5f46, #1c6244, #1f6642, #22693f, #266c3c, #2a6f3a, #2f7137, #347335, #397533, #407632, #467830, #4d792f, #54792f, #5b7a2f, #637a2f, #6b7b31, #737b32, #7a7a35, #827a37, #8a7a3b, #927a3f, #997944, #a07949, #a7794f, #ad7955, #b3795c, #b97963, #be796a, #c37a72, #c77b7a, #ca7c82, #cd7d8a, #d07e93, #d2809b, #d382a3, #d485ab, #d487b3, #d48aba, #d48dc1, #d391c8, #d294ce, #d198d4, #cf9cda, #cea1df, #cca5e3, #caaae7, #c9aeea, #c7b3ed, #c5b8ef, #c4bcf1, #c3c1f2, #c2c6f3, #c1caf3, #c1cef3, #c2d3f3, #c2d7f3, #c3dbf2, #c5def2, #c7e2f1, #c9e5f0, #cce8f0, #cfebef, #d2eeef, #d6f0ef, #daf2ef, #def4ef, #e3f6f0, #e8f8f2, #ecf9f3, #f1fbf6, #f6fcf8, #fafefb'),
('turbo', '#23171b, #2d1d3a, #362356, #3d296e, #422f85, #463699, #493caa, #4a43ba, #4b4ac7, #4b51d3, #4a58dd, #485fe5, #4666eb, #436df1, #4174f4, #3e7bf7, #3b82f8, #3889f9, #3590f8, #3296f7, #2f9df5, #2da4f2, #2aaaef, #29b0eb, #27b6e6, #26bce1, #25c2dc, #25c7d6, #25cdd0, #26d2ca, #27d7c4, #29dbbd, #2be0b7, #2de4b0, #31e8aa, #34eba3, #38ee9d, #3df196, #42f490, #47f68a, #4df884, #53fa7e, #59fb78, #60fc72, #67fd6d, #6efe68, #76fe63, #7dfd5e, #85fd59, #8dfc55, #95fb51, #9cf94d, #a4f749, #acf545, #b4f242, #bbf03f, #c3ec3c, #cae93a, #d1e537, #d8e135, #dedd32, #e4d830, #ead32e, #efce2d, #f4c92b, #f8c32a, #fcbd28, #ffb727, #ffb125, #ffab24, #ffa423, #ff9e22, #ff9721, #ff9020, #ff891e, #ff821d, #ff7b1c, #ff741b, #fd6d1a, #fa6619, #f65f18, #f15816, #ec5115, #e74a13, #e14412, #db3d11, #d5370f, #ce310d, #c72c0c, #c1260a, #ba2208, #b41d07, #ad1905, #a71503, #a21202, #9d1000, #980e00, #950c00, #920c00, #900c00'),
('viridis', '#440154, #450457, #46085c, #460b5e, #471063, #471365, #481769, #481a6c, #481d6f, #482173, #482475, #482878, #472a7a, #472e7c, #46307e, #463480, #453781, #443a83, #433e85, #424086, #414487, #404688, #3e4989, #3e4c8a, #3c4f8a, #3b528b, #3a548c, #38588c, #375a8c, #365d8d, #355f8d, #33628d, #32648e, #31678e, #306a8e, #2f6c8e, #2e6f8e, #2d718e, #2c738e, #2b758e, #2a788e, #297a8e, #287d8e, #27808e, #26828e, #25848e, #24868e, #23898e, #228b8d, #218e8d, #21918c, #20928c, #1f958b, #1f978b, #1f9a8a, #1e9c89, #1f9f88, #1fa188, #20a386, #21a685, #22a884, #25ab82, #26ad81, #29af7f, #2cb17e, #2fb47c, #32b67a, #37b878, #3bbb75, #3fbc73, #44bf70, #48c16e, #4ec36b, #52c569, #58c765, #5ec962, #63cb5f, #69cd5b, #6ece58, #75d054, #7ad151, #81d34d, #86d549, #8ed645, #95d840, #9bd93c, #a2da37, #a8db34, #b0dd2f, #b5de2b, #bddf26, #c2df23, #cae11f, #d2e21b, #d8e219, #dfe318, #e5e419, #ece51b, #f1e51d, #f8e621'),
('cividis', '#002051, #002255, #002459, #00265c, #00275f, #002962, #012b64, #032d66, #052e68, #073069, #0a326a, #0d346b, #10366c, #13376d, #16396d, #193b6d, #1d3d6e, #203f6e, #24406e, #27426e, #2b446e, #2e466e, #32486e, #35496e, #394b6e, #3c4d6e, #404f6e, #43516d, #46536d, #49546d, #4d566d, #50586e, #535a6e, #565c6e, #595e6e, #5c5f6e, #5e616e, #61636f, #64656f, #66676f, #696970, #6b6b70, #6e6c71, #706e71, #727072, #747272, #777473, #797673, #7b7874, #7d7a74, #7f7c75, #817d75, #837f76, #858176, #888377, #8a8577, #8c8777, #8e8978, #908b78, #928d78, #948f78, #979178, #999378, #9b9578, #9d9778, #a09978, #a29b78, #a59e77, #a7a077, #aaa276, #ada476, #afa675, #b2a874, #b5aa73, #b8ac72, #bbaf71, #beb170, #c1b36e, #c4b56d, #c7b86b, #caba6a, #cebc68, #d1be66, #d4c164, #d7c363, #dac561, #dec85f, #e1ca5d, #e4cc5a, #e7cf58, #ead156, #ecd454, #efd652, #f2d850, #f4db4e, #f6dd4c, #f8e04b, #fae249, #fbe548, #fce746'),
('warm', '#6e40aa, #7240ab, #753fad, #793fae, #7d3faf, #813eb0, #863eb1, #8a3eb2, #8e3eb2, #923db3, #963db3, #9a3db3, #9e3db3, #a23db3, #a73cb3, #ab3cb2, #af3cb2, #b33cb1, #b73cb1, #bb3cb0, #bf3caf, #c33dad, #c73dac, #cb3dab, #cf3da9, #d23ea7, #d63ea6, #d93fa4, #dd3fa2, #e040a0, #e4419d, #e7419b, #ea4299, #ed4396, #f04494, #f24591, #f5468e, #f8478b, #fa4988, #fc4a86, #fe4b83, #ff4d80, #ff4e7c, #ff5079, #ff5276, #ff5473, #ff5670, #ff586d, #ff5a6a, #ff5c66, #ff5e63, #ff6060, #ff635d, #ff655a, #ff6757, #ff6a54, #ff6d51, #ff6f4e, #ff724c, #ff7549, #ff7847, #ff7a44, #ff7d42, #ff803f, #ff833d, #ff873b, #ff8a39, #ff8d38, #ff9036, #fd9334, #fb9633, #f99a32, #f69d31, #f4a030, #f2a42f, #efa72f, #edaa2e, #eaad2e, #e7b12e, #e5b42e, #e2b72f, #dfbb2f, #dcbe30, #dac131, #d7c432, #d4c733, #d1ca34, #cecd36, #ccd038, #c9d33a, #c6d63c, #c4d93e, #c1dc41, #bfdf43, #bce146, #bae449, #b7e64c, #b5e950, #b3eb53, #b1ee57'),
('cool', '#6e40aa, #6d42ad, #6c43b1, #6b45b4, #6947b7, #6849ba, #674bbd, #654ec0, #6450c3, #6252c5, #6054c8, #5f57ca, #5d59cd, #5b5ccf, #595ed1, #5761d3, #5563d5, #5366d7, #5169d9, #4f6cda, #4c6edb, #4a71dd, #4874de, #4677df, #437ae0, #417de0, #3f80e1, #3d83e1, #3a86e1, #3889e1, #368ce1, #348fe1, #3292e1, #3095e0, #2e98df, #2c9cdf, #2a9fde, #28a2dc, #27a5db, #25a8da, #23abd8, #22aed6, #21b1d5, #1fb4d3, #1eb7d1, #1dbace, #1cbccc, #1bbfca, #1bc2c7, #1ac5c5, #1ac7c2, #19cabf, #19cdbc, #19cfb9, #19d1b6, #1ad4b3, #1ad6b0, #1bd8ad, #1bdbaa, #1cdda6, #1ddfa3, #1ee1a0, #20e29c, #21e499, #23e696, #25e892, #27e98f, #29eb8c, #2bec89, #2eed85, #30ef82, #33f07f, #36f17c, #39f279, #3cf276, #40f373, #43f471, #47f56e, #4af56c, #4ef669, #52f667, #56f665, #5af663, #5ff761, #63f75f, #67f75e, #6cf65c, #71f65b, #75f65a, #7af659, #7ff658, #83f557, #88f557, #8df457, #92f457, #97f357, #9cf357, #a1f258, #a6f159, #aaf059'),
('rainbow', '#6e40aa, #753fad, #7d3faf, #863eb1, #8e3eb2, #963db3, #9e3db3, #a73cb3, #af3cb2, #b73cb1, #bf3caf, #c73dac, #cf3da9, #d63ea6, #dd3fa2, #e4419d, #ea4299, #f04494, #f5468e, #fa4988, #fe4b83, #ff4e7c, #ff5276, #ff5670, #ff5a6a, #ff5e63, #ff635d, #ff6757, #ff6d51, #ff724c, #ff7847, #ff7d42, #ff833d, #ff8a39, #ff9036, #fb9633, #f69d31, #f2a42f, #edaa2e, #e7b12e, #e2b72f, #dcbe30, #d7c432, #d1ca34, #ccd038, #c6d63c, #c1dc41, #bce146, #b7e64c, #b3eb53, #aff05b, #a6f159, #9cf357, #92f457, #88f557, #7ff658, #75f65a, #6cf65c, #63f75f, #5af663, #52f667, #4af56c, #43f471, #3cf276, #36f17c, #30ef82, #2bec89, #27e98f, #23e696, #20e29c, #1ddfa3, #1bdbaa, #1ad6b0, #19d1b6, #19cdbc, #1ac7c2, #1bc2c7, #1cbccc, #1eb7d1, #21b1d5, #23abd8, #27a5db, #2a9fde, #2e98df, #3292e1, #368ce1, #3a86e1, #3f80e1, #437ae0, #4874de, #4c6edb, #5169d9, #5563d5, #595ed1, #5d59cd, #6054c8, #6450c3, #674bbd, #6947b7, #6c43b1'),
('magma', '#000004, #010106, #02020b, #03030f, #050416, #06051a, #090720, #0b0924, #0e0b2b, #120d31, #140e36, #180f3d, #1a1042, #1e1149, #21114e, #251255, #29115a, #2d1161, #331067, #36106b, #3b0f70, #3f0f72, #440f76, #471078, #4c117a, #51127c, #54137d, #59157e, #5c167f, #601880, #641a80, #681c81, #6b1d81, #701f81, #752181, #782281, #7c2382, #802582, #842681, #882781, #8c2981, #902a81, #942c80, #992d80, #9c2e7f, #a1307e, #a5317e, #aa337d, #ad347c, #b2357b, #b73779, #ba3878, #bf3a77, #c23b75, #c73d73, #ca3e72, #cf4070, #d2426f, #d6456c, #db476a, #de4968, #e24d66, #e44f64, #e85362, #ea5661, #ed5a5f, #ef5d5e, #f2625d, #f4675c, #f56b5c, #f7705c, #f8745c, #f9795d, #fa7d5e, #fb835f, #fc8961, #fc8c63, #fd9266, #fd9668, #fd9b6b, #fe9f6d, #fea571, #fea973, #feae77, #feb47b, #feb77e, #febd82, #fec185, #fec68a, #feca8d, #fecf92, #fed395, #fed89a, #fddea0, #fde2a3, #fde7a9, #fdebac, #fcf0b2, #fcf4b6, #fcf9bb');
