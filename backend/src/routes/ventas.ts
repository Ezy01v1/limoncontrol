import { Router } from "express";
import { pool } from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { NuevaVentaInput } from "../types";

export const ventasRouter = Router();

// POST /api/ventas - crea una venta desde el POS
// body: { items: [{producto_id, cantidad}], cliente_id?, metodo_pago, impuesto_porcentaje? }
ventasRouter.post("/", async (req, res) => {
  const { items, cliente_id, metodo_pago, impuesto_porcentaje = 0 } = req.body as NuevaVentaInput;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "La venta necesita al menos un producto." });
  }
  if (!metodo_pago) {
    return res.status(400).json({ error: "metodo_pago es obligatorio (efectivo o tarjeta)." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Traer precios y stock actuales de la BD (nunca confiar en el precio que manda el cliente)
    const productoIds = items.map((i) => i.producto_id);
    const [productos] = await conn.query<RowDataPacket[]>(
      `SELECT id, nombre, precio_unitario, stock_disponible FROM productos WHERE id IN (?) FOR UPDATE`,
      [productoIds]
    );

    const productoPorId = new Map(productos.map((p) => [p.id, p]));

    let subtotal = 0;
    const detalles: { producto_id: number; cantidad: number; precio_unitario: number; subtotal: number }[] = [];

    for (const item of items) {
      const producto = productoPorId.get(item.producto_id);
      if (!producto) {
        throw new Error(`El producto ${item.producto_id} no existe.`);
      }
      if (Number(producto.stock_disponible) < item.cantidad) {
        throw new Error(`Stock insuficiente de "${producto.nombre}". Disponible: ${producto.stock_disponible}.`);
      }

      const lineaSubtotal = Number(producto.precio_unitario) * item.cantidad;
      subtotal += lineaSubtotal;

      detalles.push({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: Number(producto.precio_unitario),
        subtotal: lineaSubtotal,
      });
    }

    const impuesto = Math.round(subtotal * (impuesto_porcentaje / 100) * 100) / 100;
    const total = Math.round((subtotal + impuesto) * 100) / 100;

    const [ventaResult] = await conn.query<ResultSetHeader>(
      `INSERT INTO ventas (cliente_id, subtotal, impuesto, total, metodo_pago) VALUES (?, ?, ?, ?, ?)`,
      [cliente_id || null, subtotal, impuesto, total, metodo_pago]
    );
    const ventaId = ventaResult.insertId;

    for (const d of detalles) {
      await conn.query(
        `INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)`,
        [ventaId, d.producto_id, d.cantidad, d.precio_unitario, d.subtotal]
      );
      await conn.query(
        `UPDATE productos SET stock_disponible = stock_disponible - ? WHERE id = ?`,
        [d.cantidad, d.producto_id]
      );
    }

    await conn.commit();

    res.status(201).json({
      id: ventaId,
      subtotal,
      impuesto,
      total,
      metodo_pago,
      items: detalles,
    });
  } catch (err: any) {
    await conn.rollback();
    console.error(err);
    res.status(400).json({ error: err.message || "No se pudo registrar la venta." });
  } finally {
    conn.release();
  }
});

// GET /api/ventas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD - historial de ventas (para Dashboard y Reportes)
ventasRouter.get("/", async (req, res) => {
  const { desde, hasta } = req.query;

  try {
    let query = `SELECT v.id, v.subtotal, v.impuesto, v.total, v.metodo_pago, v.creado_en,
                        c.nombre AS cliente_nombre
                 FROM ventas v
                 LEFT JOIN clientes c ON c.id = v.cliente_id`;
    const params: any[] = [];

    if (desde && hasta) {
      query += ` WHERE v.creado_en BETWEEN ? AND ?`;
      params.push(desde, hasta);
    }

    query += ` ORDER BY v.creado_en DESC LIMIT 200`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo obtener el historial de ventas." });
  }
});

// GET /api/ventas/:id - detalle completo de una venta (para reimprimir el recibo)
ventasRouter.get("/:id", async (req, res) => {
  try {
    const [venta] = await pool.query<RowDataPacket[]>(
      `SELECT v.*, c.nombre AS cliente_nombre FROM ventas v LEFT JOIN clientes c ON c.id = v.cliente_id WHERE v.id = ?`,
      [req.params.id]
    );
    if (venta.length === 0) return res.status(404).json({ error: "Venta no encontrada." });

    const [detalle] = await pool.query<RowDataPacket[]>(
      `SELECT dv.*, p.nombre AS producto_nombre FROM detalle_venta dv
       JOIN productos p ON p.id = dv.producto_id WHERE dv.venta_id = ?`,
      [req.params.id]
    );

    res.json({ ...venta[0], items: detalle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo obtener el detalle de la venta." });
  }
});
