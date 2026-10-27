import { Router } from "express";
import { insertUserScenarioOne, insertUserScenarioTwo } from "../service/userService.js";

export const userRouter = Router();

// Cenário 1
userRouter.post("/scenario1", async (req, res) => {
  try {
    const { name, email } = req.body;
    const result = await insertUserScenarioOne({ name, email });
    return res.status(201).json({ status: result.status, userId: result.userId });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Cenário 2
userRouter.post("/scenario2", async (req, res) => {
  try {
    const { name, email } = req.body;
    const result = await insertUserScenarioTwo({ name, email });
    return res.status(201).json({ status: result.status, userId: result.userId });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});
