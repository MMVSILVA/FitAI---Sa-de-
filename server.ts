import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Project Hub Educacional API is running" });
  });

  // Proxy-like routes for projects and activities (optional, as we use Firebase frontend)
  app.get("/api/projetos", (req, res) => {
    res.json({ message: "Use o serviço de projetos no frontend para integração direta com Firestore." });
  });

  app.get("/api/atividades", (req, res) => {
    res.json({ message: "Use o serviço de atividades no frontend para integração direta com Firestore." });
  });

  // IA Route (as requested, but we prioritize frontend service for Gemini)
  app.post("/api/ia", async (req, res) => {
    res.json({ message: "Integração com Gemini recomendada via frontend service para melhor performance e conformidade." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
