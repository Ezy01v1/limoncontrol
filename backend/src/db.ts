import mysql from "mysql2/promise";
import dotenv from "dotenv";
 
dotenv.config();
 
// Aiven (y la mayoría de los proveedores en la nube) exigen conexión SSL.
// DB_SSL=true activa esto sin necesitar el certificado CA descargado
// (rejectUnauthorized:false confía en el certificado que manda el servidor).
const usarSSL = process.env.DB_SSL === "true";
 
export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "limoncontrol",
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true, // devuelve los DECIMAL de MySQL como number en vez de string
  ssl: usarSSL ? { rejectUnauthorized: false } : undefined,
});
 