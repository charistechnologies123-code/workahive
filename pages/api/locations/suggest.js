import prisma from "../../../lib/prisma";

function normalize(s) {
  return (s || "").toString().trim();
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const q = normalize(req.query.q).toLowerCase();

  // Load curated locations first (active only)
  const curated = await prisma.locationOption.findMany({
    where: { isActive: true },
    select: { name: true },
    orderBy: { name: "asc" },
    take: 200,
  });

  // Load from existing data (jobs + companies)
  const jobs = await prisma.job.findMany({
    select: { location: true },
    distinct: ["location"],
    take: 200,
  });

  const companies = await prisma.company.findMany({
    select: { location: true },
    distinct: ["location"],
    take: 200,
  });

  const all = [
    ...curated.map((x) => x.name),
    ...jobs.map((x) => x.location),
    ...companies.map((x) => x.location),
  ]
    .map(normalize)
    .filter(Boolean);

  // de-dup (case-insensitive)
  const map = new Map();
  for (const name of all) {
    const key = name.toLowerCase();
    if (!map.has(key)) map.set(key, name);
  }

  let suggestions = Array.from(map.values());

  // filter by q
  if (q) {
    suggestions = suggestions.filter((x) => x.toLowerCase().includes(q));
  }

  // keep it small for UI
  suggestions = suggestions.slice(0, 30);

  return res.json({ suggestions });
}