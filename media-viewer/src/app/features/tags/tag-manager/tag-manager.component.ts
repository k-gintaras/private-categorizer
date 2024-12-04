import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgIf, NgFor } from '@angular/common';
import { ApiConfigService } from '../../../services/api-config.service';
import { ColorService } from '../../../services/color.service';
import { ColorPalette } from '../../../models/color.model';
import { ColorPaletteService } from '../../../services/color-palette.service';
import { ColorPickerComponent } from '../../../components/color-picker/color-picker.component';

interface Tag {
  id: number;
  name: string;
  tag_group: string;
  color: string;
}

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
    ColorPickerComponent,
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

  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService,
    private colorService: ColorService,
    private colorPaletteService: ColorPaletteService
  ) {}

  ngOnInit(): void {
    this.fetchTags();
    this.fetchColor();
  }

  fetchColor() {
    this.colorService.currentColor$.subscribe((c) => {
      if (!c) return;
      this.selectedColor = c;
    });
  }

  fetchTags(): void {
    const url = this.apiConfig.getApiTagsUrl(); // Use ApiConfigService
    this.http.get<Tag[]>(url).subscribe((data) => {
      this.tags = new MatTableDataSource<Tag>(data); // Initialize with fetched data
    });
  }

  saveTag(): void {
    this.form.color = this.selectedColor; // Use the currently selected color
    const url = this.form.id
      ? `${this.apiConfig.getApiTagsUrl()}/${this.form.id}`
      : this.apiConfig.getApiTagsUrl();

    const request = this.form.id
      ? this.http.put(url, this.form)
      : this.http.post(url, this.form);

    request.subscribe(() => {
      this.fetchTags();
      this.resetSomeForm();

      // Move to the next color after saving
      this.colorService.getNextColor();

      // Ensure the new color is reflected in `selectedColor`
      this.colorService.currentColor$.subscribe((color) => {
        if (color) {
          this.selectedColor = color;
        }
      });
    });
  }

  editTag(tag: Tag): void {
    this.form = { ...tag };
    this.selectedColor = tag.color; // Set the selected color
    this.editingTag = true;
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteTag(tagId: number): void {
    const url = `${this.apiConfig.getApiTagsUrl()}/${tagId}`;
    this.http.delete(url).subscribe(() => {
      this.fetchTags();
    });
  }

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

  resetSomeForm(): void {
    this.form = {
      id: null,
      name: '',
      tag_group: this.form.tag_group,
      color: '#ffffff',
    };
    this.selectedColor = '#ffffff';
    this.editingTag = false;
  }
}
