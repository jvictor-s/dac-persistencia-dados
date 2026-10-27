import pg from "pg";
const { Pool } = pg;

export const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD, 
  database: process.env.PG_DATABASE,
});

pool.on("connect", () => console.log("Validando as Credenciais do Banco de Dados...\n"));

export async function connectPostgres() {
  const client = await pool.connect();
  console.log("Postgres Conectado!");
  client.release();
  return client;
}