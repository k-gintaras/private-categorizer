import { Component, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgIf, NgFor } from '@angular/common';
import { ColorService } from '../../../services/color.service';
import { ColorPalette } from '../../../models/color.model';
import { ColorPickerComponent } from '../../../components/color-picker/color-picker.component';
import { GroupedTags, TagService } from '../../../services/tag.service';
import { Tag } from '../../../models/tag.model';
import { ColorPaletteService } from 'src/app/services/color-palette.service';

@Component({
  selector: 'app-tag-manager',
  standalone: true,
  imports: [
    NgIf,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    NgFor,
  ],
  templateUrl: './tag-manager.component.html',
  styleUrls: ['./tag-manager.component.scss'],
})
export class TagManagerComponent implements OnInit {
  tags: MatTableDataSource<Tag> = new MatTableDataSource<Tag>([]); // Explicit type
  displayedColumns: string[] = ['name', 'group', 'actions'];
  form: {
    id: number | null;
    name: string;
    tag_group: string;
    color: string;
  } = {
    id: null,
    name: '',
    tag_group: '',
    color: '#ffffff',
  };
  editingTag: boolean = false;

  // Palettes and colors for color picker
  palettes: ColorPalette[] = [];
  selectedColor: string = '#ffffff';
  colorPalette: string[] = []; // Colors fetched from palette ID 7

  groupColorMap: Map<string, string> = new Map(); // Group colors
  tagColorMap: Map<number, string> = new Map(); // Tag colors
  groupedTags: GroupedTags = {};

  constructor(
    private colorService: ColorService,
    private tagService: TagService,
    private colorPaletteService: ColorPaletteService
  ) {}

  ngOnInit(): void {
    this.loadTags();
  }

  loadColorPalette(): void {
    this.colorPaletteService.fetchColorPaletteById(7).subscribe((palette) => {
      console.log('Palette:', palette);
      if (palette?.colors) {
        this.colorPalette = palette.colors;
        this.setColors();
      } else {
        console.error('No colors found in the palette.');
      }
    });
  }

  setColors(): void {
    if (
      this.colorPalette.length === 0 ||
      Object.keys(this.groupedTags).length === 0
    ) {
      console.warn('Palette or groupedTags not loaded yet.');
      return;
    }

    const allColors = this.colorPalette;
    let globalColorIndex = 0;

    // Assign colors to groups
    // Assign colors to groups
    Object.keys(this.groupedTags).forEach((group, index, groupKeys) => {
      if (!this.groupColorMap.has(group)) {
        // Calculate discrete spacing for groups
        const stepSize = Math.floor(allColors.length / groupKeys.length);
        const groupColorIndex = (index * stepSize) % allColors.length;

        this.groupColorMap.set(group, allColors[groupColorIndex]);
      }
    });

    // Assign colors to tags
    Object.values(this.groupedTags).forEach((tags) => {
      tags.forEach((tag) => {
        if (!this.tagColorMap.has(tag.id)) {
          const tagColorIndex = globalColorIndex % allColors.length;
          this.tagColorMap.set(tag.id, allColors[tagColorIndex]);
          globalColorIndex++;
        }
      });
    });

    console.log('Colors assigned:', {
      groupColorMap: this.groupColorMap,
      tagColorMap: this.tagColorMap,
    });
  }

  /**
   * Get the color for a group or tag.
   */
  getColor(group: string | null, tagId: number): string {
    return (
      this.groupColorMap.get(group || '') ||
      this.tagColorMap.get(tagId) ||
      '#cccccc'
    );
  }
  /**
   * Load tags using the TagService.
   */
  loadTags(): void {
    this.tagService.loadTags();
    this.tagService.tags$.subscribe((groupedTags: GroupedTags) => {
      if (!groupedTags) return;
      this.groupedTags = groupedTags; // this.groupedTags = groupedTags;
      // sadly we get tag_group and not tagGroup
      const tags = Object.values(groupedTags).flat();
      this.tags = new MatTableDataSource<Tag>(tags);
      this.loadColorPalette();
    });
  }

  /**
   * Save a new tag or update an existing tag.
   */
  saveTag(): void {
    const tag: Partial<Tag> = {
      id: this.form.id || undefined,
      name: this.form.name,
      tagGroup: this.form.tag_group,
    };

    const request = tag.id
      ? this.tagService.updateTag(tag.id, tag)
      : this.tagService.createTag(tag);

    request.subscribe(() => {
      this.loadTags();
      this.resetForm();

      // Move to the next color after saving
      this.colorService.getNextColor();
    });
  }

  /**
   * Edit an existing tag.
   * @param tag The tag to edit.
   */
  editTag(tag: Tag): void {
    this.form = {
      id: tag.id,
      name: tag.name,
      tag_group: tag.tagGroup || '',
      color: '',
    };
    this.selectedColor = '';
    this.editingTag = true;
  }

  /**
   * Cancel editing and reset the form.
   */
  cancelEdit(): void {
    this.resetForm();
  }

  /**
   * Delete a tag by its ID using the TagService.
   * @param tagId The ID of the tag to delete.
   */
  deleteTag(tagId: number): void {
    this.tagService.deleteTag(tagId).subscribe(() => {
      this.loadTags();
    });
  }

  /**
   * Reset the form to its default state.
   */
  resetForm(): void {
    this.form = {
      id: null,
      name: '',
      tag_group: '',
      color: '#ffffff',
    };
    this.selectedColor = '#ffffff';
    this.editingTag = false;
  }
}
