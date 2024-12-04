import { Component, OnInit } from '@angular/core';
import { ColorService } from '../../services/color.service';
import { ColorPaletteService } from '../../services/color-palette.service';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ColorPalette } from '../../models/color.model';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss'],
})
export class ColorPickerComponent implements OnInit {
  availablePalettes: ColorPalette[] = [];
  selectedPaletteId: number | null = null;
  selectedPalette: ColorPalette | null = null;
  currentColor: string | null = null;

  constructor(
    private colorService: ColorService,
    private colorPaletteService: ColorPaletteService
  ) {}

  ngOnInit(): void {
    this.loadPalettes();
    this.subscribeToColorChanges();
  }

  /**
   * Load palettes from the ColorPaletteService and initialize the first palette.
   */
  private loadPalettes(): void {
    this.colorPaletteService.fetchColorPalettes().subscribe((palettes) => {
      this.availablePalettes = palettes;

      if (palettes.length > 0) {
        this.selectedPaletteId = palettes[0].id;
        this.updateSelectedPalette();
      }
    });
  }

  /**
   * Subscribe to changes in the current color from the ColorService.
   */
  private subscribeToColorChanges(): void {
    this.colorService.currentColor$.subscribe((color) => {
      this.currentColor = color;
    });
  }

  /**
   * Update the selected palette based on the selected ID.
   */
  private updateSelectedPalette(): void {
    console.log('Available Palettes:', this.availablePalettes);
    console.log('Selected Palette ID:', this.selectedPaletteId);

    this.selectedPalette =
      this.availablePalettes.find(
        (palette) => palette.id === Number(this.selectedPaletteId) // Convert to number
      ) || null;

    if (this.selectedPalette) {
      console.log('Selected Palette:', this.selectedPalette);
      this.colorService.selectPalette(this.selectedPalette.id);
    } else {
      console.warn('Selected palette not found.');
    }
  }

  /**
   * Handle palette selection changes from the dropdown.
   */
  onPaletteChange(): void {
    this.updateSelectedPalette();
  }

  /**
   * Select a specific color from the current palette.
   * @param color The color to select.
   */
  selectColor(color: string): void {
    this.colorService.selectColor(color);
  }

  /**
   * Move to the next color in the palette.
   */
  nextColor(): void {
    this.currentColor = this.colorService.getNextColor();
  }

  /**
   * Select a random color from the current palette.
   */
  randomColor(): void {
    this.currentColor = this.colorService.getRandomColor();
  }
}
