/**
 * Built-in seed for the "Studio name" dictionary (the Studio table).
 *
 * Studio used to be a free-text input with a <datalist> of whatever had been
 * typed before, so the same production company arrived spelled three ways.
 * It is a picker now, over the DB dictionary — this list is only the starting
 * pool: real Armenian film/TV/animation producers and the broadcasters that
 * commission their own content.
 *
 * Names are the companies' own Latin spelling, not a transliteration of the
 * Armenian, so what an editor types matches what they see on a poster.
 *
 * Used in exactly two places: the migration that seeds the table, and
 * getStudioOptions() as a fallback while that table is still empty. Never
 * merged into the DB list on read — that would resurrect entries staff deleted.
 */
export const STUDIO_VALUES: string[] = [
  "Armenfilm",
  "Shant TV",
  "Armenia TV",
  "CS Media",
  "Sharm Holding",
  "Kentron TV",
  "H2 (Armenia 2)",
  "Public Television Company of Armenia (AMPTV)",
  "ATV",
  "Yerkir Media",
  "Kinodaran",
  "Bars Media",
  "Kargin Studio",
  "Sahakyants Animation Studio",
  "TM Production",
  "People of AR Productions",
  "AVA Films Production",
  "Fish Eye Art Cultural Foundation",
  "LifeTree Pictures",
  "CivilNet",
  "Yerevan Studio",
  "Vardazaryan Studio",
  "KH Production",
  "Multart Animation Studio",
  "Digistep Animation Studio",
  "Hoshkee Film",
  "The Selfish Studio",
];
