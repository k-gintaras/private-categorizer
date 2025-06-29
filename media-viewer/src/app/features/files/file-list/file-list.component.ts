import { Component, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';
import { SelectedFileService } from '../../../services/selected-file.service';
import { FileCacheService } from '../../../services/file-cache.service';
import { ParsedFile, getFileName } from '../../../models'; // Updated import

@Component({
  selector: 'app-file-list',
  standalone: true,
  imports: [NgFor],
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss'],
})
export class FileListComponent implements OnInit {
  files: ParsedFile[] = []; // Updated type
  selectedFile: ParsedFile | null = null; // Updated type

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

    this.selectedFileService.selectedFile$.subscribe((selectedFile) => {
      this.selectedFile = selectedFile;
    });
  }

  /**
   * Selects a file using SelectedFileService.
   */
  selectFile(file: ParsedFile): void {
    this.selectedFileService.selectFile(file.id);
  }

  /**
   * Get filename from file path using utility function
   */
  getFileName(file: ParsedFile): string {
    return getFileName(file.path);
  }
}
