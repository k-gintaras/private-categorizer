import { Component } from '@angular/core';
import { RandomNextService } from '../../services/random-next.service';
import { SelectedFileService } from '../../services/selected-file.service';
import { FileInfo } from '../../models/file.model';

@Component({
  selector: 'app-next-random',
  imports: [],
  templateUrl: './next-random.component.html',
  styleUrl: './next-random.component.scss',
})
export class NextRandomComponent {
  currentFile: FileInfo | null = null;

  constructor(
    private randomNextService: RandomNextService,
    private selectedFileService: SelectedFileService
  ) {}

  ngOnInit(): void {
    // Fetch files on initialization
    this.randomNextService.fetchFiles();

    // Subscribe to file selection updates
    this.selectedFileService.selectedFile$.subscribe((file) => {
      this.currentFile = file;
    });
  }

  playNext(): void {
    this.randomNextService.playNextRandom();
  }
}
