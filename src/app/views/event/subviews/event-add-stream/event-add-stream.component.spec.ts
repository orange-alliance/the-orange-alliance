import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EventAddStreamComponent } from './event-add-stream.component';

describe('EventAddStreamComponent', () => {
  let component: EventAddStreamComponent;
  let fixture: ComponentFixture<EventAddStreamComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventAddStreamComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventAddStreamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
