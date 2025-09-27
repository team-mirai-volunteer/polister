import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "Polister Docs",
  tagline: "Polisterプロジェクトドキュメント",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://team-mirai-volunteer.github.io",
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: "/polister/",

  // GitHub pages deployment config.
  organizationName: "team-mirai-volunteer",
  projectName: "polister",

  onBrokenLinks: "warn",
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  // Japanese as default locale
  i18n: {
    defaultLocale: "ja",
    locales: ["ja"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/", // docsをルートに設定
          editUrl: undefined,
        },
        blog: false, // blogを無効化
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: ["@docusaurus/theme-mermaid"],

  themeConfig: {
    // Replace with your project's social card
    image: "img/docusaurus-social-card.jpg",
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Polister Docs",
      logo: {
        alt: "Polister Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "developerSidebar",
          position: "left",
          label: "開発者向け",
        },
        {
          type: "docSidebar",
          sidebarId: "userSidebar",
          position: "left",
          label: "利用者向け",
        },
        {
          href: "https://github.com/team-mirai/polister",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "開発者向け",
          items: [
            {
              label: "要件定義",
              to: "/requirements/project-overview",
            },
            {
              label: "アーキテクチャ",
              to: "/architecture",
            },
            {
              label: "開発ガイド",
              to: "/development",
            },
          ],
        },
        {
          title: "利用者向け",
          items: [
            {
              label: "利用者ガイド",
              to: "/user-guides",
            },
          ],
        },
        {
          title: "コミュニティ",
          items: [
            {
              label: "GitHub Issues",
              href: "https://github.com/team-mirai/polister/issues",
            },
            {
              label: "Discussions",
              href: "https://github.com/team-mirai/polister/discussions",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Polister Team. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
