/**
 * Everything the farm can hold, grow or sell. Pure data: the simulation in
 * `store.ts` reads it, nothing here changes at runtime.
 *
 * Times are in game hours. One game hour passes in one real minute (see
 * `GAME_MINUTES_PER_SECOND` in `clock.ts`), so a 12-hour crop is ready in
 * twelve real minutes and a game day lasts twenty-four.
 */

export type ItemId =
  // seeds
  | 'seed_tomato'
  | 'seed_corn'
  | 'seed_carrot'
  | 'seed_lettuce'
  | 'seed_wheat'
  | 'seed_strawberry'
  | 'seed_pepper'
  | 'seed_pumpkin'
  // harvest
  | 'tomato'
  | 'corn'
  | 'carrot'
  | 'lettuce'
  | 'wheat'
  | 'strawberry'
  | 'pepper'
  | 'pumpkin'
  // animal produce
  | 'milk'
  | 'egg'
  | 'wool'
  | 'goat_milk'
  // fish
  | 'fish_carp'
  | 'fish_trout'
  | 'fish_catfish'
  // supplies
  | 'hay'
  | 'grain'
  | 'fish_feed'
  | 'fertilizer'
  | 'medicine';

export type ItemKind = 'seed' | 'crop' | 'produce' | 'fish' | 'supply';

export type Item = {
  id: ItemId;
  name: string;
  kind: ItemKind;
  /** Base market price; the day's price moves around it. */
  price: number;
  unit: string;
};

export const ITEMS: Record<ItemId, Item> = {
  seed_tomato: { id: 'seed_tomato', name: 'Domates tohumu', kind: 'seed', price: 6, unit: 'paket' },
  seed_corn: { id: 'seed_corn', name: 'Mısır tohumu', kind: 'seed', price: 5, unit: 'paket' },
  seed_carrot: { id: 'seed_carrot', name: 'Havuç tohumu', kind: 'seed', price: 4, unit: 'paket' },
  seed_lettuce: { id: 'seed_lettuce', name: 'Marul tohumu', kind: 'seed', price: 3, unit: 'paket' },
  seed_wheat: { id: 'seed_wheat', name: 'Buğday tohumu', kind: 'seed', price: 3, unit: 'paket' },
  seed_strawberry: { id: 'seed_strawberry', name: 'Çilek fidesi', kind: 'seed', price: 10, unit: 'fide' },
  seed_pepper: { id: 'seed_pepper', name: 'Biber fidesi', kind: 'seed', price: 7, unit: 'fide' },
  seed_pumpkin: { id: 'seed_pumpkin', name: 'Kabak tohumu', kind: 'seed', price: 9, unit: 'paket' },

  tomato: { id: 'tomato', name: 'Domates', kind: 'crop', price: 4, unit: 'kg' },
  corn: { id: 'corn', name: 'Mısır', kind: 'crop', price: 3, unit: 'koçan' },
  carrot: { id: 'carrot', name: 'Havuç', kind: 'crop', price: 3, unit: 'kg' },
  lettuce: { id: 'lettuce', name: 'Marul', kind: 'crop', price: 3, unit: 'adet' },
  wheat: { id: 'wheat', name: 'Buğday', kind: 'crop', price: 2, unit: 'demet' },
  strawberry: { id: 'strawberry', name: 'Çilek', kind: 'crop', price: 8, unit: 'kasa' },
  pepper: { id: 'pepper', name: 'Biber', kind: 'crop', price: 5, unit: 'kg' },
  pumpkin: { id: 'pumpkin', name: 'Bal kabağı', kind: 'crop', price: 18, unit: 'adet' },

  milk: { id: 'milk', name: 'Süt', kind: 'produce', price: 9, unit: 'litre' },
  egg: { id: 'egg', name: 'Yumurta', kind: 'produce', price: 2, unit: 'adet' },
  wool: { id: 'wool', name: 'Yün', kind: 'produce', price: 22, unit: 'kg' },
  goat_milk: { id: 'goat_milk', name: 'Keçi sütü', kind: 'produce', price: 12, unit: 'litre' },

  fish_carp: { id: 'fish_carp', name: 'Sazan', kind: 'fish', price: 20, unit: 'adet' },
  fish_trout: { id: 'fish_trout', name: 'Alabalık', kind: 'fish', price: 30, unit: 'adet' },
  fish_catfish: { id: 'fish_catfish', name: 'Yayın balığı', kind: 'fish', price: 48, unit: 'adet' },

  hay: { id: 'hay', name: 'Saman', kind: 'supply', price: 2, unit: 'balya' },
  grain: { id: 'grain', name: 'Tahıl yemi', kind: 'supply', price: 2, unit: 'kg' },
  fish_feed: { id: 'fish_feed', name: 'Balık yemi', kind: 'supply', price: 3, unit: 'kg' },
  fertilizer: { id: 'fertilizer', name: 'Gübre', kind: 'supply', price: 6, unit: 'torba' },
  medicine: { id: 'medicine', name: 'İlaç', kind: 'supply', price: 25, unit: 'doz' },
};

