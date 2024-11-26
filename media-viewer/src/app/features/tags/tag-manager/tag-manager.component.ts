import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { NgIf } from '@angular/common';

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
    FormsModule,
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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchTags();
  }

  fetchTags(): void {
    this.http.get<Tag[]>('http://localhost:3000/tags').subscribe((data) => {
      this.tags = new MatTableDataSource<Tag>(data); // Initialize with fetched data
    });
  }

  saveTag(): void {
    if (this.editingTag) {
      this.http
        .put(`http://localhost:3000/tags/${this.form.id}`, this.form)
        .subscribe(() => {
          this.fetchTags();
          this.resetForm();
        });
    } else {
      this.http.post('http://localhost:3000/tags', this.form).subscribe(() => {
        this.fetchTags();
        this.resetForm();
      });
    }
  }

  editTag(tag: Tag): void {
    this.form = { ...tag };
    this.editingTag = true;
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteTag(tagId: number): void {
    if (confirm('Are you sure you want to delete this tag?')) {
      this.http.delete(`http://localhost:3000/tags/${tagId}`).subscribe(() => {
        this.fetchTags();
      });
    }
  }

  resetForm(): void {
    this.form = {
      id: null,
      name: '',
      tag_group: '',
      color: '#ffffff',
    };
    this.editingTag = false;
  }
}
