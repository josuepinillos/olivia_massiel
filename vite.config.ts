import { defineConfig, loadEnv, type Plugin } from "vite";
import { event, copy } from "./src/config/event.config.js";

/**
 * Inyecta el contenido de `event.config.ts` en `index.html` en tiempo de build.
 *
 * Asi el HTML servido ya lleva las fechas, el lugar y los textos escritos: se
 * lee sin JavaScript, los previsualizadores de enlaces (WhatsApp, iMessage)
 * encuentran meta tags reales, y aun asi el dato sigue viviendo en un unico
 * sitio. Sin esto habria que repetir cada texto en el HTML y en la config.
 */
function injectEventData(): Plugin {
  const tokens = flatten({ event, copy });

  return {
    name: "olivia-inject-event-data",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
          const value = tokens.get(key);
          if (value === undefined) {
            throw new Error(
              `index.html usa {{${key}}}, que no existe en event.config.ts`,
            );
          }
          return value;
        });
      },
    },
  };
}

/** Aplana el objeto de configuracion a pares "ruta.con.puntos" -> texto. */
function flatten(source: unknown, prefix = "", out = new Map<string, string>()) {
  if (source === null || source === undefined) return out;

  if (typeof source !== "object") {
    out.set(prefix, escapeHtml(String(source)));
    return out;
  }

  for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
    flatten(value, prefix ? `${prefix}.${key}` : key, out);
  }
  return out;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Monta `/api/rsvp` durante `npm run dev`.
 *
 * En produccion esa ruta la sirve Vercel como funcion serverless; el servidor
 * de Vite no sabe nada de funciones. Sin esto, probar el formulario en local
 * obligaria a simular la respuesta, que es justo lo que no queremos: aqui se
 * ejecuta la misma funcion, con las mismas validaciones, leyendo el mismo `.env`.
 *
 * Solo se aplica en desarrollo (`apply: "serve"`), asi que no toca el build.
 */
function apiRsvpEnDesarrollo(entorno: Record<string, string>): Plugin {
  return {
    name: "olivia-api-rsvp-dev",
    apply: "serve",
    configureServer(server) {
      // Las variables privadas viajan por process.env, igual que en Vercel.
      for (const [clave, valor] of Object.entries(entorno)) {
        if (valor && process.env[clave] === undefined) process.env[clave] = valor;
      }

      server.middlewares.use("/api/rsvp", (req, res) => {
        void (async () => {
          try {
            const modulo = (await server.ssrLoadModule("/api/rsvp.ts")) as {
              manejaRsvp: (peticion: Request) => Promise<Response>;
            };

            const trozos: Buffer[] = [];
            for await (const trozo of req) trozos.push(trozo as Buffer);
            const cuerpo = Buffer.concat(trozos);

            const cabeceras = new Headers();
            for (const [clave, valor] of Object.entries(req.headers)) {
              if (typeof valor === "string") cabeceras.set(clave, valor);
              else if (Array.isArray(valor)) cabeceras.set(clave, valor.join(", "));
            }

            const peticion = new Request("http://localhost/api/rsvp", {
              method: req.method ?? "GET",
              headers: cabeceras,
              ...(cuerpo.length > 0 ? { body: cuerpo } : {}),
            });

            const respuesta = await modulo.manejaRsvp(peticion);
            res.statusCode = respuesta.status;
            respuesta.headers.forEach((valor, clave) => res.setHeader(clave, valor));
            res.end(await respuesta.text());
          } catch (e) {
            server.config.logger.error(`[api/rsvp] ${String(e)}`);
            res.statusCode = 500;
            res.setHeader("content-type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ success: false, error: "SERVER_ERROR" }));
          }
        })();
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  // Rutas relativas: el sitio puede servirse desde la raiz o desde un
  // subdirectorio sin tocar nada.
  base: "./",
  plugins: [injectEventData(), apiRsvpEnDesarrollo(loadEnv(mode, process.cwd(), ""))],
  build: {
    target: "es2022",
    assetsInlineLimit: 2048,
    cssMinify: true,
  },
  server: { open: true },
}));
