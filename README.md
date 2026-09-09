# Olivia Massiel — Baby Shower

Invitación digital de una sola página. Vite + TypeScript, sin framework de UI.

```bash
npm install
npm run dev        # servidor de desarrollo
npm run build      # typecheck + build de producción en dist/
npm run preview    # sirve dist/ para revisarlo
npm run typecheck  # solo el chequeo de tipos
```

El resultado de `npm run build` es estático: `dist/` se puede subir tal cual a
Netlify, Vercel, GitHub Pages o cualquier hosting. Las rutas son relativas, así
que también funciona desde un subdirectorio.

## Editar los datos del evento

Todo el contenido vive en **[src/config/event.config.ts](src/config/event.config.ts)**.
Es el único archivo que hay que tocar para cambiar fechas, lugar o textos: el
HTML se rellena desde ahí en tiempo de build, y los componentes leen del mismo
sitio. No hay ningún dato repetido en dos lugares.

- `event` — fecha ISO, etiquetas, lugar, dirección, enlace a Maps.
- `copy` — todos los textos visibles.
- `navItems` — las seis entradas del menú.

La fecha del contador sale de `event.isoDate`, con el desfase `-05:00` de
Perú escrito explícitamente, de modo que la cuenta atrás es correcta para
cualquier invitado, esté donde esté.

## Confirmación de asistencia

El invitado escribe su nombre en la sección `#confirmar`, se envía a una función
serverless y recibe un mensaje flotante. Sin recargar, sin salir de la
invitación y sin pedirle nada más que el nombre. **No hay base de datos: el
correo es el registro.**

```
Formulario → POST /api/rsvp → Vercel Function → Resend → tu correo
```

### Qué falta para que llegue el correo

El frontend y el endpoint están terminados y probados. El envío real necesita
tres variables. Sin ellas la función responde `SERVER_ERROR` y el formulario
muestra el mensaje de reintento — que es exactamente lo que hace ahora.

