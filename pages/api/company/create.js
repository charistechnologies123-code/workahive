import prisma from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth";
import { createNotification } from "../../../lib/notifications";
import { logReferralActivity } from "../../../lib/referrals";

const normalize = (v) => {
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/\s+/g, " ");
  return s.length ? s : null;
};

const normalizeExtraSocials = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label = normalize(item.label);
      const url = normalize(item.url);
      if (!label || !url) return null;
      return { label, url };
    })
    .filter(Boolean);
};

const isLikelyUrl = (v) => {
  const s = normalize(v);
  if (!s) return false;
  // simple, permissive URL check
  return /^https?:\/\/\S+\.\S+$/i.test(s) || /^[a-z0-9.-]+\.[a-z]{2,}(\S*)$/i.test(s);
};

export default requireAuth(
  async function handler(req, res) {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method not allowed" });

    const user = req.user;
    if (user.role !== "EMPLOYER")
      return res.status(403).json({ error: "Employers only" });

    const raw = req.body || {};

    const name = normalize(raw.name);
    const description = normalize(raw.description);
    const industry = normalize(raw.industry);
    const location = normalize(raw.location);

    const website = normalize(raw.website);
    const regNo = normalize(raw.regNo);
    const proofNote = normalize(raw.proofNote);

    const facebook = normalize(raw.facebook);
    const instagram = normalize(raw.instagram);
    const github = normalize(raw.github);
    const linkedin = normalize(raw.linkedin);
    const x = normalize(raw.x);
    const youtube = normalize(raw.youtube);
    const extraSocials = normalizeExtraSocials(raw.extraSocials);

    if (!name) return res.status(400).json({ error: "Company name is required" });

    // Recommended: make description required for safer verification
    if (!description) {
      return res.status(400).json({
        error: "Company description is required for verification.",
      });
    }

    // RegNo or proof note required
    if (!regNo && !proofNote) {
      return res.status(400).json({
        error: "Provide a Registration Number (Reg No) or an Alternative Proof Note.",
      });
    }

    // At least one social link required
    const socialLinks = [
      facebook,
      instagram,
      github,
      linkedin,
      x,
      youtube,
      ...extraSocials.map((item) => item.url),
    ].filter(Boolean);
    if (socialLinks.length === 0) {
      return res.status(400).json({
        error:
          "Provide at least one social media link before creating your company profile.",
      });
    }

    // Light URL validation for links provided
    const invalidLinks = [];
    const checkLink = (label, value) => {
      if (value && !isLikelyUrl(value)) invalidLinks.push(label);
    };

    checkLink("website", website);
    checkLink("facebook", facebook);
    checkLink("instagram", instagram);
    checkLink("github", github);
    checkLink("linkedin", linkedin);
    checkLink("x", x);
    checkLink("youtube", youtube);
    extraSocials.forEach((item, index) => checkLink(`extra social #${index + 1} (${item.label})`, item.url));

    if (invalidLinks.length > 0) {
      return res.status(400).json({
        error: `Invalid URL format for: ${invalidLinks.join(", ")}. Include https:// or a valid domain.`,
      });
    }

    try {
      const existing = await prisma.company.findUnique({
        where: { ownerId: user.id },
      });
      if (existing)
        return res.status(400).json({ error: "Company profile already exists." });

      const company = await prisma.company.create({
        data: {
          name,
          description,
          industry,
          location,
          website,
          regNo,
          proofNote,
          facebook,
          instagram,
          github,
          linkedin,
          x,
          youtube,
          extraSocials,
          ownerId: user.id,
          // verified stays false by default; admins verify manually
        },
      });

      // --- CREATE NOTIFICATIONS ---
      try {
        // Notify employer about company creation
        await createNotification(user.id, "COMPANY_CREATED", {
          companyName: name,
        });

        // Notify admins about company awaiting verification
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN" },
          select: { id: true },
        });

        for (const admin of admins) {
          await createNotification(admin.id, "COMPANY_AWAITING_VERIFICATION", {
            companyName: name,
            ownerName: user.name,
          });
        }
      } catch (notificationError) {
        console.error("Notification creation failed:", notificationError);
      }

      try {
        await logReferralActivity(
          user.id,
          "COMPANY_CREATED",
          "Created company profile",
          `${name} company profile was created and is awaiting verification.`,
          { companyId: company.id, companyName: name }
        );
      } catch (activityError) {
        console.error("Referral activity logging failed:", activityError);
      }

      return res.status(201).json({ company });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Something went wrong" });
    }
  },
  ["EMPLOYER"]
);
