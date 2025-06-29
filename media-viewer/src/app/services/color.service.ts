import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ColorPaletteService } from './color-palette.service';
import { ParsedColorPalette } from '../models'; // Use frontend-friendly parsed type

@Injectable({
  providedIn: 'root',
})
export class ColorService {
  private currentPaletteSubject =
    new BehaviorSubject<ParsedColorPalette | null>(null);
  private currentColorSubject = new BehaviorSubject<string>('black');

  constructor(private colorPaletteService: ColorPaletteService) {}

  get currentPalette$() {
    return this.currentPaletteSubject.asObservable();
  }

  get currentColor$() {
    return this.currentColorSubject.asObservable();
  }

  selectPalette(paletteId: number): void {
    this.colorPaletteService.fetchColorPaletteById(paletteId).subscribe({
      next: (palette) => {
        if (palette && palette.colors.length > 0) {
          this.currentPaletteSubject.next(palette);
          this.currentColorSubject.next(palette.colors[0]);
        } else {
          console.error(`Palette with ID ${paletteId} not found or empty.`);
          this.currentPaletteSubject.next(null);
          this.currentColorSubject.next('black');
        }
      },
      error: (err) => {
        console.error('Failed to fetch palette:', err);
        this.currentPaletteSubject.next(null);
        this.currentColorSubject.next('black');
      },
    });
  }

  selectColor(color: string): void {
    const currentPalette = this.currentPaletteSubject.getValue();
    if (currentPalette?.colors.includes(color)) {
      this.currentColorSubject.next(color);
    } else {
      console.error('Selected color not in the current palette.');
    }
  }

  getNextColor(): string {
    const currentPalette = this.currentPaletteSubject.getValue();
    if (currentPalette?.colors.length) {
      const currentColor = this.currentColorSubject.getValue();
      const idx = currentPalette.colors.indexOf(currentColor);
      const nextIdx =
        idx < 0 || idx === currentPalette.colors.length - 1 ? 0 : idx + 1;
      const nextColor = currentPalette.colors[nextIdx];
      this.currentColorSubject.next(nextColor);
      return nextColor;
    }
    console.error('No palette selected or palette empty.');
    return 'black';
  }

  getRandomColor(): string {
    const currentPalette = this.currentPaletteSubject.getValue();
    if (currentPalette?.colors.length) {
      const randomIndex = Math.floor(
        Math.random() * currentPalette.colors.length
      );
      const randomColor = currentPalette.colors[randomIndex];
      this.currentColorSubject.next(randomColor);
      return randomColor;
    }
    console.error('No palette selected or palette empty.');
    return 'black';
  }
}
