import { Router } from "express";
import {
  insertUserScenarioOne,
  insertUserScenarioTwo,
  updateUserScenarioThree,
  listConsistentUsers,
} from "../service/userService.js";
import { getConsistencyState } from "../service/consistencyMonitor.js";

export const userRouter = Router();

// Cenário 1
userRouter.post("/scenario1", async (req, res) => {
  try {
    const { name, email, failureAt } = req.body;
    const result = await insertUserScenarioOne({ name, email, failureAt });
    return res.status(201).json({ status: result.status, userId: result.userId });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Cenário 2
userRouter.post("/scenario2", async (req, res) => {
  try {
    const { name, email, failureAt } = req.body;
    const result = await insertUserScenarioTwo({ name, email, failureAt });
    return res.status(201).json({ status: result.status, userId: result.userId });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

userRouter.put("/scenario3/:email", async (req, res) => {
  try {
    const result = await updateUserScenarioThree({
      email: req.params.email,
      name: req.body.name,
      failureAt: req.body.failureAt,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

userRouter.get("/consistent", async (_req, res) => {
  try {
    return res.status(200).json(await listConsistentUsers());
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

userRouter.get("/monitor", (_req, res) => {
  return res.status(200).json(getConsistencyState());
});
