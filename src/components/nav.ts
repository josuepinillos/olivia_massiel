/**
 * Menu de navegacion (decision 8).
 *
 * Un unico disparador discreto que abre un panel. En movil ocupa la pantalla
 * completa; en escritorio es una columna estrecha a la derecha. Seis enlaces,
 * nada mas: ni barra horizontal permanente ni nada que recuerde a un dashboard.
 */

import { navItems, copy } from "../config/event.config";

const FOCUSABLE = "a[href], button:not([disabled])";

export function initNav(): () => void {
  const nav = document.querySelector<HTMLElement>("[data-nav]");
  const toggle = document.querySelector<HTMLButtonElement>("[data-nav-toggle]");
  const panel = document.querySelector<HTMLElement>("[data-nav-panel]");
  const list = document.querySelector<HTMLUListElement>("[data-nav-list]");
  const scrim = document.querySelector<HTMLElement>("[data-nav-scrim]");
  if (!nav || !toggle || !panel || !list) return () => {};

  /* --- Enlaces ---------------------------------------------------------- */

  const links = navItems.map((item) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${item.id}`;
    a.textContent = item.label;
    a.dataset.navLink = item.id;
    li.append(a);
    list.append(li);
    return a;
  });

  /* --- Apertura y cierre ------------------------------------------------ */

  let open = false;
  let lastFocused: HTMLElement | null = null;

  const setOpen = (next: boolean) => {
    if (open === next) return;
    open = next;

    nav.dataset.open = String(open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? copy.nav.close : copy.nav.open);
    panel.inert = !open;
    document.documentElement.classList.toggle("has-nav-open", open);

    if (open) {
      const active = document.activeElement;
      // Safari no enfoca un <button> al pulsarlo, asi que `activeElement`
      // puede ser el <body>. En ese caso se devuelve el foco al disparador,
      // que es donde el usuario estaba, en vez de mandarlo al principio de la
      // pagina al cerrar.
      lastFocused =
        active instanceof HTMLElement && active !== document.body
          ? active
          : toggle;
      panel.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    } else {
      (lastFocused ?? toggle).focus();
      lastFocused = null;
    }
  };

  const onToggle = () => setOpen(!open);
  const onScrim = () => setOpen(false);

  const onKeydown = (e: KeyboardEvent) => {
    if (!open) return;

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }

    if (e.key !== "Tab") return;

    // Foco atrapado dentro del panel mientras esta abierto.
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    const active = document.activeElement;

    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  toggle.addEventListener("click", onToggle);
  scrim?.addEventListener("click", onScrim);
  document.addEventListener("keydown", onKeydown);
  for (const link of links) {
    link.addEventListener("click", () => setOpen(false));
  }

  panel.inert = true;
  toggle.setAttribute("aria-label", copy.nav.open);

  /* --- Seccion activa --------------------------------------------------- */

  const sections = navItems
    .map((item) => document.getElementById(item.id))
    .filter((el): el is HTMLElement => el !== null);

  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of links) {
          const isCurrent = link.dataset.navLink === entry.target.id;
          if (isCurrent) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        }
      }
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
  );
  for (const section of sections) spy.observe(section);

  /* --- Barra superior compacta al bajar --------------------------------- */

  const hero = document.getElementById("inicio");
  let condensed: IntersectionObserver | null = null;
  if (hero) {
    condensed = new IntersectionObserver(
      ([entry]) => {
        nav.dataset.condensed = String(!(entry?.isIntersecting ?? true));
      },
      { rootMargin: "-72px 0px 0px 0px", threshold: 0 },
    );
    condensed.observe(hero);
  }

  return () => {
    toggle.removeEventListener("click", onToggle);
    scrim?.removeEventListener("click", onScrim);
    document.removeEventListener("keydown", onKeydown);
    spy.disconnect();
    condensed?.disconnect();
  };
}
