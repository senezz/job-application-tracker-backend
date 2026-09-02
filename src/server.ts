import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./auth/auth.router";
import { jobsRouter } from "./jobs/jobs.router";
import { jobResponsesRouter, responseRouter } from "./responses/responses.router";
import { gmailRouter } from "./gmail/gmail.router";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/jobs", jobsRouter);
app.use("/jobs", jobResponsesRouter);
app.use("/responses", responseRouter);
app.use("/gmail", gmailRouter);

app.use(errorHandler);

const port = process.env.PORT ?? 4000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
