import { Router } from "express";
import { pool } from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const productosRouter = Router();

// GET /api/productos - lista de productos activos (usado por el grid del POS y por Inventario)
productosRouter.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, nombre, categoria, unidad_venta, precio_unitario, stock_disponible, estado, activo
       FROM productos
       WHERE activo = 1
       ORDER BY categoria, nombre`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo obtener el listado de productos." });
  }
});

// POST /api/productos - crear una nueva variedad/lote de limon
productosRouter.post("/", async (req, res) => {
  const { nombre, categoria, unidad_venta, precio_unitario, stock_disponible, estado } = req.body;

  if (!nombre || !precio_unitario) {
    return res.status(400).json({ error: "nombre y precio_unitario son obligatorios." });
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO productos (nombre, categoria, unidad_venta, precio_unitario, stock_disponible, estado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        categoria || "General",
        unidad_venta || "unidad",
        precio_unitario,
        stock_disponible || 0,
        estado || "fresco",
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo crear el producto." });
  }
});

// PUT /api/productos/:id - editar nombre, categoria, precio, unidad o estado de un producto
productosRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, categoria, unidad_venta, precio_unitario, estado } = req.body;

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE productos SET
        nombre = COALESCE(?, nombre),
        categoria = COALESCE(?, categoria),
        unidad_venta = COALESCE(?, unidad_venta),
        precio_unitario = COALESCE(?, precio_unitario),
        estado = COALESCE(?, estado)
       WHERE id = ?`,
      [nombre, categoria, unidad_venta, precio_unitario, estado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo actualizar el producto." });
  }
});

// DELETE /api/productos/:id - desactivar un producto (no se borra, para no perder historial de ventas)
productosRouter.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE productos SET activo = 0 WHERE id = ?`,
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo desactivar el producto." });
  }
});

// POST /api/productos/:id/stock - registrar entrada de stock (boton "Add Stock")
productosRouter.post("/:id/stock", async (req, res) => {
  const { id } = req.params;
  const { cantidad, costo_unitario } = req.body;

  if (!cantidad || Number(cantidad) <= 0) {
    return res.status(400).json({ error: "cantidad debe ser mayor a 0." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE productos SET stock_disponible = stock_disponible + ? WHERE id = ?`,
      [cantidad, id]
    );

    await conn.query(
      `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, costo_unitario)
       VALUES (?, 'entrada', ?, ?)`,
      [id, cantidad, costo_unitario || null]
    );

    await conn.commit();
    res.status(201).json({ ok: true });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "No se pudo registrar la entrada de stock." });
  } finally {
    conn.release();
  }
});
