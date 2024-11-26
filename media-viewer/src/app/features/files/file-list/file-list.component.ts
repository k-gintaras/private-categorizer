import { NgFor } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { SelectedFileService } from '../../../services/selected-file.service';

@Component({
  selector: 'app-file-list',
  imports: [NgFor],
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss'], // Corrected from `styleUrl` to `styleUrls`
})
export class FileListComponent {
  files: any[] = [];

  constructor(
    private http: HttpClient,
    private fileTracker: SelectedFileService
  ) {}

  ngOnInit(): void {
    this.fetchFiles();
  }

  fetchFiles(): void {
    this.http.get<any[]>('http://localhost:3000/files').subscribe((data) => {
      this.files = data.filter(
        (f) => f.type === 'file' && this.isSupportedVideo(f.path)
      );
    });
  }

  isSupportedVideo(path: string): boolean {
    return path.indexOf('mp4') > 0;
  }

  selectFile(filePath: string): void {
    this.fileTracker.selectFile(filePath); // Use the service to update the selected file
  }

  getFileName(fullPath: string): string {
    return fullPath.split('/').pop() || fullPath.split('\\').pop() || fullPath;
  }
}
