import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NextRandomComponent } from './next-random.component';

describe('NextRandomComponent', () => {
  let component: NextRandomComponent;
  let fixture: ComponentFixture<NextRandomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NextRandomComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NextRandomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
