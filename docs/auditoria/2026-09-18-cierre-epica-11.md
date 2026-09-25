# Cierre de la Épica 11 — verificación de las correcciones

**Fecha:** 18-09-2026 · **Informe de origen:** [`2026-09-18-auditoria-app-alumno.md`](2026-09-18-auditoria-app-alumno.md)
**Alcance acordado:** los 9 bloqueantes + toda la categoría de accesibilidad + el paso de
contraseña nueva. Los 21 hallazgos restantes quedan como HU-11.6, documentados y sin ejecutar.

---

## 1. Los cinco bloqueantes del gate

| #   | Hallazgo  | Estado | Cómo se verificó                                                                                                             |
| --- | --------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | PR-1      | ✅     | El Perfil lee `student.trainerName` del modelo. Verificado en navegador y con `student-profile.page.spec.ts`.                |
| 2   | T-3       | ✅     | Auditoría de contraste sobre el DOM real: **0 fallos** en las 8 pantallas medidas.                                           |
| 3   | T-2 / P-1 | ✅     | Los 12 controles alcanzan 44×44; borrar foto abre confirmación, con 5 tests que cubren cancelar, confirmar y el doble toque. |
| 4   | W-1       | ✅     | `saving` es un `signal` real; hay test de doble toque que exige una sola llamada a `complete()`.                             |
| 5   | P-2       | ✅     | La pestaña Fotos usa `facade.photos.viewState()`; con cero evaluaciones muestra el uploader.                                 |

## 2. Reglas globales obligatorias

| Regla                           | Estado | Nota                                                                                          |
| ------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| Overscroll / bounce desactivado | ✅     | Sin cambios: la configuración global sigue intacta.                                           |
| Swipe-back bloqueado            | ✅     | Sin cambios.                                                                                  |
| Portrait-only                   | ✅     | Cerrado en la segunda tanda (§6). Resultó que **nunca había funcionado**: ver el detalle ahí. |

## 3. Medición de contraste sobre el DOM real

Script propio ejecutado contra la app corriendo: recorre cada nodo con texto, resuelve el
fondo efectivo subiendo por los ancestros —entendiendo degradados, donde toma el stop más
claro— y compara contra el umbral AA que corresponde al tamaño y peso de la fuente.

| Pantalla                    | Fallos |
| --------------------------- | -----: |
| `/` con el panel de login   |      0 |
| `/student/home`             |      0 |
| `/student/routine`          |      0 |
| `/student/progress`         |      0 |
| `/student/progress` (Fotos) |      0 |
| `/student/profile`          |      0 |
| `/student/notifications`    |      0 |
| `/student/schedule`         |      0 |

