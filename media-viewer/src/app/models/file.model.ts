import { Like, BaseAnalytics } from './analytics.model';
import { Tag } from './tag.model';

export interface FileInfo {
  id: number;
  parentId?: number;
  path: string;
  type: string;
  subtype: 'video' | 'audio' | 'image' | 'text';
  size?: number;
  lastModified?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  tags?: Tag[];
  likes?: Like[];
  analytics?: BaseAnalytics;
  isFull: boolean;
}
