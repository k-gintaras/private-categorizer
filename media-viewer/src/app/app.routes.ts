import { Routes } from '@angular/router';
import { TagManagerComponent } from './features/tags/tag-manager/tag-manager.component';
import { ViewVideosComponent } from './features/view-videos/view-videos.component';

export const routes: Routes = [
  { path: 'tags', component: TagManagerComponent },
  { path: 'videos', component: ViewVideosComponent },
];
