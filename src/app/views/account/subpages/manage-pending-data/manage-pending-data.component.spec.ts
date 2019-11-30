import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagePendingDataComponent } from './manage-pending-data.component';

describe('ManagePendingDataComponent', () => {
  let component: ManagePendingDataComponent;
  let fixture: ComponentFixture<ManagePendingDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManagePendingDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManagePendingDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
