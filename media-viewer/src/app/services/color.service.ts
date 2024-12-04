import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ColorPalette } from '../models/color.model';
import { ColorPaletteService } from './color-palette.service';

@Injectable({
  providedIn: 'root',
})
export class ColorService {
  private currentPaletteSubject = new BehaviorSubject<ColorPalette | null>(
    null
  );
  private currentColorSubject = new BehaviorSubject<string>('black');

  constructor(private colorPaletteService: ColorPaletteService) {}

  /**
   * Observable for the current palette.
   */
  get currentPalette$() {
    return this.currentPaletteSubject.asObservable();
  }

  /**
   * Observable for the current color.
   */
  get currentColor$() {
    return this.currentColorSubject.asObservable();
  }

  /**
   * Set the current palette by its ID.
   * @param paletteId The ID of the palette to set as current.
   */
  selectPalette(paletteId: number): void {
    this.colorPaletteService
      .fetchColorPaletteById(paletteId)
      .subscribe((palette) => {
        if (palette) {
          this.currentPaletteSubject.next(palette);
          this.currentColorSubject.next(palette.colors[0] || 'black'); // Default to the first color
        } else {
          console.error(`Palette with ID ${paletteId} not found.`);
        }
      });
  }

  /**
   * Select a specific color directly.
   * @param color The color to select.
   */
  selectColor(color: string): void {
    const currentPalette = this.currentPaletteSubject.getValue();
    if (currentPalette && currentPalette.colors.includes(color)) {
      this.currentColorSubject.next(color);
    } else {
      console.error('Selected color not in the current palette.');
    }
  }

  /**
   * Get the next color in the palette and advance the index.
   * Loops back to the start when the end is reached.
   */
  getNextColor(): string {
    const currentPalette = this.currentPaletteSubject.getValue();
    if (currentPalette && currentPalette.colors.length > 0) {
      const currentColor = this.currentColorSubject.getValue();
      const currentIndex = currentPalette.colors.indexOf(currentColor);
      const nextIndex = (currentIndex + 1) % currentPalette.colors.length;
      this.currentColorSubject.next(currentPalette.colors[nextIndex]);
    } else {
      console.error('No palette selected or palette is empty.');
    }
    return this.currentColorSubject.getValue();
  }

  /**
   * Get a random color from the current palette.
   */
  getRandomColor(): string {
    const currentPalette = this.currentPaletteSubject.getValue();
    if (currentPalette && currentPalette.colors.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * currentPalette.colors.length
      );
      this.currentColorSubject.next(currentPalette.colors[randomIndex]);
    } else {
      console.error('No palette selected or palette is empty.');
    }
    return this.currentColorSubject.getValue();
  }
}
