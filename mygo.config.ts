import { defineConfig } from "mygo-cli";

export default defineConfig({
  name: "SmartAR",
  identifier: "io.github.mydoubtfulgo.smartar",
  version: "1.1.0",
  copyright: "Copyright © 2026 SmartAR Contributors. Licensed under MPL-2.0.",
  devUrl: "http://localhost:5173",
  devCommand: "bun run dev:web",
  buildCommand: "bun run build:web",
  frontendDist: "dist",
  bindings: "src/mygo.ts",
  out: "build",
  fileAssociations: [
    {
      ext: ["xlsx"],
      name: "Excel Accounts Receivable Workbook",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  ],
  linux: {
    comment: "SmartAR智能应收账款账龄分析与坏账预警系统",
    categories: ["Office", "Finance"],
  },
});
