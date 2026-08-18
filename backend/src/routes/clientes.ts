import { Router } from "express";
import { pool } from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const clientesRouter = Router();

// GET /api/clientes?buscar=texto
clientesRouter.get("/", async (req, res) => {
  const { buscar } = req.query;
  try {
    let query = `SELECT c.id, c.nombre, c.telefono, c.region, c.notas,
                        COUNT(v.id) AS total_compras
                 FROM clientes c
                 LEFT JOIN ventas v ON v.cliente_id = c.id`;
    const params: any[] = [];

    if (buscar) {
      query += ` WHERE c.nombre LIKE ? OR c.telefono LIKE ?`;
      params.push(`%${buscar}%`, `%${buscar}%`);
    }

    query += ` GROUP BY c.id ORDER BY c.nombre`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo obtener el listado de clientes." });
  }
});

// GET /api/clientes/:id - detalle + historial de compras (para el modulo de Clientes)
clientesRouter.get("/:id", async (req, res) => {
  try {
    const [cliente] = await pool.query<RowDataPacket[]>(
      `SELECT id, nombre, telefono, region, notas FROM clientes WHERE id = ?`,
      [req.params.id]
    );
    if (cliente.length === 0) return res.status(404).json({ error: "Cliente no encontrado." });

    const [compras] = await pool.query<RowDataPacket[]>(
      `SELECT id, subtotal, impuesto, total, metodo_pago, creado_en
       FROM ventas WHERE cliente_id = ? ORDER BY creado_en DESC LIMIT 50`,
      [req.params.id]
    );

    res.json({ ...cliente[0], compras });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo obtener el detalle del cliente." });
  }
});

// POST /api/clientes - crear cliente rapido desde el POS o desde el modulo de Clientes
clientesRouter.post("/", async (req, res) => {
  const { nombre, telefono, region, notas } = req.body;
  if (!nombre) return res.status(400).json({ error: "nombre es obligatorio." });

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO clientes (nombre, telefono, region, notas) VALUES (?, ?, ?, ?)`,
      [nombre, telefono || null, region || null, notas || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo crear el cliente." });
  }
});

// PUT /api/clientes/:id - editar datos de contacto de un cliente
clientesRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, telefono, region, notas } = req.body;

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE clientes SET
        nombre = COALESCE(?, nombre),
        telefono = COALESCE(?, telefono),
        region = COALESCE(?, region),
        notas = COALESCE(?, notas)
       WHERE id = ?`,
      [nombre, telefono, region, notas, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cliente no encontrado." });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo actualizar el cliente." });
  }
});

// DELETE /api/clientes/:id
clientesRouter.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM clientes WHERE id = ?`,
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cliente no encontrado." });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo eliminar el cliente." });
  }
});