import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalInicialComponent } from './modal-inicial.component';

describe('ModalInicialComponent', () => {
  let component: ModalInicialComponent;
  let fixture: ComponentFixture<ModalInicialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalInicialComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalInicialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
