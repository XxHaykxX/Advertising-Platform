-- Stage S2 of docs/plan-interests-staff-only.md — data only, no schema change.
--
-- /account/interests was the creator's application inbox until 2026-08-07.
-- The route survives as a redirect purely because notifications written before
-- that day still point at it. This rewrites those links so the stub can be
-- deleted without turning an old bell entry into a 404.
--
-- Run BEFORE pushing the commit that deletes the route (docs/DEPLOY-PLAYBOOK.md).
--
-- State on production at the time of writing (checked 2026-08-11):
--   id 47, user 13 (CREATOR), type INTEREST, created 2026-08-05
--   id 53, user 13 (CREATOR), type INTEREST, created 2026-08-05
-- Both belong to a member, so both go to the member's own notification list.
-- A staff recipient would go to /admin/interests instead — none exist today,
-- but the second statement keeps the rule explicit rather than implied.

UPDATE Notification n
  JOIN User u ON u.id = n.userId
   SET n.link = '/account/notifications'
 WHERE n.link = '/account/interests'
   AND u.role IN ('BRAND', 'CREATOR');

UPDATE Notification n
  JOIN User u ON u.id = n.userId
   SET n.link = '/admin/interests'
 WHERE n.link = '/account/interests'
   AND u.role IN ('SUPERADMIN', 'PUBLISHER', 'MODERATOR', 'TRANSLATOR');

-- Verify — must return 0:
-- SELECT COUNT(*) FROM Notification WHERE link = '/account/interests';

-- Rollback (restores exactly the two rows above):
-- UPDATE Notification SET link = '/account/interests' WHERE id IN (47, 53);
