import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { fileURLToPath, URL } from "node:url";
import { VitePWA } from "vite-plugin-pwa";
import { lingui } from "@lingui/vite-plugin";
import { qrcode } from "vite-plugin-qrcode";
import basicSsl from "@vitejs/plugin-basic-ssl";

function livekitTokenDevRoute() {
  return {
    name: "livekit-token-dev-route",
    configureServer(server: any) {
      server.middlewares.use("/api/livekit-token", async (req: any, res: any, next: any) => {
        if (req.method !== "POST") {
          next();
          return;
        }

        try {
          const { default: livekitTokenHandler } = await import("./api/livekit-token");
          const body = await new Promise<string>((resolve, reject) => {
            let raw = "";
            req.on("data", (chunk: Buffer | string) => {
              raw += chunk.toString();
            });
            req.on("end", () => resolve(raw));
            req.on("error", reject);
          });

          await livekitTokenHandler(
            {
              method: req.method,
              headers: req.headers,
              body,
            },
            {
              setHeader(name: string, value: string | string[]) {
                res.setHeader(name, value);
              },
              status(code: number) {
                res.statusCode = code;
                return this;
              },
              json(payload: unknown) {
                if (!res.headersSent) {
                  res.setHeader("Content-Type", "application/json");
                }
                res.end(JSON.stringify(payload));
              },
            }
          );
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            error: error instanceof Error ? error.message : "Unexpected dev server error",
          }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
    plugins: [
      react({
        babel: {
          plugins: ["@lingui/babel-plugin-lingui-macro"],
        },
      }),
      lingui(),
      livekitTokenDevRoute(),
      qrcode(),
      basicSsl(),
      VitePWA({
        registerType: "prompt",
        includeAssets: ["logo.png", "logo-192.png", "logo-512.png"],
        manifest: {
          name: "FightClub",
          short_name: "FightClub",
          description: "A membership-based community platform where people teach what they know, learn what they want, and connect around shared interests.",
          theme_color: "#1B2A4A",
          background_color: "#F4F0E8",
          display: "standalone",
          icons: [
            {
              src: "/logo-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/logo-512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/i,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "supabase-api-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24, // 24 hours
                },
              },
            },
          ],
        },
      }),
    ],
    server: {
      port: 5173,
      strictPort: true,
      host: true,
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || "0.1.0"),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-supabase": ["@supabase/supabase-js"],
            "vendor-radix": [
              "@radix-ui/react-accordion", "@radix-ui/react-alert-dialog",
              "@radix-ui/react-aspect-ratio", "@radix-ui/react-avatar", "@radix-ui/react-checkbox",
              "@radix-ui/react-collapsible", "@radix-ui/react-context-menu",
              "@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-hover-card", "@radix-ui/react-label",
              "@radix-ui/react-menubar", "@radix-ui/react-navigation-menu",
              "@radix-ui/react-popover", "@radix-ui/react-progress",
              "@radix-ui/react-radio-group", "@radix-ui/react-scroll-area",
              "@radix-ui/react-select", "@radix-ui/react-separator",
              "@radix-ui/react-slider", "@radix-ui/react-switch",
              "@radix-ui/react-tabs", "@radix-ui/react-toggle",
              "@radix-ui/react-toggle-group", "@radix-ui/react-tooltip",
            ],
            "vendor-icons": ["lucide-react"],
            "vendor-dates": ["date-fns"],
            "vendor-extras": ["gsap", "@gsap/react"],
          },
        },
      },
      chunkSizeWarningLimit: 800,
    },
  };
});
