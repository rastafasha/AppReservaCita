import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeClinicaComponent } from './home-clinica.component';

describe('HomeClinicaComponent', () => {
  let component: HomeClinicaComponent;
  let fixture: ComponentFixture<HomeClinicaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeClinicaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeClinicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
