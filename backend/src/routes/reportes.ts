import { Router } from "express";
import { pool } from "../db";
import { RowDataPacket } from "mysql2";

export const reportesRouter = Router();

function rangoPorDefecto(desde?: unknown, hasta?: unknown) {
  if (typeof desde === "string" && typeof hasta === "string" && desde && hasta) {
    return { desde, hasta };
  }
  const hoy = new Date();
  const hace30 = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
  return {
    desde: hace30.toISOString().slice(0, 10),
    hasta: hoy.toISOString().slice(0, 10) + " 23:59:59",
  };
}

// GET /api/reportes?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
// Si no se envian fechas, usa los ultimos 30 dias.
reportesRouter.get("/", async (req, res) => {
  const { desde, hasta } = rangoPorDefecto(req.query.desde, req.query.hasta);

  try {
    const [[totales]] = await pool.query<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS cantidad_ventas,
         COALESCE(SUM(subtotal), 0) AS subtotal,
         COALESCE(SUM(impuesto), 0) AS impuesto,
         COALESCE(SUM(total), 0) AS total
       FROM ventas
       WHERE creado_en BETWEEN ? AND ?`,
      [desde, hasta]
    );

    const [ventasPorDia] = await pool.query<RowDataPacket[]>(
      `SELECT DATE(creado_en) AS fecha, COUNT(*) AS cantidad, COALESCE(SUM(total), 0) AS total
       FROM ventas
       WHERE creado_en BETWEEN ? AND ?
       GROUP BY DATE(creado_en)
       ORDER BY fecha`,
      [desde, hasta]
    );

    const [porMetodoPago] = await pool.query<RowDataPacket[]>(
      `SELECT metodo_pago, COUNT(*) AS cantidad, COALESCE(SUM(total), 0) AS total
       FROM ventas
       WHERE creado_en BETWEEN ? AND ?
       GROUP BY metodo_pago`,
      [desde, hasta]
    );

    const [topProductos] = await pool.query<RowDataPacket[]>(
      `SELECT p.id, p.nombre, p.unidad_venta,
              COALESCE(SUM(dv.cantidad), 0) AS cantidad_vendida,
              COALESCE(SUM(dv.subtotal), 0) AS total_vendido
       FROM detalle_venta dv
       JOIN productos p ON p.id = dv.producto_id
       JOIN ventas v ON v.id = dv.venta_id
       WHERE v.creado_en BETWEEN ? AND ?
       GROUP BY p.id
       ORDER BY total_vendido DESC
       LIMIT 10`,
      [desde, hasta]
    );

    const [topClientes] = await pool.query<RowDataPacket[]>(
      `SELECT c.id, c.nombre,
              COUNT(v.id) AS cantidad_compras,
              COALESCE(SUM(v.total), 0) AS total_gastado
       FROM ventas v
       JOIN clientes c ON c.id = v.cliente_id
       WHERE v.creado_en BETWEEN ? AND ?
       GROUP BY c.id
       ORDER BY total_gastado DESC
       LIMIT 5`,
      [desde, hasta]
    );

    res.json({
      rango: { desde, hasta },
      totales,
      ventasPorDia,
      porMetodoPago,
      topProductos,
      topClientes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo generar el reporte." });
  }
});