**Esta medición encontró algo que el cálculo a mano no vio:** las pantallas del alumno se
pintan sobre `--nq-surface` (#f7faf9), no sobre blanco puro. Contra ese fondo, el primer
valor elegido para `--nq-text-muted` (#647976) se quedaba en **4.41:1**. El token final es
**#5f7472** (4.73:1 sobre la superficie, 4.97:1 sobre blanco).

## 4. Estado de las cinco categorías

| Categoría      | Antes | Ahora | Qué queda                                                                     |
| -------------- | ----- | ----- | ----------------------------------------------------------------------------- |
| UX             | ❌    | ✅    | Diferidos de consistencia: N-1, W-2, H-1, PR-2.                               |
| UI             | ❌    | ✅    | T-8 (escala de espaciado y tipografía) y A-2, diferidos.                      |
| Accesibilidad  | ❌    | ✅    | Cerrada por completo dentro del alcance.                                      |
| Código Angular | ⚠️    | ⚠️    | CH-1, I-1, T-10, T-14 y H-4 siguen abiertos; ninguno afecta al usuario final. |
| Mobile UX      | ⚠️    | ⚠️    | T-11 (pull-to-refresh) y T-12 (safe area superior) siguen abiertos.           |

## 5. Verificación ejecutada

```
lint · typecheck · format:check   limpios
test:coverage                     751 tests en 53 suites
cobertura                         98.96 / 88.91 / 98.12 / 98.99
build                             490.54 kB inicial, sin warnings de budget
```

Recorrido manual a **375×812** y **320×568**: login, Home, Mi rutina, ejecutar sesión,
Progreso con ambas pestañas, Perfil, Notificaciones, Agenda y el flujo completo de
recuperación de contraseña.

Además, un barrido por script sobre cada pantalla que recorre los elementos enfocables en
orden de DOM, calcula el nombre accesible de cada uno y prueba el área táctil real con
`elementFromPoint`. Resultado final: **0 controles sin nombre y 0 bajo 44×44**. Ese
barrido destapó cuatro cosas que ni los tests ni la lectura del código vieron:

| Hallazgo                                                                                                             | Corrección                                                                 |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| El `<h1>` del Home era el nombre del alumno, no el título de la pantalla                                             | `<h1>` oculto con el título; el nombre pasa a `<p>`                        |
| El halo de `.photo-remove` no funcionaba: las figuras vecinas de la grilla se apilaban sobre la parte que sobresalía | Botón de 44×44 con `background-clip: content-box`, círculo visible de 26px |
| El `input[type=file]`, ya enfocable, no tenía nombre accesible                                                       | `aria-label` explícito                                                     |
| Los campos de texto se ven de 52px pero solo los 21px del `input` enfocaban                                          | `align-self: stretch` en el input                                          |

### Lo que esta verificación no alcanza

El panel del navegador corre con **`prefers-reduced-motion: reduce` activo** —comprobado
con `matchMedia`—, lo que colapsa las transiciones y deja a `getComputedStyle` devolviendo
valores intermedios para `opacity` y `visibility`. Eso verifica T-5 en vivo: bajo esa
preferencia la app se ve completa, sin contenido atascado en `opacity: 0`. Pero también
significa que **el foco que entra al abrir un bottom sheet no se pudo confirmar ahí**:
queda cubierto por el spec de `SheetTrapDirective` en jsdom y por el patrón CSS
`visibility 0s` al abrir con retardo al cerrar. El cierre con `Escape` y la trampa de
`Tab` sí se comprobaron en vivo, porque son JavaScript puro.

Falta también el pase con un **lector de pantalla real** (VoiceOver o TalkBack): los
nombres accesibles y las regiones vivas están en el DOM y verificados por script, pero
nadie los ha escuchado.

Conviene confirmar ambas cosas en un dispositivo real antes del release.

---

## 6. Segunda tanda — los 15 diferidos mecánicos

Cerrada después del gate, para dejar el frente limpio antes de las features siguientes.

| Hallazgo | Qué se hizo                                                                                  |
| -------- | -------------------------------------------------------------------------------------------- |
| G-1      | Portrait-only real en web y en nativo. **Ver abajo: nunca había funcionado.**                |
| CH-1     | `track $index` en los dos bucles del gráfico de barras.                                      |
| I-1      | `InvitationMockAdapter` sale de `invite.page.ts` a `provideInvitationMockAdapters()`.        |
| I-4      | `publicOnlyGuard` en `/invite/:token`.                                                       |
| L-1      | La pestaña de origen sigue encendida en Notificaciones y Agenda, con `scan` sobre las rutas. |
| N-1      | "Volver" regresa a la pantalla de origen, con respaldo a Home sin historial.                 |
| SC-1     | "Confirmar" de la agenda se bloquea y muestra "Confirmando…".                                |
| W-2      | Salir del runner en curso pide confirmación; en `idle` o `summary` sale directo.             |
| P-4      | Subir foto muestra progreso, bloquea el segundo archivo y avisa si falla.                    |
| P-5      | Peso sin evaluación se muestra como guion.                                                   |
| H-1      | El nombre del Home carga con esqueleto en vez del respaldo falso "Alumno".                   |
| H-4      | Se elimina el modo `upcoming` de `<nq-workout-card>`: no lo usaba nadie.                     |
| A-2      | Los estilos inline del esqueleto pasan a clases.                                             |
| T-10     | Saludo, tiempo relativo y estado inicial de dos facades leen del puerto `CLOCK`.             |
| T-12     | `env(safe-area-inset-top)` en el shell y en las tres pantallas que viven fuera de él.        |

### G-1: el bloqueo de horizontal nunca había funcionado

La auditoría dio la regla por cumplida leyendo el CSS. Al probarla a 1024×768 resultó que
`ion-app` lleva la clase `ion-page`, y el `display: flex` de Ionic **gana por especificidad**
al selector de elemento `ion-app` del media query. La app nunca se ocultaba y el aviso de
rotar quedaba pintado debajo, fuera de pantalla — también en teléfonos.

La corrección son tres cosas: selector `ion-app.ion-page`, aviso `fixed` con fondo propio
para no depender de que la app salga del flujo, y `@capacitor/screen-orientation` con
import dinámico —estático costaba 9 kB del bundle inicial, que ya rozaba el budget—.

Verificado: a 1024×768 la app queda en `display: none` y el aviso cubre la pantalla; a
375×812 la app vuelve a `display: flex`.

### Estado tras la segunda tanda

```
lint · typecheck · format:check   limpios
test:coverage                     761 tests en 53 suites
cobertura                         98.84 / 87.97 / 98.31 / 98.81
build                             495.19 kB inicial, sin warnings de budget
```

Verificado en navegador: la pestaña de origen, el "Volver" con historial, la confirmación
de salida del runner y el bloqueo de horizontal.

### Lo que queda de HU-11.6

Seis hallazgos, todos con una decisión de diseño detrás: **T-7** (traducir las dos
pantallas de autenticación), **T-8** (normalizar la escala de espaciado y tipografía),
**T-11** (pull-to-refresh), **T-14** (migrar a `input()` signals), **PR-2** (gesto de
arrastre del sheet, o retirar el asa) y **P-6** (comparador de fotos arrastrable, o
corregir el ticket que lo da por hecho).

---

## 7. Gate

# ✅ APROBADO

Los cinco bloqueantes están cerrados y verificados, las cinco categorías del informe pasan
y las tres reglas globales obligatorias —incluida la de portrait-only, que resultó estar
rota desde el principio— se comprobaron funcionando en el navegador.

Los seis hallazgos que quedan son de consistencia y preferencia de diseño: ninguno bloquea
avanzar con features nuevas.
