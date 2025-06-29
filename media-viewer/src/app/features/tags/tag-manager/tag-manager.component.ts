import { NgIf, NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Tag } from 'src/app/models';
import { TagColorService } from 'src/app/services/helpers/tag-color.service';
import { TagService } from 'src/app/services/tag.service';

@Component({
  selector: 'app-tag-manager',
  standalone: true,
  imports: [
    NgIf,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    NgFor,
  ],
  templateUrl: './tag-manager.component.html',
  styleUrls: ['./tag-manager.component.scss'],
})
export class TagManagerComponent implements OnInit {
  tags = new MatTableDataSource<Tag>([]);
  displayedColumns = ['name', 'group', 'actions'];

  form = {
    id: null as number | null,
    name: '',
    tag_group: '',
    color: '#ffffff',
  };
  editingTag = false;

  constructor(
    private tagColorService: TagColorService,
    private tagService: TagService
  ) {}

  ngOnInit(): void {
    this.tagColorService.load();
    this.tagColorService.tags$.subscribe((groupedTags) => {
      const allTags = Object.values(groupedTags).flat();
      this.tags.data = allTags;
    });
  }

  getTagColor(tag: Tag): string {
    return this.tagColorService.getTagColor(tag);
  }

  getGroupColor(group: string): string {
    return this.tagColorService.getGroupColor(group);
  }

  saveTag(): void {
    const tag = {
      id: this.form.id || undefined,
      name: this.form.name,
      tag_group: this.form.tag_group,
    };
    const request = tag.id
      ? this.tagService.updateTag(tag.id, tag)
      : this.tagService.createTag(tag);
    request.subscribe(() => {
      this.resetForm();
      this.tagColorService.load(); // reload tags & colors
    });
  }

  editTag(tag: Tag): void {
    this.form = {
      id: tag.id,
      name: tag.name,
      tag_group: tag.tag_group || '',
      color: '',
    };
    this.editingTag = true;
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteTag(tagId: number): void {
    this.tagService.deleteTag(tagId).subscribe(() => {
      this.tagColorService.load();
    });
  }

  resetForm(): void {
    this.form = { id: null, name: '', tag_group: '', color: '#ffffff' };
    this.editingTag = false;
  }
}
