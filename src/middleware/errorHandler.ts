import { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Resource already exists" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Resource not found" });
    }
  }

  console.error(err);
  res.status(500).json({ message: "Internal server error" });
};
