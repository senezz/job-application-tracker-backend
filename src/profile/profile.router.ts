import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { updateProfileSchema } from "./profile.schema";

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.get("/", async (req, res) => {
  const profile = await prisma.userProfile.upsert({
    where: { userId: req.userId! },
    create: { userId: req.userId! },
    update: {},
  });
  res.json(profile);
});

profileRouter.put("/", async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", issues: parsed.error.issues });
  }

  const profile = await prisma.userProfile.upsert({
    where: { userId: req.userId! },
    create: { userId: req.userId!, ...parsed.data },
    update: parsed.data,
  });
  res.json(profile);
});
