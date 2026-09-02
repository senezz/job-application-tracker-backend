import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { createOAuthClient, GMAIL_SCOPES } from "./google.client";

export const gmailRouter = Router();

gmailRouter.get("/connect", requireAuth, (req, res) => {
  const oauthClient = createOAuthClient();
  const state = Buffer.from(JSON.stringify({ userId: req.userId })).toString("base64url");

  const url = oauthClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
    state,
  });

  res.json({ url });
});

gmailRouter.get("/callback", async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).json({ message: `Google OAuth error: ${error}` });
  }
  if (typeof code !== "string" || typeof state !== "string") {
    return res.status(400).json({ message: "Missing code or state" });
  }

  let userId: string;
  try {
    ({ userId } = JSON.parse(Buffer.from(state, "base64url").toString("utf8")));
  } catch {
    return res.status(400).json({ message: "Invalid state" });
  }

  const oauthClient = createOAuthClient();

  let tokens;
  try {
    ({ tokens } = await oauthClient.getToken(code));
  } catch {
    return res.status(400).json({ message: "Failed to exchange authorization code" });
  }

  if (!tokens.refresh_token) {
    return res.status(400).json({
      message:
        "Google did not return a refresh token. Revoke app access at myaccount.google.com/permissions and reconnect.",
    });
  }

  await prisma.gmailAccount.upsert({
    where: { userId },
    create: {
      userId,
      refreshToken: tokens.refresh_token,
      scope: tokens.scope ?? GMAIL_SCOPES.join(" "),
    },
    update: {
      refreshToken: tokens.refresh_token,
      scope: tokens.scope ?? GMAIL_SCOPES.join(" "),
    },
  });

  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
  res.redirect(`${frontendUrl}/settings?gmail=connected`);
});

gmailRouter.get("/token", requireAuth, async (req, res) => {
  const account = await prisma.gmailAccount.findUnique({ where: { userId: req.userId } });
  if (!account) {
    return res.json({ connected: false });
  }

  const oauthClient = createOAuthClient();
  oauthClient.setCredentials({ refresh_token: account.refreshToken });

  try {
    await oauthClient.getAccessToken();
  } catch (err: any) {
    if (err?.response?.data?.error === "invalid_grant") {
      await prisma.gmailAccount.delete({ where: { userId: req.userId } });
      return res.status(401).json({ message: "token_revoked" });
    }
    throw err;
  }

  res.json({ connected: true, scope: account.scope, connectedAt: account.connectedAt });
});
