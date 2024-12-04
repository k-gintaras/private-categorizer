import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColorPaletteManagementComponent } from './color-palette-management.component';

describe('ColorPaletteManagementComponent', () => {
  let component: ColorPaletteManagementComponent;
  let fixture: ComponentFixture<ColorPaletteManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColorPaletteManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ColorPaletteManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
