-- LimonControl - esquema de base de datos
-- Ejecutar con: npm run db:init  (o pegar este archivo en tu cliente MySQL favorito)

CREATE DATABASE IF NOT EXISTS limoncontrol CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE limoncontrol;

-- Variedades / lotes de limon que se venden
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  categoria VARCHAR(50) NOT NULL DEFAULT 'General',
  unidad_venta ENUM('unidad', 'kg') NOT NULL DEFAULT 'unidad',
  precio_unitario DECIMAL(10,2) NOT NULL,
  stock_disponible DECIMAL(10,2) NOT NULL DEFAULT 0,
  estado ENUM('fresco', 'madurando', 'bajo_stock', 'agotado') NOT NULL DEFAULT 'fresco',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Clientes que compran por WhatsApp u otros medios
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(30),
  region VARCHAR(100),
  notas VARCHAR(255),
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Encabezado de cada venta (ticket del POS)
CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  impuesto DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  metodo_pago ENUM('efectivo', 'tarjeta') NOT NULL DEFAULT 'efectivo',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ventas_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
);

-- Lineas de detalle de cada venta
CREATE TABLE IF NOT EXISTS detalle_venta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_detalle_venta FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Historial de entradas de stock (boton "Add Stock" del Inventario)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  tipo ENUM('entrada', 'ajuste') NOT NULL DEFAULT 'entrada',
  cantidad DECIMAL(10,2) NOT NULL,
  costo_unitario DECIMAL(10,2),
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_movimiento_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Producto inicial: el limon que realmente vendes hoy por WhatsApp.
-- Ajusta o agrega mas variedades luego desde el modulo de Inventario.
INSERT INTO productos (nombre, categoria, unidad_venta, precio_unitario, stock_disponible, estado)
SELECT 'Limón', 'General', 'unidad', 2.00, 500, 'fresco'
WHERE NOT EXISTS (SELECT 1 FROM productos);
