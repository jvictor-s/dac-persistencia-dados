import pg from "pg";
const { Pool } = pg;

const postgresConfig = {
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT || 5432),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
};

export const pool = new Pool({
  ...postgresConfig,
  database: process.env.PG_DATABASE,
});

const adminPool = new Pool({
  ...postgresConfig,
  database: "postgres",
});

pool.on("connect", () => console.log("Validando as Credenciais do Banco de Dados...\n"));

export async function ensureDatabaseExists() {
  const databaseName = process.env.PG_DATABASE;
  if (!databaseName) {
    throw new Error("PG_DATABASE não está definido no arquivo .env");
  }

  const result = await adminPool.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [databaseName]
  );

  if (result.rowCount === 0) {
    await adminPool.query(`CREATE DATABASE "${databaseName}"`);
    console.log(`Banco de dados criado: ${databaseName}`);
  }
}

export async function connectPostgres() {
  const client = await pool.connect();
  console.log("Postgres Conectado!");
  client.release();
  return client;
}