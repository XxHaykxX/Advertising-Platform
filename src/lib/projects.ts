/* Shared project catalog data. Used by the catalog grid and the per-project
   detail page (/projects/[id]). To be managed from the admin panel later. */

export type Actor = {
  firstName: string;
  lastName: string;
  role: string;
  /** Path under /public (e.g. /actors/ivan-petrov.jpg). Falls back to an
      initials avatar when the file is missing. */
  photo?: string;
};

export type Scene = {
  title: string;
  /** Where/how a brand can be placed in this scene. */
  description: string;
  placement: string;
};

export type Project = {
  id: number;
  title: string;
  poster: number;
  gallery: number[];
  genre: string;
  placement: string;
  slotsTotal: number;
  slotsAvailable: number;
  release: string;
  platforms: string[];
  deadlineLabel: string;
  deadline: string; // ISO
  description: string;
  actors: Actor[];
  scenes: Scene[];
};

export const GENRES = ["Драма", "Боевик", "Комедия", "Фантастика", "Триллер"];

export function posterSrc(n: number) {
  return `/posters/poster-${String(n).padStart(2, "0")}.jpg`;
}

export const PROJECTS: Project[] = [
  {
    id: 1,
    title: "Северный ветер",
    poster: 2,
    gallery: [2, 7, 11],
    genre: "Драма",
    placement: "в кадре",
    slotsTotal: 5,
    slotsAvailable: 3,
    release: "Апрель 2026",
    platforms: ["YouTube", "Kinodaran"],
    deadlineLabel: "Заявки до 25 июня 2026",
    deadline: "2026-06-25",
    description:
      "Камерная драма о семье рыбаков на берегу холодного моря. Премьера на Kinodaran и YouTube.",
    actors: [
      { firstName: "Андрей", lastName: "Соколов", role: "Капитан Игорь" },
      { firstName: "Мария", lastName: "Велихова", role: "Дочь Аня" },
      { firstName: "Олег", lastName: "Тарасов", role: "Брат Степан" },
    ],
    scenes: [
      {
        title: "Утро в порту",
        description:
          "Герой готовит снаряжение на причале, крупные планы рук и техники.",
        placement: "Логотип на термосе и рабочей одежде, бренд экипировки.",
      },
      {
        title: "Семейный ужин",
        description:
          "Тёплая сцена за столом в доме у моря, много предметов на кухне.",
        placement: "Продукты питания, напитки, бытовая техника на фоне.",
      },
    ],
  },
  {
    id: 2,
    title: "Город теней",
    poster: 4,
    gallery: [4, 9, 3],
    genre: "Триллер",
    placement: "сюжетная интеграция",
    slotsTotal: 4,
    slotsAvailable: 1,
    release: "Июль 2026",
    platforms: ["Kinodaran", "TV"],
    deadlineLabel: "Заявки до 1 июля 2026",
    deadline: "2026-07-01",
    description:
      "Неонуар о детективе, распутывающем дело в мегаполисе. Глубокая интеграция бренда в сюжет.",
    actors: [
      { firstName: "Виктор", lastName: "Громов", role: "Детектив Орлов" },
      { firstName: "Елена", lastName: "Криницкая", role: "Журналистка Вера" },
      { firstName: "Павел", lastName: "Дёмин", role: "Информатор" },
    ],
    scenes: [
      {
        title: "Ночная погоня",
        description:
          "Детектив едет по неоновому городу, длинные планы салона авто.",
        placement: "Марка автомобиля, навигация, смартфон героя.",
      },
      {
        title: "Встреча в баре",
        description:
          "Разговор под вывесками, барная стойка крупным планом.",
        placement: "Бренд напитков, вывеска заведения, часы героя.",
      },
    ],
  },
  {
    id: 3,
    title: "Последний дубль",
    poster: 6,
    gallery: [6, 14, 1],
    genre: "Комедия",
    placement: "упоминание",
    slotsTotal: 8,
    slotsAvailable: 6,
    release: "Сентябрь 2026",
    platforms: ["YouTube"],
    deadlineLabel: "Заявки до 10 августа 2026",
    deadline: "2026-08-10",
    description:
      "Лёгкая комедия о съёмочной группе, которая никак не закончит фильм. Органичные упоминания.",
    actors: [
      { firstName: "Дмитрий", lastName: "Лунёв", role: "Режиссёр Кеша" },
      { firstName: "Алиса", lastName: "Морозова", role: "Актриса Зоя" },
      { firstName: "Григорий", lastName: "Пащенко", role: "Оператор" },
    ],
    scenes: [
      {
        title: "Хаос на площадке",
        description:
          "Съёмочная группа спорит, вокруг техника и реквизит.",
        placement: "Бренд камер/техники, кофе на вынос, фургон кейтеринга.",
      },
      {
        title: "Перерыв на обед",
        description: "Команда ест фастфуд между дублями, много упаковки.",
        placement: "Сеть фастфуда, напитки, доставка еды.",
      },
    ],
  },
  {
    id: 4,
    title: "Орбита",
    poster: 11,
    gallery: [11, 5, 8],
    genre: "Фантастика",
    placement: "реквизит",
    slotsTotal: 6,
    slotsAvailable: 4,
    release: "Декабрь 2026",
    platforms: ["Kinodaran", "YouTube", "TV"],
    deadlineLabel: "Заявки до 20 сентября 2026",
    deadline: "2026-09-20",
    description:
      "Космическая фантастика о первой колонии на орбите. Ваш продукт — часть техники будущего.",
    actors: [
      { firstName: "Артём", lastName: "Северцев", role: "Командир Рид" },
      { firstName: "Нина", lastName: "Каплан", role: "Инженер Лея" },
      { firstName: "Кирилл", lastName: "Жданов", role: "Пилот Макс" },
    ],
    scenes: [
      {
        title: "Командный отсек",
        description:
          "Экипаж работает с панелями управления, крупные планы устройств.",
        placement: "Гаджеты, экраны, бренд электроники как техника будущего.",
      },
      {
        title: "Стыковка",
        description: "Напряжённый момент у иллюминатора, форма экипажа в кадре.",
        placement: "Логотип на скафандрах и оборудовании.",
      },
    ],
  },
  {
    id: 5,
    title: "Перекрёсток",
    poster: 9,
    gallery: [9, 2, 13],
    genre: "Боевик",
    placement: "в кадре",
    slotsTotal: 5,
    slotsAvailable: 2,
    release: "Март 2027",
    platforms: ["TV", "Kinodaran"],
    deadlineLabel: "Заявки до 15 декабря 2026",
    deadline: "2026-12-15",
    description:
      "Динамичный боевик о гонщиках. Бренд в кадре на протяжении ключевых сцен.",
    actors: [
      { firstName: "Роман", lastName: "Беляев", role: "Гонщик Влад" },
      { firstName: "Дарья", lastName: "Шахова", role: "Механик Кира" },
      { firstName: "Тимур", lastName: "Аскеров", role: "Соперник" },
    ],
    scenes: [
      {
        title: "Старт гонки",
        description: "Болиды на линии старта, борта машин крупным планом.",
        placement: "Ливрея на авто, баннеры трассы, экипировка гонщиков.",
      },
      {
        title: "Бокс команды",
        description: "Механики обслуживают машину, инструменты и шины в кадре.",
        placement: "Бренд шин, инструментов, энергетических напитков.",
      },
    ],
  },
  {
    id: 6,
    title: "Тихая гавань",
    poster: 13,
    gallery: [13, 7, 4],
    genre: "Драма",
    placement: "упоминание",
    slotsTotal: 4,
    slotsAvailable: 4,
    release: "Май 2027",
    platforms: ["Kinodaran"],
    deadlineLabel: "Заявки до 1 февраля 2027",
    deadline: "2027-02-01",
    description:
      "Тёплая история о возвращении домой. Спокойный тон, лояльная аудитория.",
    actors: [
      { firstName: "Сергей", lastName: "Ильин", role: "Вернувшийся сын Лёша" },
      { firstName: "Тамара", lastName: "Орлова", role: "Мать Нина" },
      { firstName: "Игорь", lastName: "Васнецов", role: "Старый друг" },
    ],
    scenes: [
      {
        title: "Возвращение домой",
        description: "Герой выходит на вокзале с чемоданом, кадры дороги.",
        placement: "Бренд транспорта, чемодан, мобильная связь.",
      },
      {
        title: "Кухня матери",
        description: "Семейные посиделки, чай и домашняя еда крупно.",
        placement: "Чай/кофе, продукты, кухонная техника.",
      },
    ],
  },
  {
    id: 7,
    title: "Сигнал",
    poster: 7,
    gallery: [7, 11, 9],
    genre: "Фантастика",
    placement: "сюжетная интеграция",
    slotsTotal: 6,
    slotsAvailable: 5,
    release: "Август 2026",
    platforms: ["YouTube", "TV"],
    deadlineLabel: "Заявки до 30 июня 2026",
    deadline: "2026-06-30",
    description:
      "Sci-fi триллер о таинственном сигнале из космоса. Технологичный бренд впишется идеально.",
    actors: [
      { firstName: "Максим", lastName: "Зорин", role: "Учёный Дан" },
      { firstName: "Полина", lastName: "Стрельцова", role: "Аналитик Ева" },
      { firstName: "Анвар", lastName: "Рахимов", role: "Военный куратор" },
    ],
    scenes: [
      {
        title: "Лаборатория",
        description: "Команда расшифровывает сигнал, экраны и приборы в кадре.",
        placement: "Бренд ноутбуков, ПО, лабораторного оборудования.",
      },
      {
        title: "Связь с центром",
        description: "Видеозвонок на большом экране, рабочие места героев.",
        placement: "Платформа видеосвязи, гаджеты, наушники.",
      },
    ],
  },
  {
    id: 8,
    title: "Высота",
    poster: 1,
    gallery: [1, 6, 14],
    genre: "Боевик",
    placement: "реквизит",
    slotsTotal: 5,
    slotsAvailable: 3,
    release: "Октябрь 2026",
    platforms: ["Kinodaran", "YouTube"],
    deadlineLabel: "Заявки до 5 августа 2026",
    deadline: "2026-08-05",
    description:
      "Альпинистский экшн на грани возможного. Снаряжение и техника — в кадре постоянно.",
    actors: [
      { firstName: "Никита", lastName: "Громов", role: "Альпинист Дрон" },
      { firstName: "Юлия", lastName: "Барсова", role: "Напарница Сана" },
      { firstName: "Эдуард", lastName: "Лисовский", role: "Проводник" },
    ],
    scenes: [
      {
        title: "Восхождение",
        description:
          "Связка поднимается по стене, крупные планы снаряжения и рук.",
        placement: "Бренд экипировки, верёвок, карабинов, одежды.",
      },
      {
        title: "Лагерь на склоне",
        description: "Ночёвка в палатке, горелка и питание в кадре.",
        placement: "Палатки, термосы, спортпит, навигаторы.",
      },
    ],
  },
];

export function getProject(id: number): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}
