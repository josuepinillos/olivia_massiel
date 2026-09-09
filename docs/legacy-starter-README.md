# Olivia Massiel — Codex Starter

Este paquete es una base funcional para construir la landing mobile-first del Baby Shower de Olivia Massiel.

## Estructura

- `index.html` — landing completa.
- `styles.css` — diseño responsive.
- `script.js` — parallax, hover, balanceo y countdown.
- `event.js` — datos editables del evento.
- `assets/hero.webp` — fotografía aprobada como key visual.
- `assets/*.webp` — capas transparentes preparadas para las interacciones.

## Importante sobre los assets

La fotografía hero debe mantenerse como referencia visual principal y no debe rediseñarse.
Las capas de juguetes son overlays transparentes para las animaciones. Su escala/posición se puede ajustar en CSS para alinearlas exactamente con la fotografía final.

## Cómo continuar con Codex

1. Copia esta carpeta dentro del repositorio del proyecto.
2. Pide a Codex que convierta esta versión en Next.js/React + TypeScript si ese es el stack.
3. Mantén la estética: beige cálido, rosa empolvado, marfil, taupe y tipografía editorial.
4. No agregues elementos infantiles genéricos, globos, confeti ni colores saturados.
5. Prioriza mobile-first.
6. La hero debe ocupar la primera pantalla y sentirse como una escena fotográfica interactiva.
7. En desktop: cursor/parallax/hover.
8. En móvil: scroll + toque + movimiento del dispositivo cuando esté disponible.
9. Respeta `prefers-reduced-motion`.

## Datos actuales

- Fecha: 12 de octubre de 2026
- Hora: 4:00 p.m.
- Lugar: Salón Los Olivos
- Dirección: Av. Los Olivos 123, Chiclayo

Edita únicamente `event.js` para cambiar los datos.

## Prompt recomendado para Codex

Lee primero todos los archivos de este starter. Convierte esta landing en una implementación premium con React/Next.js y TypeScript, manteniendo exactamente la dirección de arte y la composición visual. Usa la fotografía `assets/hero.webp` como key visual. No sustituyas la fotografía por ilustraciones ni generes imágenes nuevas.

Implementa la hero como una escena multicapa: fondo fotográfico, móvil, juguetes y tipografía. El cursor debe producir un parallax extremadamente sutil; cada juguete debe tener un balanceo independiente y un hover suave. El nombre OLIVIA MASSIEL debe reaccionar con microinteracciones elegantes. En móvil no dependas de hover: usa scroll, touch y device orientation de forma progresiva, sin solicitar permisos agresivamente.

La animación debe sentirse física, delicada y editorial, nunca como una página infantil genérica. Usa Framer Motion o Motion para las animaciones si el proyecto ya utiliza React. Optimiza imágenes, lazy-load de secciones posteriores y respeta `prefers-reduced-motion`.

No cambies colores, fotografía, composición ni tipografías sin justificación. No inventes datos del evento. Todos los datos deben salir de `event.js`.

Antes de terminar, verifica:
- responsive 360px, 390px, 430px, tablet y desktop;
- ausencia de overflow horizontal;
- accesibilidad básica;
- rendimiento;
- animaciones fluidas a 60fps;
- botones funcionales;
- countdown funcionando;
- enlaces de ubicación y RSVP configurables.
