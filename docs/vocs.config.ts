import { defineConfig } from "vocs/config";

export default defineConfig({
  title: "zod-refiners",
  description:
    "Isolated, composable Zod refiner functions — copied into your project, owned by you.",
  baseUrl: "https://zod-refiners.vercel.app",
  logoUrl: "/logo.svg",
  iconUrl: "/logo.svg",
  editLink: {
    link: "https://github.com/usefmahmud/zod-refiners/edit/main/docs/:path",
  },
  socials: [
    { icon: "github", link: "https://github.com/usefmahmud/zod-refiners" },
  ],
  topNav: [
    { text: "Docs", link: "/" },
    {
      text: "GitHub",
      link: "https://github.com/usefmahmud/zod-refiners",
      external: true,
    },
    {
      text: "npm",
      link: "https://www.npmjs.com/package/zod-refiners",
      external: true,
    },
  ],
  sidebar: [
    { text: "Home", link: "/" },
    { text: "Getting Started", link: "/getting-started" },
    { text: "CLI Reference", link: "/cli" },
    {
      text: "Refiners",
      collapsed: false,
      items: [
        { text: "Overview", link: "/refiners" },
        { text: "password-match", link: "/refiners/password-match" },
        { text: "strong-password", link: "/refiners/strong-password" },
        { text: "date-range", link: "/refiners/date-range" },
        { text: "allowed-domains", link: "/refiners/allowed-domains" },
        { text: "types & RefineTuple", link: "/refiners/types" },
      ],
    },
    { text: "Configuration", link: "/configuration" },
    { text: "FAQ", link: "/faq" },
    {
      text: "GitHub",
      link: "https://github.com/usefmahmud/zod-refiners",
      external: true,
    },
  ],
});
