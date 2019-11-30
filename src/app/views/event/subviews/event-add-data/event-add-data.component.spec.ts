import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EventAddDataComponent } from './event-add-data.component';

describe('EventAddDataComponent', () => {
  let component: EventAddDataComponent;
  let fixture: ComponentFixture<EventAddDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventAddDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventAddDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