export type CropId =
  | 'tomato'
  | 'corn'
  | 'carrot'
  | 'lettuce'
  | 'wheat'
  | 'strawberry'
  | 'pepper'
  | 'pumpkin';

export type Crop = {
  id: CropId;
  name: string;
  seed: ItemId;
  harvest: ItemId;
  /** Game hours from planting to ripe, with the soil kept moist. */
  growHours: number;
  /** Units harvested from one plot; fertilizer adds half again. */
  yield: number;
  /** Farm level needed before the seed shows up in the market. */
  level: number;
  /** Soil-moisture points lost per game hour. Thirsty crops dry faster. */
  thirst: number;
};

export const CROPS: Record<CropId, Crop> = {
  lettuce: { id: 'lettuce', name: 'Marul', seed: 'seed_lettuce', harvest: 'lettuce', growHours: 6, yield: 3, level: 1, thirst: 5 },
  wheat: { id: 'wheat', name: 'Buğday', seed: 'seed_wheat', harvest: 'wheat', growHours: 8, yield: 5, level: 1, thirst: 3 },
  carrot: { id: 'carrot', name: 'Havuç', seed: 'seed_carrot', harvest: 'carrot', growHours: 10, yield: 4, level: 1, thirst: 4 },
  tomato: { id: 'tomato', name: 'Domates', seed: 'seed_tomato', harvest: 'tomato', growHours: 14, yield: 5, level: 1, thirst: 6 },
  corn: { id: 'corn', name: 'Mısır', seed: 'seed_corn', harvest: 'corn', growHours: 16, yield: 6, level: 2, thirst: 5 },
  pepper: { id: 'pepper', name: 'Biber', seed: 'seed_pepper', harvest: 'pepper', growHours: 18, yield: 4, level: 3, thirst: 6 },
  strawberry: { id: 'strawberry', name: 'Çilek', seed: 'seed_strawberry', harvest: 'strawberry', growHours: 20, yield: 3, level: 4, thirst: 7 },
  pumpkin: { id: 'pumpkin', name: 'Bal kabağı', seed: 'seed_pumpkin', harvest: 'pumpkin', growHours: 30, yield: 2, level: 5, thirst: 5 },
};

export type FieldId = 'tomatoes' | 'vegetables' | 'corn';

export type FieldDef = { id: FieldId; name: string; plots: number; suggested: CropId[] };

export const FIELDS: FieldDef[] = [
  { id: 'tomatoes', name: 'Domates Tarlası', plots: 8, suggested: ['tomato', 'pepper', 'strawberry'] },
  { id: 'vegetables', name: 'Sebze Bahçesi', plots: 8, suggested: ['lettuce', 'carrot', 'pumpkin'] },
  { id: 'corn', name: 'Mısır Tarlası', plots: 8, suggested: ['corn', 'wheat'] },
];

export type SpeciesId = 'cow' | 'chicken' | 'sheep' | 'goat';

export type Species = {
  id: SpeciesId;
  name: string;
  plural: string;
  feed: ItemId;
  /** Feed units eaten per meal. */
  ration: number;
  product: ItemId;
  /** Game hours of being fed and well to make one batch. */
  productHours: number;
  productAmount: number;
  price: number;
  level: number;
  breeds: string[];
  names: string[];
  tag: string;
  /** What a newborn is called: buzağı, kuzu, oğlak, civciv. */
  baby: string;
  /** Game days from birth to adult. Young animals eat but make nothing yet. */
  maturityDays: number;
  /** Game days an animal can live. Past 80% of it, it is old and makes less. */
  lifespanDays: number;
  /** Game hours from conception to birth; null where young come from eggs instead. */
  gestationHours: number | null;
  /** Chance per game hour that a well, fed adult conceives, given a second adult of its kind. */
  conceiveChance: number;
};

