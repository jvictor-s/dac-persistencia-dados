import { Router } from "express";
import { insertUserScenarioOne, insertUserScenarioTwo } from "../service/userService.js";

export const userRouter = Router();

// Cenário 1: insere no Postgres primeiro, depois no MongoDB; rollback no Postgres se o Mongo falhar.
userRouter.post("/scenario1", async (req, res) => {
  try {
    const { name, email } = req.body;
    const result = await insertUserScenarioOne({ name, email });
    return res.status(201).json({ status: result.status, userId: result.userId });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Cenário 2: insere no MongoDB primeiro, depois no Postgres; rollback no Mongo se o Postgres falhar.
userRouter.post("/scenario2", async (req, res) => {
  try {
    const { name, email } = req.body;
    const result = await insertUserScenarioTwo({ name, email });
    return res.status(201).json({ status: result.status, userId: result.userId });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});
