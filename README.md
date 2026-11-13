# Red Emprendedora · Frontend

Angular 22 (standalone, signals) contra el backend Spring Boot de Red Emprendedora.

## Cómo correrlo

1. Levantar primero el **backend en `http://localhost:8080`** (las llamadas van a `http://localhost:8080/api`).
2. Desde **PowerShell**, en la carpeta del proyecto:

```powershell
pnpm install
pnpm start
```

3. Abrir `http://localhost:4200/`.

Si hace falta usar el proxy (redirige `/api` a `localhost:8080`, como el ejemplo del profe):

```powershell
pnpm start:proxy
```

Otros comandos:

```powershell
pnpm test    # tests unitarios (Vitest)
pnpm build   # build de producción en dist/
```

> Solo **pnpm**. Se commitean `pnpm-lock.yaml` y `pnpm-workspace.yaml`; nunca `package-lock.json`.

## Estructura

```
src/app/
  core/
    models/        auth, usuario, evento, stand, localidad, page (Page<T> de Spring), api-error
    services/      auth, usuario (+ evento, stand, localidad en la fase 2)
    interceptors/  jwt.interceptor (Bearer), error.interceptor (401 -> logout + /login)
    guards/        auth.guard, rol.guard (data: { roles: ['ORGANIZADOR'] } -> /sin-permisos)
    utils/         api-error.util (leerError: "mensaje" y "errores{campo}")
  shared/
    components/    navbar, footer, tarjeta-feria, badge-estado, modal-confirmacion, paginador, error-campo
    pipes/         rango-fechas
  features/        una carpeta por pantalla, cada una en la carpeta de su dueña
```

## Convención de nombres

Se usa el estilo que genera `ng generate` en Angular 22 (sin sufijo `.component`):

| Qué | Archivo | Clase |
| --- | --- | --- |
| Componente | `login.ts`, `login.html`, `login.css` | `Login` |
| Servicio | `auth.service.ts` | `AuthService` |
| Guard | `auth.guard.ts` | `authGuard` |
| Interceptor | `jwt.interceptor.ts` | `jwtInterceptor` |
| Modelo | `evento.model.ts` | `Evento` |
| Pipe | `rango-fechas.pipe.ts` | `RangoFechasPipe` |
| Test | `<archivo>.spec.ts` | — |

Para crear un componente: `pnpm ng g c shared/components/paginador --skip-tests`.

## Sesión (AuthService)

- `login(credenciales, recordarme)`: `POST /api/auth/login` con `{ email, contrasena }`.
- **Recordarme** tildado guarda la sesión en `localStorage` (sigue logueada al cerrar el navegador, hasta que vence el token, 24 h). Sin tildar, en `sessionStorage`.
- Nunca se guarda la contraseña: solo token, idUsuario, nombre, email, roles y vencimiento.
- Signals: `estaLogueado()`, `usuarioActual()`, `roles()`, `esEmprendedor()`, `esOrganizador()` y el método `tieneRol(rol)`.
- `obtenerToken()` devuelve `null` (y cierra la sesión) si el token venció.

## Errores

```ts
import { leerError } from '../../core/utils/api-error.util';

error: (err) => {
  const { mensaje, errores } = leerError(err);
  this.mensajeError.set(mensaje); // arriba de la acción, con class="alert alert-error"
  this.errores.set(errores);      // para <app-error-campo [errores]="errores()" campo="email" />
}
```

- **401** en cualquier llamada (salvo el login): se cierra la sesión y se va a `/login?volver=<url>`.
- **403**: no se redirige; cada pantalla muestra el mensaje del backend cerca de la acción.

## Reglas de trabajo

- Una rama por persona y PR a `main` revisado por otra integrante. Nada directo a `main`.
- `git add` archivo por archivo (nunca `git add .`). NO SUBRI CREDENCIALES NI `.env`
- Antes de arrancar: `git pull` en `main`, pasar a la rama propia y `git merge main`.
- Después de la fase 1 nadie toca `app.routes.ts` ni `styles.css`; si hace falta un estilo global, se le pide a Canu.
- Colores, fuentes y tamaños solo con las variables y clases de `styles.css`. Íconos: `<span class="icon">event</span>` (Material Symbols Outlined).