export const SPECIES: Record<SpeciesId, Species> = {
  chicken: {
    id: 'chicken', name: 'Tavuk', plural: 'Tavuklar', feed: 'grain', ration: 1, product: 'egg',
    productHours: 8, productAmount: 2, price: 40, level: 1, tag: 'TVK',
    baby: 'civciv', maturityDays: 1, lifespanDays: 400, gestationHours: null, conceiveChance: 0,
    breeds: ['Rhode Island Red', 'Leghorn', 'Sussex', 'Brahma'],
    names: ['Pıtırcık', 'Biber', 'Tüylü', 'Gıdık', 'Fındık', 'Minnoş', 'Kınalı', 'Sarıkız', 'Çilli', 'Ponpon'],
  },
  cow: {
    id: 'cow', name: 'İnek', plural: 'İnekler', feed: 'hay', ration: 3, product: 'milk',
    productHours: 12, productAmount: 4, price: 320, level: 1, tag: 'INK',
    baby: 'buzağı', maturityDays: 3, lifespanDays: 900, gestationHours: 48, conceiveChance: 0.004,
    breeds: ['Holstein', 'Simental', 'Jersey', 'Montofon'],
    names: ['Sarıkız', 'Benekli', 'Papatya', 'Karamel', 'Menekşe', 'Lale', 'Boncuk', 'Mercan'],
  },
  sheep: {
    id: 'sheep', name: 'Koyun', plural: 'Koyunlar', feed: 'hay', ration: 2, product: 'wool',
    productHours: 36, productAmount: 2, price: 180, level: 2, tag: 'KYN',
    baby: 'kuzu', maturityDays: 2, lifespanDays: 700, gestationHours: 36, conceiveChance: 0.006,
    breeds: ['Merinos', 'Kıvırcık', 'Karaman', 'Sakız'],
    names: ['Pamuk', 'Bulut', 'Kuzucuk', 'Kar', 'Yumak', 'Köpük'],
  },
  goat: {
    id: 'goat', name: 'Keçi', plural: 'Keçiler', feed: 'hay', ration: 2, product: 'goat_milk',
    productHours: 14, productAmount: 2, price: 200, level: 3, tag: 'KEC',
    baby: 'oğlak', maturityDays: 2, lifespanDays: 700, gestationHours: 36, conceiveChance: 0.006,
    breeds: ['Saanen', 'Kıl Keçisi', 'Ankara', 'Malta'],
    names: ['Zıpzıp', 'Haylaz', 'Kınalı', 'Sakal', 'Tarçın', 'Fıstık'],
  },
};

/** The three meals of the feeding schedule, by game hour. */
export const MEALS = [
  { hour: 6, label: 'Sabah', what: 'Saman ve tahıl' },
  { hour: 12, label: 'Öğle', what: 'Karma yem' },
  { hour: 18, label: 'Akşam', what: 'Akşam yemi' },
] as const;

export type FishSpeciesId = 'carp' | 'trout' | 'catfish';

export type FishSpecies = {
  id: FishSpeciesId;
  name: string;
  /** Price of one fingerling. */
  price: number;
  /** Game hours from fingerling to catchable, while fed. */
  growHours: number;
  catch: ItemId;
  level: number;
  /** Chance per game hour that a batch of grown fish spawns, in clean water and fed. */
  spawnChance: number;
};

export const FISH: Record<FishSpeciesId, FishSpecies> = {
  carp: { id: 'carp', name: 'Sazan', price: 8, growHours: 24, catch: 'fish_carp', level: 1, spawnChance: 0.08 },
  trout: { id: 'trout', name: 'Alabalık', price: 12, growHours: 32, catch: 'fish_trout', level: 2, spawnChance: 0.06 },
  catfish: { id: 'catfish', name: 'Yayın balığı', price: 20, growHours: 48, catch: 'fish_catfish', level: 4, spawnChance: 0.04 },
};

export const POND_CAPACITY = 24;
export const TANK_CAPACITY = 1000;
/** Litres a single watering takes from the tank. */
export const WATER_PER_PLOT = 40;
export const BARN_CAPACITY = 40;
/** Game hours an egg sits in the incubator before it hatches. */
export const HATCH_HOURS = 24;
/** Eggs one incubator tray holds. */
export const INCUBATOR_SIZE = 6;
/** Game hours an animal can survive at zero health before it dies. */
export const SICK_DEATH_HOURS = 12;

/** XP needed to reach each level, from level 1. */
export const LEVELS = [0, 60, 160, 320, 560, 900, 1400, 2100];

export type WeatherKind = 'sunny' | 'partly' | 'cloudy' | 'rain' | 'storm';

export const WEATHER: Record<WeatherKind, { label: string; dryFactor: number; rain: boolean }> = {
  sunny: { label: 'Güneşli', dryFactor: 1.3, rain: false },
  partly: { label: 'Parçalı bulutlu', dryFactor: 1, rain: false },
  cloudy: { label: 'Bulutlu', dryFactor: 0.7, rain: false },
  rain: { label: 'Yağmurlu', dryFactor: 0, rain: true },
  storm: { label: 'Fırtına', dryFactor: 0, rain: true },
};

