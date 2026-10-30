import mysql from "mysql2/promise";

// Satu pool koneksi dipakai bersama oleh semua route
export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "kekos",
  waitForConnections: true,
  connectionLimit: 10,
});
