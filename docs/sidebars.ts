import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // 開発者向けサイドバー
  developerSidebar: [
    {
      type: "category",
      label: "概要",
      items: ["intro"],
    },
    {
      type: "category",
      label: "要件定義",
      items: ["requirements/project-overview"],
    },
    {
      type: "category",
      label: "アーキテクチャ",
      items: [
        "architecture/index",
        "architecture/diagrams",
        {
          type: "category",
          label: "実装ガイドライン",
          items: [
            "architecture/guidelines/clean-architecture-guide",
            "architecture/guidelines/ddd-guide",
            "architecture/guidelines/coding-conventions",
            "architecture/guidelines/testing-guide",
          ],
        },
      ],
    },
    {
      type: "category",
      label: "開発ガイド",
      items: [
        "development/index",
        "development/release-automation",
        {
          type: "category",
          label: "データベース",
          items: [
            "development/database/setup",
            "development/database/schema",
            "development/database/spatial",
          ],
        },
      ],
    },
  ],

  // 利用者向けサイドバー
  userSidebar: [
    {
      type: "category",
      label: "利用者ガイド",
      items: ["user-guides/index"],
    },
  ],
};

export default sidebars;
