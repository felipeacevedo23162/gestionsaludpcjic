import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriasClinicas } from './historias-clinicas';

describe('HistoriasClinicas', () => {
  let component: HistoriasClinicas;
  let fixture: ComponentFixture<HistoriasClinicas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoriasClinicas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoriasClinicas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
