// Represents a color palette entry
export interface ColorPalette {
  id: number; // Primary key in the colors table
  name: string; // Name of the color palette
  colors: string[]; // Array of hex color codes (JSON-encoded in the DB)
  createdAt: string; // Timestamp when the palette was created
}
