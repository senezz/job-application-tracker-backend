import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { createResponseSchema } from "./responses.schema";

export const jobResponsesRouter = Router();
jobResponsesRouter.use(requireAuth);

async function findOwnedApplication(jobId: string, userId: string) {
  return prisma.application.findFirst({
    where: { id: jobId, userId },
    select: { id: true },
  });
}

jobResponsesRouter.get<{ jobId: string }>("/:jobId/responses", async (req, res) => {
  const application = await findOwnedApplication(req.params.jobId, req.userId!);
  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  const responses = await prisma.response.findMany({
    where: { applicationId: application.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(responses);
});

jobResponsesRouter.post<{ jobId: string }>("/:jobId/responses", async (req, res) => {
  const application = await findOwnedApplication(req.params.jobId, req.userId!);
  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  const parsed = createResponseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", issues: parsed.error.issues });
  }

  const response = await prisma.response.create({
    data: { ...parsed.data, applicationId: application.id },
  });
  res.status(201).json(response);
});

export const responseRouter = Router();
responseRouter.use(requireAuth);

responseRouter.delete<{ id: string }>("/:id", async (req, res) => {
  const response = await prisma.response.findUnique({
    where: { id: req.params.id },
    select: { id: true, application: { select: { userId: true } } },
  });

  if (!response) {
    return res.status(404).json({ message: "Response not found" });
  }

  if (response.application.userId !== req.userId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await prisma.response.delete({ where: { id: response.id } });
  res.status(204).send();
});
