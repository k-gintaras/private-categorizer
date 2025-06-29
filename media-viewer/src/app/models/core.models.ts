interface MediaFile extends FileSystemEntry {
  type: 'file';
  subtype: 'video' | 'audio' | 'image' | 'text';
}
