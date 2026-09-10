import type { ServerResponse } from "node:http";
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
 * Se le anaden a la respuesta los ayudantes `status()` y `json()` que Vercel
 * pone en su runtime, para que el handler vea exactamente la misma forma en
 * local y en produccion. Solo se aplica en desarrollo (`apply: "serve"`).
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
              default: (peticion: unknown, respuesta: unknown) => Promise<void>;
            };

            const respuesta = res as ServerResponse & {
              status?: (codigo: number) => unknown;
              json?: (cuerpo: unknown) => void;
            };
            respuesta.status = (codigo: number) => {
              res.statusCode = codigo;
              return respuesta;
            };
            respuesta.json = (cuerpo: unknown) => {
              res.setHeader("content-type", "application/json; charset=utf-8");
              res.end(JSON.stringify(cuerpo));
            };

            await modulo.default(req, respuesta);

            // Si el handler terminara sin responder, la peticion se quedaria
            // colgada. Aqui se cierra para que el fallo se vea al instante.
            if (!res.headersSent) {
              server.config.logger.error("[api/rsvp] el handler no respondio");
              res.statusCode = 500;
              res.setHeader("content-type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ success: false, error: "SERVER_ERROR" }));
            }
          } catch (e) {
            server.config.logger.error(`[api/rsvp] ${String(e)}`);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader("content-type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ success: false, error: "SERVER_ERROR" }));
            }
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
