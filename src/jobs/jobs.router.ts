import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { requireJobOwnership } from "../middleware/ownership.middleware";
import { createJobSchema, updateJobSchema } from "./jobs.schema";

export const jobsRouter = Router();

jobsRouter.use(requireAuth);

jobsRouter.get("/", async (req, res) => {
  const applications = await prisma.application.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(applications);
});

jobsRouter.post("/", async (req, res) => {
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", issues: parsed.error.issues });
  }

  const application = await prisma.application.create({
    data: { ...parsed.data, userId: req.userId! },
  });
  res.status(201).json(application);
});

jobsRouter.patch<{ id: string }>("/:id", requireJobOwnership, async (req, res) => {
  const parsed = updateJobSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", issues: parsed.error.issues });
  }

  const application = await prisma.application.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(application);
});

jobsRouter.delete<{ id: string }>("/:id", requireJobOwnership, async (req, res) => {
  await prisma.application.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
