import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./auth/auth.router";
import { jobsRouter } from "./jobs/jobs.router";

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/jobs", jobsRouter);

const port = process.env.PORT ?? 4000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
