import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SelectedFileService {
  private selectedFileSubject: BehaviorSubject<string | null> =
    new BehaviorSubject<string | null>(null);

  // Expose the selected file as an observable
  selectedFile$: Observable<string | null> =
    this.selectedFileSubject.asObservable();

  constructor() {}

  // Method to update the selected file
  selectFile(filePath: string | null): void {
    this.selectedFileSubject.next(filePath);
  }

  // Method to get the current selected file (synchronously)
  getSelectedFile(): string | null {
    return this.selectedFileSubject.value;
  }
}
