-- Cast & crew for project 3 from the existing Person directory (people who
-- already have a photo). Names and headshot are copied from Person, which is
-- exactly what a project save does — Actor keeps a snapshot so editing the
-- directory later can't silently rewrite a project's credits.
DELETE FROM Actor WHERE projectId = 3 AND personId IS NOT NULL AND personId <> 2;

INSERT INTO Actor (projectId, personId, name, nameHy, nameRu, nameEn, role, roles, kind, photo, sortOrder)
SELECT 3, p.id, p.name, p.nameHy, p.nameRu, p.nameEn, r.role, JSON_ARRAY(r.role), r.kind, p.photo, r.ord
FROM Person p
JOIN (
  SELECT 34 AS pid, 'Director'    AS role, 'CREW' AS kind, 1 AS ord UNION ALL
  SELECT 16,        'Writer',            'CREW', 2 UNION ALL
  SELECT 31,        'Music',             'CREW', 3 UNION ALL
  SELECT 33,        'Animator',          'CREW', 4 UNION ALL
  SELECT 18,        'Voice Actor',       'CAST', 5 UNION ALL
  SELECT 24,        'Voice Actor',       'CAST', 6 UNION ALL
  SELECT 25,        'Voice Actor',       'CAST', 7
) r ON r.pid = p.id;
