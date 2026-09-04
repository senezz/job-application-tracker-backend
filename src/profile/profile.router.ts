import { Router } from "express";
import multer from "multer";
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { updateProfileSchema } from "./profile.schema";
import { r2Client, R2_BUCKET_NAME } from "../storage/r2.client";

export const profileRouter = Router();

profileRouter.use(requireAuth);

const CV_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!CV_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Unsupported file type. Allowed: pdf, doc, docx"));
    }
    cb(null, true);
  },
});

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

profileRouter.post("/cv", (req, res, next) => {
  upload.single("cv")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded (field name: cv)" });
  }

  const cvKey = `cv/${req.userId}/${Date.now()}-${req.file.originalname}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: cvKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }),
  );

  const profile = await prisma.userProfile.upsert({
    where: { userId: req.userId! },
    create: { userId: req.userId!, cvKey, cvName: req.file.originalname },
    update: { cvKey, cvName: req.file.originalname },
  });
  res.json(profile);
});

profileRouter.get("/cv", async (req, res) => {
  const profile = await prisma.userProfile.findUnique({ where: { userId: req.userId! } });
  if (!profile?.cvKey) {
    return res.status(404).json({ message: "No CV uploaded" });
  }

  const url = await getSignedUrl(
    r2Client,
    new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: profile.cvKey }),
    { expiresIn: 300 },
  );
  res.json({ url });
});

profileRouter.delete("/cv", async (req, res) => {
  const profile = await prisma.userProfile.findUnique({ where: { userId: req.userId! } });
  if (!profile?.cvKey) {
    return res.status(404).json({ message: "No CV uploaded" });
  }

  await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: profile.cvKey }));

  await prisma.userProfile.update({
    where: { userId: req.userId! },
    data: { cvKey: null, cvName: null },
  });
  res.status(204).send();
});
