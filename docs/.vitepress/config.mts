import { defineConfig } from "vitepress";

const cli = ["init", "new", "submit", "revise", "approve", "review", "validate", "trace", "status", "context", "doctor", "mode", "adapters", "phase", "task"];
const catalogo: [string, string][] = [
  ["estados", "Estados y transiciones"],
  ["fases", "Fases"],
  ["modos", "Modos de rigor"],
  ["tipos-de-documento", "Tipos de documento"],
  ["riesgo-y-datos", "Riesgo y datos"],
  ["politicas", "Políticas y roles"],
  ["definiciones", "DoR y DoD"],
];

export default defineConfig({
  lang: "es",
  title: "Software AI Development",
  description: "Manual de usuario de la metodología Software AI Development y su herramienta ai-dev.",
  base: "/software-ai-development/",
  cleanUrls: true,
  head: [["link", { rel: "icon", type: "image/svg+xml", href: "/software-ai-development/logo.svg" }]],
  // Los índices de carpeta son README.md (se leen así en GitHub); en el sitio pasan a index.
  rewrites: Object.fromEntries(
    ["conceptos", "roles", "guias", "guias/agentes", "tutorial", "referencia", "referencia/cli"].map((d) => [`${d}/README.md`, `${d}/index.md`]),
  ),
  themeConfig: {
    logo: "/logo.svg",
    siteTitle: "Software AI Development",
    nav: [
      { text: "Tutorial", link: "/tutorial/primer-proyecto" },
      { text: "Guías", link: "/guias/" },
      { text: "Conceptos", link: "/conceptos/" },
      { text: "Referencia", link: "/referencia/" },
      { text: "Ejemplo: MiAdmin", link: "https://github.com/alex7506/miadmin" },
    ],
    sidebar: [
      {
        text: "Empezar",
        items: [
          { text: "Introducción", link: "/" },
          { text: "Instalar ai-dev", link: "/guias/instalar" },
          { text: "Tutorial: tu primer proyecto", link: "/tutorial/primer-proyecto" },
        ],
      },
      {
        text: "Conceptos",
        collapsed: false,
        items: [
          { text: "Principios", link: "/conceptos/principios" },
          { text: "Ciclo y fases", link: "/conceptos/ciclo-y-fases" },
          { text: "Modos de rigor", link: "/conceptos/modos-de-rigor" },
          { text: "Riesgo y autonomía", link: "/conceptos/riesgo-y-autonomia" },
          { text: "Trazabilidad", link: "/conceptos/trazabilidad" },
          { text: "Independencia de proveedor", link: "/conceptos/independencia-de-proveedor" },
        ],
      },
      {
        text: "Guías",
        collapsed: false,
        items: [
          { text: "Iniciar un proyecto", link: "/guias/iniciar-proyecto" },
          { text: "Adoptar un proyecto existente", link: "/guias/adoptar-proyecto-existente" },
          { text: "Gestionar tareas", link: "/guias/gestionar-tareas" },
          { text: "Aprobar documentos y fases", link: "/guias/aprobar" },
        ],
      },
      {
        text: "Asistentes de IA",
        collapsed: true,
        items: [
          { text: "Visión general", link: "/guias/agentes/" },
          { text: "Claude Code", link: "/guias/agentes/claude-code" },
          { text: "Cursor", link: "/guias/agentes/cursor" },
          { text: "GitHub Copilot", link: "/guias/agentes/copilot" },
          { text: "Gemini CLI", link: "/guias/agentes/gemini" },
          { text: "Otros (AGENTS.md)", link: "/guias/agentes/otros" },
        ],
      },
      {
        text: "Roles",
        collapsed: true,
        items: [
          { text: "Visión general", link: "/roles/" },
          { text: "Responsable de producto", link: "/roles/product-owner" },
          { text: "Líder técnico", link: "/roles/tech-lead" },
          { text: "Calidad y seguridad", link: "/roles/calidad-y-seguridad" },
          { text: "Desarrollador", link: "/roles/desarrollador" },
        ],
      },
      {
        text: "Referencia de comandos",
        collapsed: true,
        items: [{ text: "Todos los comandos", link: "/referencia/cli/" }, ...cli.map((c) => ({ text: `ai-dev ${c}`, link: `/referencia/cli/${c}` }))],
      },
      {
        text: "Referencia del catálogo",
        collapsed: true,
        items: catalogo.map(([file, text]) => ({ text, link: `/referencia/catalogo/${file}` })),
      },
      {
        text: "Piloto MiAdmin",
        collapsed: true,
        items: [{ text: "Notas y fricciones", link: "/tutorial/notas-miadmin" }],
      },
    ],
    search: {
      provider: "local",
      options: {
        translations: {
          button: { buttonText: "Buscar", buttonAriaLabel: "Buscar en el manual" },
          modal: {
            displayDetails: "Mostrar detalles",
            resetButtonTitle: "Borrar búsqueda",
            backButtonTitle: "Cerrar búsqueda",
            noResultsText: "Sin resultados para",
            footer: { selectText: "seleccionar", navigateText: "navegar", closeText: "cerrar" },
          },
        },
      },
    },
    outline: { level: [2, 3], label: "En esta página" },
    docFooter: { prev: "Anterior", next: "Siguiente" },
    darkModeSwitchLabel: "Apariencia",
    lightModeSwitchTitle: "Cambiar a modo claro",
    darkModeSwitchTitle: "Cambiar a modo oscuro",
    sidebarMenuLabel: "Menú",
    returnToTopLabel: "Volver arriba",
    langMenuLabel: "Idioma",
    notFound: { title: "Página no encontrada", quote: "Esta página no existe o cambió de lugar.", linkText: "Ir al inicio" },
    socialLinks: [{ icon: "github", link: "https://github.com/alex7506/software-ai-development" }],
    footer: {
      message: "Licencia de uso: gratis, también para uso comercial. Lo que creas con la herramienta es tuyo.",
      copyright: "© 2026 Ing. Alexander Patiño Londoño",
    },
  },
});
