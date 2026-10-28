import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectMongo } from "./src/config/connectMongo.js";
import { ensureDatabaseExists } from "./src/config/connectPostgres.js";
import { createUsersTable } from "./src/model/User.js";
import { userRouter } from "./src/routes/userRoutes.js";
import { startConsistencyMonitor } from "./src/service/consistencyMonitor.js";

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

app.use("/users", userRouter);

async function start() {
  await connectMongo();
  await ensureDatabaseExists();
  await createUsersTable();
  startConsistencyMonitor(10);
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch((error) => {
  console.error("Falha ao iniciar a aplicação:", error);
  process.exitCode = 1;
});
