---
name: security-review
description: Revisión de seguridad para una app web estática de React/TypeScript que consume APIs públicas. Se activa al tocar src/services/, al añadir dependencias, al manejar entradas del formulario, al construir URLs o al renderizar contenido remoto.
---

# Revisión de seguridad

Esta aplicación es un frontend estático sin backend propio, sin cuentas de usuario
y sin datos personales. Eso descarta clases enteras de vulnerabilidades — no
pierdas tiempo buscándolas. Concentrate en lo que sí aplica.

## Superficie real de ataque

### 1. Entrada del formulario

Toda entrada es del propio usuario, pero igual debe validarse en el borde del
dominio:

- La medalla debe pertenecer al enum. Nunca aceptar una cadena arbitraria.
- Las estrellas deben ser un entero de 1 a 5. Rechazar `NaN`, negativos, decimales.
- El número de leaderboard de Immortal debe ser un entero positivo con tope.
- El número de jugadores debe estar entre 1 y 5.

Una entrada inválida se rechaza con un mensaje claro. Nunca se deja pasar hasta
el cálculo para que reviente ahí.

### 2. Llamadas a OpenDota

- Construir las URLs con `URL` y `URLSearchParams`. Nunca por concatenación de cadenas.
- Validar la forma de la respuesta antes de usarla. La respuesta de una API
  externa es dato no confiable, no un objeto tipado por buena fe.
- Siempre `timeout` y siempre un camino de degradación: si OpenDota falla, la
  aplicación sigue calculando.
- Solo HTTPS.

### 3. Renderizado

- Nunca `dangerouslySetInnerHTML`. Si aparece en un diff, es bloqueante.
- Nunca interpolar datos de la API dentro de HTML crudo.

### 4. Dependencias

- Cada dependencia nueva necesita justificación. Este proyecto no debería tener
  muchas.
- Revisar el árbol antes de añadir algo: `bun pm ls`.
- Sin scripts de post-instalación de paquetes desconocidos.

### 5. Secretos

- No hay secretos que proteger hoy: OpenDota no requiere key para lo que usamos.
- Si algún día se necesita una API key, **no puede vivir en el frontend**. Un
  build estático expone todo. Haría falta un proxy. Marcarlo como decisión de
  arquitectura, no resolverlo con una variable `VITE_`.
- Nunca commitear `.env`.

## Salida

Reportar solo hallazgos verificables, con `archivo:línea` y el escenario concreto
de fallo. Sin teatro: si no encontraste nada, decilo en una línea.
