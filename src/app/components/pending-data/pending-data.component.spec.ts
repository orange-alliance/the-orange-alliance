import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingDataComponent } from './pending-data.component';

describe('PendingDataComponent', () => {
  let component: PendingDataComponent;
  let fixture: ComponentFixture<PendingDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PendingDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
