-- 2026-07-29 — fill "Վալդակար" (project 3) as a complete, showcase-quality
-- listing (owner request: "заполняй все данные и поля как будто реальный
-- проект, выдумай всё сам, чтобы красиво выглядело").
--
-- WHAT IS REAL, ALREADY IN THE DB: the title, the Armenian synopsis and
-- logline (Ani and Aram wake Grigor Magistros and travel through books —
-- Tumanyan's tales, Hambardzumyan's stars, Tamanyan's Yerevan), the poster and
-- six stills, studio, countries, dates, 10 × 30 min, the 50M AMD budget, and
-- the one real crew member.
--
-- WHAT IS INVENTED HERE: the placement opportunities, the sponsorship packages
-- and their prices, and the production timeline labels. They are plausible for
-- this show, but they are the OWNER'S commercial terms — to be confirmed before
-- a brand is pointed at them.
--
-- NOT invented: no new cast or crew names. Crediting made-up people on a real
-- Kinodaran production is the one thing worth asking for rather than guessing.
--
-- Rollback: docs/prod-migrations/backups/2026-07-29-project-3-before-fill.sql
-- plus DELETE FROM Placement/SponsorshipTier WHERE projectId=3.

-- ── 1. Project fields that were empty ──────────────────────────────────
-- The ru/en synopses described a different show entirely ("a curious young
-- hero, friendly creatures") — generic seed copy that never matched the
-- Armenian original. Both are now translations of the real one (also IA-23).
UPDATE Project SET
  formatCategory = 'ANIMATION',
  ageRating      = '6+',
  streamingSource = 'Kinodaran',
  `references`   = '["Once Upon a Time... Man","The Magic School Bus"]',
  taglineRu = 'Брат и сестра путешествуют с Магистросом по разным мирам и берут уроки жизни у самых значительных армян в истории.',
  taglineEn = 'A brother and sister travel through worlds with the Magistros, learning life''s lessons from the most remarkable Armenians in history.',
  synopsisRu = 'Ани и Арам случайно пробуждают Григора Магистроса, спящего в волшебном камне. Эта необычная встреча открывает череду фантастических событий: дети показывают Магистросу чудеса XXI века, а он через книги уводит их в путешествия по времени. Каждая поездка — новое открытие: они попадают в мир сказок Туманяна, смотрят на звёзды вместе с Амбарцумяном и чертят будущий Ереван с Таманяном, каждый раз вынося для себя самый важный жизненный урок.',
  synopsisEn = 'Ani and Aram accidentally wake Grigor Magistros, asleep inside a magic stone. That unlikely meeting opens a run of fantastic events: the children show the Magistros the wonders of the 21st century, and he takes them through books on journeys across time. Every trip is a new discovery — they step into Tumanyan''s fairy tales, watch the stars with Hambardzumyan and draw the Yerevan of the future with Tamanyan, each time carrying away the lesson that matters most.'
WHERE id = 3;

-- The one real crew member was filed as on-screen CAST with a free-text role,
-- so the report page listed a producer among the actors.
UPDATE Actor SET role = 'Producer', roles = '["Producer"]', kind = 'CREW'
WHERE projectId = 3 AND id = 298;

-- ── 2. Production timeline ─────────────────────────────────────────────
-- Was two rows in the wrong order ("Post Production" before "production"),
-- with the finished stage marked as current. Rebuilt to match status =
-- POST_PRODUCTION and the 11.08.2026 release.
DELETE FROM ProductionMilestone WHERE projectId = 3;
INSERT INTO ProductionMilestone (projectId, label, date, note, isActive, sortOrder) VALUES
  (3, 'Սցենար և ռեժիսուրա', '2025-03-10 00:00:00.000', '10 սերիայի սցենարը հաստատված է', 0, 0),
  (3, 'Անիմացիա',           '2025-07-12 00:00:00.000', 'Կերպարների և ֆոների արտադրություն', 0, 1),
  (3, 'Հնչյունավորում և մոնտաժ', '2025-12-11 00:00:00.000', 'Ընթացքի մեջ է', 1, 2),
  (3, 'Պրեմիերա',          '2026-08-11 00:00:00.000', 'Kinodaran հարթակում', 0, 3);

-- ── 3. Product placements ──────────────────────────────────────────────
-- Stills are the project's own gallery images, so each opportunity is shown
-- with the actual scene it refers to. The last one carries no price on
-- purpose: it renders as "on request" and exercises that path.
DELETE FROM Placement WHERE projectId = 3;
INSERT INTO Placement (projectId, title, description, image, priceAmd, totalSlots, availableSlots, sortOrder) VALUES
  (3, 'Գրադարանի տեսարան',
      '["Բրենդի գիրքը՝ Մագիստրոսի ձեռքին, խոշոր պլանով","Առնվազն 3 սերիայում կրկնվող տեսարան","Հիշատակում երկխոսության մեջ"]',
      '/uploads/projects/1784800410450-5ed97624.webp', 1800000, 1, 1, 0),
  (3, 'Աստղադիտարան',
      '["Բրենդի տեխնիկան աստղադիտման տեսարանում","Ամբողջական դրվագ՝ մոտ 90 վայրկյան","Լոգոն երևում է կադրում՝ առանց գրաֆիկական ընդգծման"]',
      '/uploads/projects/1784800370425-5f81f6ac.webp', 2500000, 1, 1, 1),
  (3, 'Ապագայի Երևանի մակետը',
      '["Բրենդը՝ Թամանյանի հետ ապագայի քաղաքի դրվագում","Հիշատակում սերիայի վերջում","Օգտագործման իրավունք՝ պրոմո նյութերում"]',
      '/uploads/projects/1784800382489-89a754b4.webp', 3200000, 2, 2, 2),
  (3, 'Ընտանեկան նախաճաշ',
      '["Բրենդի արտադրանքը երեխաների սեղանին","Կրկնվում է 5 սերիայում","Հարմար է սննդի և խմիչքի կատեգորիային"]',
      '/uploads/projects/1784800388613-596c856f.webp', NULL, 2, 2, 3);

-- ── 4. Sponsorship packages ────────────────────────────────────────────
DELETE FROM SponsorshipTier WHERE projectId = 3;
INSERT INTO SponsorshipTier (projectId, name, priceAmd, benefits, isExclusive, totalSlots, availableSlots, sortOrder) VALUES
  (3, 'Գլխավոր հովանավոր', 12000000,
      '["Լոգոն բացող տիտրերում՝ «ներկայացնում է» ձևակերպմամբ","Լոգոն բոլոր պաստառներին և պրոմո նյութերին","Հիշատակում մամուլի հաղորդագրություններում","Սոցցանցերի համատեղ արշավ՝ 10 հրապարակում","Հրավերներ պրեմիերային՝ 10 հոգու"]',
      1, 1, 1, 0),
  (3, 'Պաշտոնական գործընկեր', 6000000,
      '["Լոգոն փակող տիտրերում","Լոգոն ընտրված պաստառներին","Սոցցանցերի 4 հրապարակում","Հրավերներ պրեմիերային՝ 4 հոգու"]',
      0, 3, 3, 1),
  (3, 'Աջակից', 2500000,
      '["Հիշատակում փակող տիտրերում","Սոցցանցերի 2 հրապարակում","Հրավերներ պրեմիերային՝ 2 հոգու"]',
      0, 5, 5, 2);

-- Verify:
-- SELECT COUNT(*) FROM Placement WHERE projectId=3;        -- 4
-- SELECT COUNT(*) FROM SponsorshipTier WHERE projectId=3;  -- 3
-- SELECT COUNT(*) FROM ProductionMilestone WHERE projectId=3; -- 4
