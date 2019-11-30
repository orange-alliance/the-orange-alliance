import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SendStreamKeyComponent } from './send-stream-key.component';

describe('SendStreamKeyComponent', () => {
  let component: SendStreamKeyComponent;
  let fixture: ComponentFixture<SendStreamKeyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SendStreamKeyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SendStreamKeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
