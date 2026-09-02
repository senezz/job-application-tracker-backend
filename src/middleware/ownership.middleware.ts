import { RequestHandler } from "express";
import { prisma } from "../prisma";

export const requireJobOwnership: RequestHandler<{ id: string }> = async (req, res, next) => {
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
    select: { userId: true },
  });

  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  if (application.userId !== req.userId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};
