import { pool } from "../config/connectPostgres.js";
import { User, createUsersTable } from "../model/User.js";

const updateLock = {
  active: false,
  queue: [],
};

function assertFailure(failureAt, point) {
  if (failureAt === point) {
    throw new Error(`Falha simulada na fase ${point}`);
  }
}

async function withUpdateLock(operation) {
  if (updateLock.active) {
    await new Promise((resolve) => updateLock.queue.push(resolve));
  }
  updateLock.active = true;
  try {
    return await operation();
  } finally {
    updateLock.active = false;
    updateLock.queue.shift()?.();
  }
}

export async function insertUserScenarioOne({ name, email, failureAt }) {
  await createUsersTable();

  const client = await pool.connect();
  let mongoId;
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
      [name, email]
    );
    const userId = result.rows[0].id;

    try {
      assertFailure(failureAt, "mongodb");
      const user = await User.create({ name, email });
      mongoId = user._id;
      assertFailure(failureAt, "postgres-commit");
      await client.query("COMMIT");
      return { status: "COMMITTED", userId };
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Falha ao reverter a transação PostgreSQL:", rollbackError.message);
      }
      if (mongoId) {
        try {
          await User.deleteOne({ _id: mongoId });
        } catch (compensationError) {
          console.error("Falha na compensação do MongoDB:", compensationError.message);
          throw new Error(
            `${error.message}; compensação MongoDB falhou: ${compensationError.message}`
          );
        }
      }
      throw error;
    }
  } finally {
    client.release();
  }
}

export async function insertUserScenarioTwo({ name, email, failureAt }) {
  await createUsersTable();

  assertFailure(failureAt, "mongodb");
  const user = await User.create({ name, email });

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    assertFailure(failureAt, "postgres");
    await client.query(
      "INSERT INTO users (name, email) VALUES ($1, $2)",
      [name, email]
    );
    await client.query("COMMIT");
    return { status: "COMMITTED", userId: user._id };
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Falha ao reverter a transação PostgreSQL:", rollbackError.message);
      }
    }
    await User.deleteOne({ _id: user._id });
    throw error;
  } finally {
    client?.release();
  }
}

export async function updateUserScenarioThree({
  email,
  name,
  failureAt,
}) {
  return withUpdateLock(async () => {
    await createUsersTable();
    const mongoBefore = await User.findOne({ email }).lean();
    if (!mongoBefore) throw new Error("Usuário não encontrado no MongoDB");

    const client = await pool.connect();
    let mongoUpdated = false;
    try {
      await client.query("BEGIN");
      const postgresBeforeResult = await client.query(
        "SELECT id, name, email FROM users WHERE email = $1 FOR UPDATE",
        [email]
      );
      const postgresBefore = postgresBeforeResult.rows[0];
      if (!postgresBefore) {
        await client.query("ROLLBACK");
        throw new Error("Usuário não encontrado no PostgreSQL");
      }

      assertFailure(failureAt, "prepare");
      await client.query(
        "UPDATE users SET name = $1 WHERE email = $2",
        [name, email]
      );

      assertFailure(failureAt, "mongodb");
      await User.updateOne({ _id: mongoBefore._id }, { $set: { name } });
      mongoUpdated = true;

      assertFailure(failureAt, "postgres-commit");
      await client.query("COMMIT");
      return {
        status: "COMMITTED",
        postgres: { ...postgresBefore, name },
        mongodb: { ...mongoBefore, name },
      };
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Falha ao reverter a transação PostgreSQL:", rollbackError.message);
      }
      if (mongoUpdated) {
        try {
          await User.updateOne(
            { _id: mongoBefore._id },
            { $set: { name: mongoBefore.name } }
          );
        } catch (compensationError) {
          console.error("Falha na compensação do MongoDB:", compensationError.message);
          throw new Error(
            `${error.message}; compensação MongoDB falhou: ${compensationError.message}`
          );
        }
      }
      throw error;
    } finally {
      client.release();
    }
  });
}

export async function listConsistentUsers() {
  return withUpdateLock(async () => {
    const [postgresResult, mongoUsers] = await Promise.all([
      pool.query("SELECT id, name, email, created_at FROM users ORDER BY id"),
      User.find({}, { name: 1, email: 1, createdAt: 1 }).sort({ email: 1 }).lean(),
    ]);
    const mongoByEmail = new Map(mongoUsers.map((user) => [user.email, user]));
    const postgresByEmail = new Map(postgresResult.rows.map((user) => [user.email, user]));
    const users = postgresResult.rows.map((postgresUser) => {
      const mongoUser = mongoByEmail.get(postgresUser.email);
      return {
        email: postgresUser.email,
        postgres: postgresUser,
        mongodb: mongoUser || null,
        consistent: Boolean(mongoUser && mongoUser.name === postgresUser.name),
      };
    });
    for (const mongoUser of mongoUsers) {
      if (!postgresByEmail.has(mongoUser.email)) {
        users.push({
          email: mongoUser.email,
          postgres: null,
          mongodb: mongoUser,
          consistent: false,
        });
      }
    }
    return users;
  });
}