1. Crear una cuenta en [resend.com](https://resend.com).
2. Generar una API key en **API Keys**.
3. Verificar el dominio del remitente en **Domains**. Para probar sin dominio
   propio, Resend permite usar `onboarding@resend.dev` como remitente.
4. Rellenar las variables (ver `.env.example`):

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
RSVP_TO_EMAIL=tu-correo@ejemplo.com
RSVP_FROM_EMAIL=Olivia Massiel <hola@tudominio.com>
RSVP_CC_EMAIL=
```

**En local:** copiar `.env.example` a `.env` y rellenarlo. `npm run dev` monta
`/api/rsvp` con la misma función que usará Vercel, así que se prueba de verdad.

**En Vercel:** Project Settings → Environment Variables. Vercel detecta Vite
solo, publica `dist/` y sirve `api/rsvp.ts` como función. No hace falta
`vercel.json`.

**Ninguna variable lleva el prefijo `VITE_`**, y es a propósito: ese prefijo las
publicaría en el paquete que descarga el navegador. `.env` está en `.gitignore`.

### Correo que recibes

```
Asunto: Nueva confirmación de asistencia — Olivia Massiel

Nueva confirmación de asistencia

Nombre:
María López

Evento:
Baby Shower — Olivia Massiel

Fecha:
19 de setiembre de 2026

Hora:
7:30 p. m.
```

La fecha y la hora salen de [event.config.ts](src/config/event.config.ts), no
están escritas en la función.

### Protecciones

- **Validación en los dos lados**: mismo mínimo (2), mismo máximo (100) y misma
  expresión, que acepta tildes, Ñ, guiones y apóstrofos, y rechaza dígitos y
  cualquier cosa con pinta de inyección.
- **Honeypot**: un campo `website` fuera del lienzo y fuera del orden de
  tabulación. Si viene relleno se responde con éxito pero no se envía nada, para
  no enseñarle al bot qué le delató.
- **Tiempo mínimo**: se rechaza cualquier envío que llegue en menos de 1,5 s
  desde que se pintó el formulario.
- **Limitador por IP**: 5 envíos por ventana de 10 minutos, en memoria del
  proceso. Es un freno, no una garantía —Vercel puede levantar varias
  instancias—; el honeypot y el tiempo mínimo cubren el resto.

Si alguien confirma dos veces, llegan dos correos. Es lo acordado para esta
primera versión.

## Los assets## Los assets

Los que se sirven están en `public/images/`, descritos en
[public/images/manifest.json](public/images/manifest.json), que es ahora el
**único** manifiesto: sustituye a los dos anteriores, que se contradecían entre
sí y apuntaban a rutas inexistentes.

`assets/` se conserva intacto como archivo original. `assets/reference/` es guía
visual interna y nunca entra en el build.

Se sirven 9 archivos (166 KB en total). Quedan fuera, con el motivo anotado en
el manifiesto: `hero@2x.webp` (no es una versión 2x: mide lo mismo que el hero y
está más comprimido), `hero-mobile.webp` (recorte de 11 px, redundante), los
recortes transparentes de los animales y del móvil (no coinciden con los objetos
de la fotografía aprobada) y los banderines recortados (conservan restos del
recorte en el canal alfa).

### Cambiar la fotografía

`hero.webp` mide 1024 × 1536 y es la fotografía con el nombre en letras de
crochet. Aunque una fotografía nueva conserve la relación de aspecto, hay que
**recalibrar [src/data/hotspots.ts](src/data/hotspots.ts)**: sus coordenadas son
porcentajes medidos sobre esta imagen concreta, y una escena regenerada desplaza
todos los objetos. Si además cambia la relación de aspecto, hay que actualizar
los dos `1024 / 1536` de `.hero__stage` en
[src/styles/hero.css](src/styles/hero.css).

Para recalibrar: recortar la región de la imagen con una rejilla de porcentajes
encima, leer las cajas y superponerlas para comprobarlas. Es como se midieron
las 18 zonas actuales.

## Cómo está montado el hero

La fotografía se sirve entera, sin recortes superpuestos. Encima hay **18 zonas
interactivas** repartidas en dos capas: 5 objetos (el móvil y sus cuatro
animales) y las 13 letras de crochet, una por letra. Cada una es un `<button>`
transparente con su etiqueta, su nota y su respuesta visual propias.

`.hero__stage` mantiene siempre la relación 1024/1536 y contiene tanto la imagen
como los hotspots. Por eso las coordenadas en porcentaje caen sobre el mismo
objeto en cualquier ancho, sin recalcular nada en JavaScript.

**Tocar un objeto no mueve la fotografía.** La respuesta es local: un halo cálido
y un anillo que se abre sobre esa zona. No existe una capa independiente del
peluche ni de la letra que pueda desplazarse sin partir la imagen, así que la
alternativa —mover la escena entera para fingirlo— queda descartada.

El parallax responde solo al puntero, al scroll y a la inclinación del
dispositivo, con un recorrido de 8 px sobre el contenedor completo. Al activar
una zona se congela 620 ms y luego vuelve suavemente, para que la atención quede
en el objeto tocado y no en un movimiento general de la escena.

## Tu nombre tiene una melodía

Sección `#tu-nombre`, entre «La espera» y la cuenta regresiva. El visitante
escribe su nombre y cada letra aparece como una pieza de crochet independiente:
su propio `<button>`, su propia zona sensible, su propio estado y su propia nota.
El contenedor solo coloca las piezas; nunca escucha eventos.

Los assets están en `public/images/embroidered-letters/`, uno por letra, con la
Ñ incluida. Para localizarlos, el texto se normaliza a NFC y se le quitan las
tildes (JOSUÉ busca `E.webp` pero se sigue escribiendo con tilde); la Ñ no se
pliega, porque tiene pieza propia.

**El paquete original venía mal troceado al final.** Se cortó con un paso de
470 px sobre baldosas de 512, así que las últimas letras quedaron partidas entre
archivos contiguos: la mitad derecha de la X vivía dentro de `Y.webp`, y la de
la Y dentro de `Z.webp`. Ambas se recompusieron juntando sus mitades con ese
mismo paso, de modo que son las letras originales, no una reinterpretación.

La Z se recortó de `public/images/alfabeto.png` —la lámina completa— separándola
del fondo por difusión desde los bordes y escalándola a las proporciones de la
familia. Otras siete (E F H L M S W) llegaron con un fragmento de la letra
vecina pegado en un borde y se limpiaron conservando solo la letra.

Los 27 archivos originales están sin tocar en
`assets/production/embroidered-letters-originales/`.

## El sonido

Una nota corta por interacción, sintetizada con la Web Audio API. Sin música de
fondo, sin autoplay, sin archivos externos. Escala pentatónica mayor de Do: los
objetos del móvil suenan según su altura en el encuadre, y cada fila del nombre
sube de izquierda a derecha, así que recorrer las letras dibuja un arpegio.

Dos frenos distintos: **500 ms por zona**, para que un mismo objeto no se repita
si el puntero entra y sale; y **90 ms de suelo global**, solo para que dos notas
no se solapen. Un único cooldown global habría silenciado doce de las trece
letras al deslizar el dedo por el nombre.

La sección «Tu nombre» reutiliza este mismo sistema —un solo `AudioContext`, el
mismo interruptor de silencio— y le pasa un identificador por posición, de modo
que las dos «A» de CLAUDIA son piezas distintas y ninguna silencia a la otra.

Un único `AudioContext`, creado de forma perezosa y solo tras un gesto real del
usuario. Silencio total si el sistema pide reducir el movimiento. El control de
la barra superior recuerda la preferencia.

## Accesibilidad

HTML semántico, enlace para saltar al contenido, foco visible en todos los
controles, `aria-label` en cada hotspot, foco atrapado y devuelto en el menú, y
contraste AA verificado en todos los textos sobre sus fondos reales. El sonido
nunca es necesario para entender el contenido.

## El paquete original

Se conserva sin tocar como referencia:

- `CLAUDE_CODE_PROMPT.md` — el brief de dirección creativa.
- `assets/` — entrega original de assets, con las referencias visuales.
- `docs/` — prototipo anterior en vanilla y el módulo aislado `audio-hover.js`,
  del que se ha heredado únicamente el concepto de la nota sintetizada.

## Evento

19 de setiembre de 2026 · 7:30 p. m. · Salón Los Olivos · Av. Los Olivos 123, Chiclayo
