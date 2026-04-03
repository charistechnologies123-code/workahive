WITH ranked AS (
  SELECT
    ctid,
    ROW_NUMBER() OVER (
      PARTITION BY "jobId", "applicantId"
      ORDER BY "createdAt" DESC, "id" DESC
    ) AS rn
  FROM "Application"
  WHERE "applicantId" IS NOT NULL
)
DELETE FROM "Application"
WHERE ctid IN (SELECT ctid FROM ranked WHERE rn > 1);