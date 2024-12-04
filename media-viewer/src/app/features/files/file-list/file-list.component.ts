import { Component, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';
import { SelectedFileService } from '../../../services/selected-file.service';
import { FileInfo } from '../../../models/file.model';
import { FileCacheService } from '../../../services/file-cache.service';

@Component({
  selector: 'app-file-list',
  standalone: true,
  imports: [NgFor],
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss'],
})
export class FileListComponent implements OnInit {
  files: FileInfo[] = [];

  constructor(
    private fileService: FileCacheService,
    private selectedFileService: SelectedFileService
  ) {}

  ngOnInit(): void {
    this.loadFiles();
  }

  /**
   * Fetches the list of files using the FileService.
   */
  private loadFiles(): void {
    this.fileService.fetchFiles().subscribe({
      next: (files) => {
        this.files = files;
      },
      error: (error) => {
        console.error('Error fetching files:', error);
      },
    });
  }

  /**
   * Selects a file using SelectedFileService.
   */
  selectFile(f: FileInfo): void {
    this.selectedFileService.selectFile(f.id);
  }

  getFileName(f: FileInfo) {
    return this.fileService.getFileName(f.path);
  }
}
