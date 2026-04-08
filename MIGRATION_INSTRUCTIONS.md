#URGENT: Database Migration Required

## Current Issue

The code references jobseeker verification database fields that don't exist yet in your PostgreSQL database. Prisma client is throwing validation errors because the schema was updated but the migration wasn't applied.

## Fix (Run These Commands)

###  Step 1: Create and Apply Migration

```bash
npx prisma migrate dev --name add_jobseeker_verification
```

If that doesn't work, try:

```bash
npx prisma db push
```

### Step 2: Regenerate Prisma Client

```bash
npx prisma generate
```

### Step 3: Restart Dev Server

```bash
npm run dev
```

## What Was Done

❌ **Temporarily Disabled:**
- Jobseeker verification form (shows "Coming Soon" message)
- Admin jobseeker verification dashboard (hidden for now)
- Application verification check (removed for now)

✅ **Fixed:**
- React Image `fetchPriority` warning - changed to `priority` prop
- API endpoints to not query non-existent fields

## After Migration Is Applied

Once the migration completes:

1. Uncomment the verification form in `pages/jobseeker/profile.js`
2. Re-enable `JobseekersAdmin` component in `pages/admin/dashboard.js`
3. Re-enable the verification check in `pages/api/applications/apply.js`
4. Jobseeker verification will be fully functional

## Database Changes

The migration will add these columns to the `User` table:
- `verificationStatus` (UNVERIFIED, PENDING, VERIFIED, REJECTED)
- `verificationDocumentType` (document type selected)
- `verificationDocumentUrl` (uploaded file path)
- `verificationExplanation` (explanation text if no document)
- `verificationRequestedAt` (timestamp)
- `verificationReviewedAt` (timestamp)
- `verificationReviewNote` (admin notes)

## Questions?

If the migration command fails, check:
1. `.env.local` has valid `DATABASE_URL`
2. You can connect to your PostgreSQL database
3. Run `npx prisma db inspect` to see current schema

