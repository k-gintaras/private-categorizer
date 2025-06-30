const { indexSingleItem } = require('./index-file');

// Replace your scanDirectory function with:
const scanDirectory = async (dir, parentId = null) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    try {
      const result = await indexSingleItem(db, fullPath, ROOT_DIRECTORY, parentId);

      // If it's a directory, recurse into it
      if (result.type === 'directory') {
        await scanDirectory(fullPath, result.id);
      }
    } catch (error) {
      console.error(`Failed to index ${fullPath}:`, error.message);
    }
  }
};
