import express from "express";
import cors from "cors";
import "dotenv/config";
import { userRouter } from "./src/routes/userRoutes.js";

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

app.use("/users", userRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
