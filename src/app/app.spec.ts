import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';

@Component({ template: '' })
class PantallaVacia {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: '', component: PantallaVacia },
          { path: 'login', component: PantallaVacia },
          { path: 'registro', component: PantallaVacia },
          { path: 'ferias', component: PantallaVacia },
        ]),
        provideHttpClient(),
      ],
    }).compileComponents();
  });

  async function navegarA(url: string): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('se crea', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('tiene navbar, contenido y footer', async () => {
    const html = await navegarA('/ferias');
    expect(html.querySelector('app-navbar')).toBeTruthy();
    expect(html.querySelector('router-outlet')).toBeTruthy();
    expect(html.querySelector('app-footer')).toBeTruthy();
  });

  it('no muestra el navbar en el login (aunque tenga ?volver=)', async () => {
    const html = await navegarA('/login?volver=%2Fperfil');
    expect(html.querySelector('app-navbar')).toBeNull();
    expect(html.querySelector('app-footer')).toBeTruthy();
  });

  it('no muestra el navbar en el registro', async () => {
    const html = await navegarA('/registro');
    expect(html.querySelector('app-navbar')).toBeNull();
  });
});