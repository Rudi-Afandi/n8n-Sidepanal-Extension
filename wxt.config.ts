import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: "N8N Side Panel",
    version: "1.0.0",
    description: "Send text or files to n8n webhook",
    permissions: ["storage"],
    side_panel: { default_path: "sidepanel/index.html" },
    action: { default_title: "Open Side Panel" }, // icon di-click -> open side panel via background.ts
    host_permissions: ["*://*/*"],
    icons: { "128": "icon/128.png" },
  },
});
