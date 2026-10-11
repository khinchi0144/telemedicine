-- One prescription per appointment (Task 1K)
--
-- Adds a UNIQUE constraint on prescriptions.appointmentId so a double-click,
-- retry, or two concurrent requests can never create a second prescription for
-- the same appointment. The column is nullable; a Postgres unique index treats
-- NULLs as distinct, so prescriptions not tied to an appointment are unaffected.
--
-- Safety: before creating the index we remove any pre-existing duplicates that
-- the previously unguarded create path may have written, keeping the earliest
-- prescription (and its items) per appointment. Run on a copy / after a backup.

-- 1. Remove medicine lines belonging to the duplicate (later) prescriptions.
DELETE FROM "prescription_items"
WHERE "prescriptionId" IN (
  SELECT "id"
  FROM (
    SELECT "id",
           ROW_NUMBER() OVER (
             PARTITION BY "appointmentId"
             ORDER BY "createdAt" ASC, "id" ASC
           ) AS rn
    FROM "prescriptions"
    WHERE "appointmentId" IS NOT NULL
  ) ranked
  WHERE ranked.rn > 1
);

-- 2. Remove the duplicate prescriptions themselves, keeping the earliest.
DELETE FROM "prescriptions"
WHERE "id" IN (
  SELECT "id"
  FROM (
    SELECT "id",
           ROW_NUMBER() OVER (
             PARTITION BY "appointmentId"
             ORDER BY "createdAt" ASC, "id" ASC
           ) AS rn
    FROM "prescriptions"
    WHERE "appointmentId" IS NOT NULL
  ) ranked
  WHERE ranked.rn > 1
);

-- 3. Enforce one prescription per appointment at the database level.
CREATE UNIQUE INDEX "prescriptions_appointmentId_key" ON "prescriptions"("appointmentId");
