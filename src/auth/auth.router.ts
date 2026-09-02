import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { registerSchema, loginSchema } from "./auth.schema";
import { hashPassword, comparePassword } from "./password";
import { signToken } from "./jwt";
import { requireAuth } from "../middleware/auth.middleware";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", issues: parsed.error.issues });
  }

  const { email, password } = parsed.data;
  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: { email, passwordHash },
    });

    const token = signToken(user.id);
    res.status(201).json({ token });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ message: "Email already registered" });
    }
    throw err;
  }
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", issues: parsed.error.issues });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken(user.id);
  res.json({ token });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.userId },
    select: { id: true, email: true, createdAt: true },
  });
  res.json(user);
});
