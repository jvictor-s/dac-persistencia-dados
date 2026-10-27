import { pool } from "../config/connectPostgres.js";
import { User, createUsersTable } from "../model/User.js";

export async function insertUserScenarioOne({ name, email }) {
  await createUsersTable();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
      [name, email]
    );
    const userId = result.rows[0].id;

    try {
      await User.create({ name, email });
      await client.query("COMMIT");
      return { status: "COMMITTED", userId };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } finally {
    client.release();
  }
}


export async function insertUserScenarioTwo({ name, email }) {
  await createUsersTable();

  const user = await User.create({ name, email });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "INSERT INTO users (name, email) VALUES ($1, $2)",
      [name, email]
    );
    await client.query("COMMIT");
    return { status: "COMMITTED", userId: user._id };
  } catch (error) {
    await client.query("ROLLBACK");
    await User.findOneAndDelete({ email });
    throw error;
  } finally {
    client.release();
  }
}
