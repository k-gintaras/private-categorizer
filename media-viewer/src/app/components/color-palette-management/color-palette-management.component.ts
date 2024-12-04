import { Component } from '@angular/core';
import { ColorPalette } from '../../models/color.model';
import { ColorPaletteService } from '../../services/color-palette.service';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-color-palette-management',
  imports: [NgFor, FormsModule],
  templateUrl: './color-palette-management.component.html',
  styleUrl: './color-palette-management.component.scss',
})
export class ColorPaletteManagementComponent {
  colorPalettes: ColorPalette[] = [];
  newPaletteName: string = '';
  newPaletteColors: string[] = [];

  constructor(private colorService: ColorPaletteService) {}

  ngOnInit(): void {
    this.loadColorPalettes();
  }

  loadColorPalettes(): void {
    this.colorService.getColorPalettes().subscribe((palettes) => {
      this.colorPalettes = palettes;
    });

    // Fetch from server if cache is empty
    this.colorService.fetchColorPalettes().subscribe();
  }

  addPalette(): void {
    if (!this.newPaletteName || this.newPaletteColors.length === 0) {
      alert('Please provide a name and colors for the palette.');
      return;
    }

    this.colorService
      .addColorPalette(this.newPaletteName, this.newPaletteColors)
      .subscribe(() => {
        this.newPaletteName = '';
        this.newPaletteColors = [];
        this.loadColorPalettes();
      });
  }

  deletePalette(id: number): void {
    this.colorService.deleteColorPalette(id).subscribe(() => {
      this.loadColorPalettes();
    });
  }
}
