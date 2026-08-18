import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { productosRouter } from "./routes/productos";
import { ventasRouter } from "./routes/ventas";
import { clientesRouter } from "./routes/clientes";
import { reportesRouter } from "./routes/reportes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true, servicio: "LimonControl API" }));

app.use("/api/productos", productosRouter);
app.use("/api/ventas", ventasRouter);
app.use("/api/clientes", clientesRouter);
app.use("/api/reportes", reportesRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🍋 LimonControl API corriendo en http://localhost:${PORT}`);
});