/** Plots a field starts with; each expansion adds FIELD_EXPANSIONS[i].plots. */
export const BASE_PLOTS = 8;

/** Growing a field: each step adds a row of four plots. */
export const FIELD_EXPANSIONS = [
  { cost: 150, level: 1, plots: 4 },
  { cost: 400, level: 3, plots: 4 },
] as const;

export type FacilityId = 'barn' | 'pond' | 'tank';

export type Facility = {
  id: FacilityId;
  name: string;
  /** What the capacity counts, after the number: "hayvan", "balık", "litre". */
  unit: string;
  base: number;
  steps: readonly { cost: number; level: number; capacity: number }[];
};

/** The buildings that can be enlarged, and what each step costs and gives. */
export const FACILITIES: Record<FacilityId, Facility> = {
  barn: {
    id: 'barn', name: 'Ahır', unit: 'hayvan', base: BARN_CAPACITY,
    steps: [{ cost: 300, level: 2, capacity: 60 }, { cost: 800, level: 4, capacity: 80 }],
  },
  pond: {
    id: 'pond', name: 'Balık havuzu', unit: 'balık', base: POND_CAPACITY,
    steps: [{ cost: 200, level: 2, capacity: 36 }, { cost: 600, level: 4, capacity: 48 }],
  },
  tank: {
    id: 'tank', name: 'Su deposu', unit: 'litre', base: TANK_CAPACITY,
    steps: [{ cost: 150, level: 1, capacity: 1500 }, { cost: 400, level: 3, capacity: 2000 }],
  },
};

/** The farm's land, in dönüm, before anything is built on: each expansion adds to it. */
export const BASE_AREA = 12.5;

export type MachineId =
  | 'sprinkler'
  | 'weeder'
  | 'harvester'
  | 'planter'
  | 'feeder'
  | 'collector'
  | 'cleaner'
  | 'fish_feeder'
  | 'pond_filter'
  | 'solar_pump';

export type Machine = {
  id: MachineId;
  name: string;
  /** One line on what it does for you. */
  does: string;
  price: number;
  level: number;
  /** Where on the farm it works; the map shows it there. */
  zone: 'fields' | 'animals' | 'water';
};

/**
 * Machines and robots: bought once, then they do one chore by themselves for
 * as long as they are switched on. Listed in the order a farm usually wants them.
 */
export const MACHINES: Record<MachineId, Machine> = {
  sprinkler: { id: 'sprinkler', name: 'Otomatik Sulama', does: 'Nemi %35’in altına düşen parselleri depodaki suyla sular.', price: 350, level: 2, zone: 'fields' },
  feeder: { id: 'feeder', name: 'Otomatik Yemlik', does: 'Öğün saatlerinde aç hayvanları ambardaki yemle besler.', price: 400, level: 2, zone: 'animals' },
  fish_feeder: { id: 'fish_feeder', name: 'Balık Yemleme Makinesi', does: 'Balıklar acıkınca havuza yem atar.', price: 250, level: 2, zone: 'water' },
  cleaner: { id: 'cleaner', name: 'Temizlik Robotu', does: 'Ahır kirlenince temizler.', price: 300, level: 2, zone: 'animals' },
  weeder: { id: 'weeder', name: 'Çapa Robotu', does: 'Tarlalardaki yabani otları ayıklar.', price: 220, level: 2, zone: 'fields' },
  harvester: { id: 'harvester', name: 'Hasat Robotu', does: 'Olgunlaşan ürünleri toplayıp ambara taşır.', price: 500, level: 3, zone: 'fields' },
  collector: { id: 'collector', name: 'Toplama Robotu', does: 'Süt, yumurta ve yünü hazır olunca toplar.', price: 450, level: 3, zone: 'animals' },
  pond_filter: { id: 'pond_filter', name: 'Havuz Filtresi', does: 'Havuzun suyunu sürekli temiz tutar.', price: 300, level: 3, zone: 'water' },
  solar_pump: { id: 'solar_pump', name: 'Güneş Enerjili Pompa', does: 'Gündüzleri su deposunu kendiliğinden doldurur.', price: 400, level: 3, zone: 'water' },
  planter: { id: 'planter', name: 'Ekim Robotu', does: 'Hasat edilen parsele tohum varsa aynı ürünü yeniden eker.', price: 600, level: 4, zone: 'fields' },
};
