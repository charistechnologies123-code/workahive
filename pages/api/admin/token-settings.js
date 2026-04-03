import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    const free = await prisma.appSetting.findUnique({
      where: { key: "FREE_TOKENS_NEW_EMPLOYER" },
    });
    const perJob = await prisma.appSetting.findUnique({
      where: { key: "TOKENS_PER_JOB_POST" },
    });

    return res.json({
      freeTokensNewEmployer: free?.valueInt ?? 0,
      tokensPerJobPost: perJob?.valueInt ?? 1,
    });
  }

  if (req.method === "PATCH") {
    const { freeTokensNewEmployer, tokensPerJobPost } = req.body;

    if (
      typeof freeTokensNewEmployer !== "number" ||
      typeof tokensPerJobPost !== "number" ||
      freeTokensNewEmployer < 0 ||
      tokensPerJobPost < 1
    ) {
      return res.status(400).json({ error: "Invalid values" });
    }

    await prisma.appSetting.upsert({
      where: { key: "FREE_TOKENS_NEW_EMPLOYER" },
      update: { valueInt: freeTokensNewEmployer },
      create: { key: "FREE_TOKENS_NEW_EMPLOYER", valueInt: freeTokensNewEmployer },
    });

    await prisma.appSetting.upsert({
      where: { key: "TOKENS_PER_JOB_POST" },
      update: { valueInt: tokensPerJobPost },
      create: { key: "TOKENS_PER_JOB_POST", valueInt: tokensPerJobPost },
    });

    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}