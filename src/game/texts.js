// Every text the player reads, in one place: in Danish, and mostly the
// original's own words. Code uses the constants, never the text itself:
//
//   text(ctx, TEXTS.common.pressAnyKey, x, y);
//
// and text with values in it is a function that puts them in:
//
//   TEXTS.port.welcome(city.name)   ->   'Velkommen til Ebeltoft'
//
// Where the lines go, their colours, and the blank lines between paragraphs
// stay in ui/; this file only holds the words. A block of lines that belongs
// together, broken as the original broke it for its 40-column screen, is an
// array.
//
// Like EVENTS, it's frozen, all the way down, so nothing can change a text
// while the game runs; and a misspelt constant is undefined, which text() in
// ui/draw.js refuses, loudly, instead of writing "undefined" on the screen.
//
// The help (F1) is in helpText.js: the original's help, kept apart for its
// size.
// Your rank, by career level. Also used to address you, below.
const RANKS = ['skibsfører', 'kaptajn', 'kommandørkaptajn', 'kommandør', 'admiral'];

export const TEXTS = deepFreeze({
  common: {
    pressAnyKey: 'Tryk på en tast.',
    pressAnyKeyToContinue: 'Tryk på en tast for at fortsætte!',
  },

  // The question about sound at the start (the original's lines 83-88).
  sound: {
    flipWithF2: 'Du kan altid flippe lyden af og på med F2!',
    whatNow: 'Hvad vælger du lige nu?:',
    silence: '0: Stilhed',
    effects: '1: Lydeffekter',
    current: (value) => `Nuværende værdi: ${value}   (Enter beholder den)`,
    newValue: 'Angiv ny værdi:',
  },

  title: {
    words: ['Kaptajn', 'Kaper'],
    sign: ['Rigs-', 'dalere'], // on the treasure chest
  },

  // Your name, before a new game, and the greeting after it.
  name: {
    question: 'Hvad er dit navn?',
    keys: 'Enter: ok   Esc: tilbage',
    greeting: (name) => `OK, ${name}.`,
    howToQuit: ['Du kan afbryde spillet', 'ved at trykke på Esc!'],
  },

  // The record, wherever it's shown. The first version kept no name.
  record: {
    none: 'Der er ingen rekord endnu.',
    is: (points) => `Rekorden er ${points} point.`,
    isBy: (points, name) => `Rekorden er ${points} point, sat af ${name}.`,
    newOne: (points) => `Ny rekord: ${points} point!`,
  },

  // The frame around the map.
  map: {
    points: (points) => `Point: ${points}`,
    goal: (goal, maxMoves) => `Mål: ${goal} på ${maxMoves} træk`,
    help: 'F1:Hjælp',
    sound: (on) => `F2:lyd ${on ? 'til' : 'fra'}`,
    quit: 'Esc:Slut',
    debugCollision: 'DEBUG: kollision (G)',
  },

  // The table below the map, and below a fight on deck.
  status: {
    moves: (moves) => `Træk: ${moves}`,
    money: (money) => `Rgsdl: ${money}`,
    grain: (sacks) => `Korn: ${sacks}`,
    men: (men) => `Mænd: ${men}`,
    guns: (guns) => `Skyts: ${guns}`,
    repair: (repair) => `Rep: ${repair}`,
    points: (points) => `Point: ${points}`,
  },

  // The harbor (the original's lines 1260-1340), and what happens there.
  harbor: {
    sides: { right: 'højre', left: 'venstre' },
    sailingInto: (city) => `Du er på vej ind i havnen i ${city}.`,
    instructions: [
      'Styr uden om de andre skibe på reden',
      'ind i havneindløbet.',
      'Brug 4 eller ← for at flytte til venstre',
      'og 6 eller → for at flytte til højre.',
    ],
    warning: [
      'Hvis du støder ind i et af de andre skibe,',
      'vil dit skib blive beskadiget, men hvis du',
      'rammer ved siden af havneindløbet,',
      'så overlever du det ikke!',
    ],
    gustsMayCome: (side) => `Pas på!!! Der kan komme vindstød fra ${side}!`,
    gustsFrom: (side) => `Vindstød fra ${side}`,
    crash: (lost, left) => `Du ramte et skib! -${lost} Rep, ${left} tilbage`,
    welcome: (city) => `Velkommen til ${city}!`,
    pressAnyKey: 'Tryk på en tast', // without the full stop, under the welcome
  },

  // Trading in a port (the original's lines 1500-1720), and the prize money
  // waiting in the prize port.
  port: {
    welcome: (city) => `Velkommen til ${city}`,
    whatNow: 'Hvad vil du?',
    menu: (prices) => [
      `1: Hyre flere mænd (${prices.men} rgsd pr. mand)`,
      `2: Reparere skibet (${prices.repair} rgsd pr. point)`,
      `3: Købe kanoner (${prices.guns} rgsd pr. stk)`,
      `4: Købe korn (${prices.grain} rgsd pr. sæk)`,
      '5: Sælge noget',
      '6: Stå til søs igen',
    ],
    sellWhat: 'Korn (k), skyts (s) eller juveler (j)?',
    jewelsAndBack: (jewels) => `Du har ${jewels} juveler.  Esc: tilbage`,
    // How many? By buy or sell, and the good.
    howMany: {
      buy: {
        men: 'Hvor mange mænd vil du hyre?',
        repair: 'Hvor mange point vil du reparere?',
        guns: 'Hvor mange kanoner vil du købe?',
        grain: 'Hvor mange sække korn vil du købe?',
      },
      sell: {
        grain: 'Hvor mange sække korn vil du sælge?',
        guns: 'Hvor mange kanoner vil du sælge?',
        jewels: 'Hvor mange juveler vil du sælge?',
      },
    },
    tradeKeys: 'Enter: handl  Esc: fortryd',
    // Why a trade didn't happen, by its reason (see rules/trade.js).
    refused: {
      cantAfford: 'Det har du ikke råd til!',
      tooMany: 'Det er for mange!',
      notEnough: 'Så mange har du ikke!',
    },
    cantDoThat: 'Det kan du ikke!', // any other reason
    cost: (total) => `Det kostede ${total} rigsdaler.`,
    earned: (total) => `Du fik ${total} rigsdaler.`,
    hurray: 'Hurra!',
    prizesWaiting: (city, men, money) => [
      `Her i ${city} venter dine ${men}`,
      'tapre mænd på dig.',
      `De har ${money} rigsdaler`,
      'i prisepenge til dig!',
    ],
    leftBehind: (money) => [
      'Dit skib kan ikke bære mere end 30000',
      `rigsdaler, så ${money} må blive tilbage.`,
    ],
  },

  // The ships you can meet, by their id in rules/sea.js.
  ships: {
    merchantman: 'handelsmand',
    troopship: 'troppetransport',
    gunboat: 'kanonbåd',
    galleass: 'galease',
    brig: 'brig',
    schooner: 'skonnert',
    manOfWar: 'orlogsmand',
    pirateShip: 'sørøverskib',
  },

  // At sea: what the lookout spots (the original's lines 1810-1850 and
  // 2420-2460), and what was in the fog bank (2480-2590).
  sea: {
    lookoutReports: 'Udkiggen melder:',
    shipAhoy: 'Ship ohøj!',
    ahoy: 'Ohøj!',
    inSight: (ship) => `${ship} i sigte!`,
    english: (ship) => `Engelsk ${ship}`, // an English galease, say
    pirateShip: 'Sørøverskib', // which isn't English
    youMustChoose: (addressedAs) => `Nå ${addressedAs}, nu må du vælge:`,
    attackOrFlee: 'Vil du angribe (a) eller flygte (f)?',
    boardOrShoot: ['Vil du borde hende (b) eller', 'vil du skyde (s) på hende?'],
    fogBank: [
      'Der er en underlig tågebanke 2 sømil',
      'til styrbord. Det ser ud til,',
      'at der er noget inde i den.',
    ],
    investigate: 'Vil du undersøge det (j/n)?',
    // What was in the fog, by its kind (see investigateFog).
    found: {
      ship: () => ['Der dukker af disen', 'et væmmeligt skib!'],
      treasure: ({ money }) => ['Du finder en ø', 'med en skattekiste,', `der indeholder ${money} rigsdaler!`],
      jewels: ({ count }) => ['Du finder en ø', `med ${count} juveler!`],
      gun: () => ['Du finder en ø,', 'hvor der ligger en kanon,', 'som du tager ombord på dit skib!'],
      castaways: ({ count }) => [
        'Du finder en ø',
        `med en flok på ${count} skibbrudne,`,
        'som tager hyre på dit skib!',
      ],
      grain: ({ count }) => ['Du finder en ø', `med ${count} sække korn!`],
      plague: ({ count }) => [
        'Du finder en ø',
        'med en pestsyg skibbruden!',
        'Han smitter din besætning, og',
        `en trediedel af dit mandskab dør (${count} mand)!`,
        'Resten er ikke alt for begejstrede',
        'for dit lederskab!',
      ],
      nothing: () => ['Næh!', 'Der var alligevel ikke noget.'],
    },
  },

  // The gun battle, the original's "Sigte" screen (lines 2000-2950).
  battle: {
    enemy: 'Fjende',
    own: 'Egen',
    aim: 'Sigte',
    howToAim: ['Sigt med pilene eller 1-9.', 'F = fyr.  0 = afbryd kampen.'],
    // Where your shot landed, by shot.lands (see rules/battle.js).
    landed: {
      left: 'Nedslag: til venstre for hende.',
      right: 'Nedslag: til højre for hende.',
      short: 'Nedslag: for kort.',
      long: 'Nedslag: over hende.',
    },
    hit: (damage) => `Træffer! Hun mister ${damage} Rep.`,
    hitAndKilled: (damage, men) => `Træffer! Hun mister ${damage} Rep og ${men} mand.`,
    lostRepair: (repair) => `-${repair} Rep`,
    lostMen: (men) => `-${men} mand`,
    lostGun: '-1 kanon',
    enemyHits: (losses) => `Fjenden rammer: ${losses.join(', ')}`,
    enemyMisses: 'Fjenden skyder, men rammer ikke.',
    sank: (points) => `Den sank!! Du får ${points} point.`,
    strikesHerFlag: 'Hun stryger flaget!',
    distance: (distance) => `Afst: ${distance}`,
    guns: 'Skyts',
    men: 'Mand',
    repair: 'Rep',
    wind: (strength) => `Vind ${strength}`,
  },

  // Fighting on her deck (lines 3100-3240).
  boarding: {
    ragingAboard: 'Kampen raser ombord på',
    thePirateShip: 'sørøverskibet!',
    theEnglish: (ship) => `den engelske ${ship}!`,
    enemyFallen: (men) => `Fjenden har ${men} faldne,`,
    enemyOnlyLeft: (men) => `og han har kun ${men} mand igen.`,
    enemyLeft: (men) => `men han har ${men} igen.`,
    youLost: (men) => `Du har mistet ${men} af dine tapre mænd.`,
    fightOrReturn: ['Vil du kæmpe videre (k)', 'eller vende tilbage til dit skib (t)?'],
  },

  // Your rank and noble title, by your career level, 1 to 5 (the original's
  // tit(1, IDIF/2) and tit(2, IDIF/2); see rules/career.js).
  career: {
    ranks: RANKS,
    titles: ['Borger', 'Baron', 'Greve', 'Kammerherre', 'Kronprins'],
    // How you're addressed: your rank and name, "skibsfører Ronnie".
    addressedAs: (level, name) => [RANKS[level - 1], name].filter(Boolean).join(' '),
  },

  // A ship that struck her flag (lines 2950-3090).
  victory: {
    surrender: 'De overgiver sig!!',
    moneyAboard: (money) => `Der er ${money} rigsdaler ombord.`,
    survivors: (men) => `Der er ${men} overlevende.`,
    noSurvivors: 'Det flyder med lig på dækket.',
    grainAboard: (sacks) => `Der er ${sacks} sække korn ombord. Dem tager du!`,
    prizeCrew: (crew, men) => ['Dette skib behøver et prisemandskab', `på ${crew} mand! Du har ${men} mand.`],
    sinkOrTake: ['Vil du sænke det (s)', 'eller tage det som prise (p)?'],
    sank: 'Den sank!!',
    survivorsJoin: (men) => `Hendes ${men} overlevende går over til dig.`,
    toTheSharks: (men) => `Du smider ${men} mand ud til hajerne!`,
    onItsWay: 'OK, de er på vej til København.',
  },

  // A promotion, by message in a bottle (lines 6100-6119).
  promotion: {
    congratulations: 'Tillykke!!!!',
    news: ['Du har netop modtaget', 'din udnævnelse med flaskepost.'],
    youAreNow: (rank) => `Du er nu ${rank}.`,
    julieAwaits: 'Komtesse Julie venter dig med længsel!',
    allDone: (titled) => ['Du har klaret det hele.', 'Du får også det halve kongerige,', `${titled}!`],
    nextGoal: (titled, goal, maxMoves) => [
      'Lad os se, om du kan klare',
      `det næste mål, ${titled}!`,
      `${goal} point inden træk ${maxMoves}.`,
    ],
  },

  // How the game ended (lines 1750-1802, 5010-5020, 6000-6002).
  ending: {
    // What happened, by the ending (see rules/ending.js). Giving up says
    // nothing about it, as in the original.
    headlines: {
      sunk: ['Beklager, dit skib gik ned!'],
      jilted: [
        'Det er med sorg, vi meddeler, at',
        'Komtesse Julie Knokkelfryd',
        'i dag fejrer sit bryllup med',
        'den velbårne Tulleman Gylleborg!',
        '',
        'Af sorg herover, hopper du i havet!',
      ],
      won: ['Komtesse Julie er din!'],
      quit: [],
    },
    // When it was the weight of the cargo that sank her, by the cargo.
    tooHeavy: {
      money: 'Vægten af alle dine penge',
      men: 'Vægten af alle dine folk',
      guns: 'Vægten af alle dine kanoner',
      grain: 'Vægten af alt dit korn',
    },
    sankTheShip: 'fik skibet til at synke!',
    result: (points, money) => `Du fik ${points} point og havde ${money} rigsdaler!`,
    endedWith: (men, repair) => `Du sluttede med ${men} mand og ${repair} Rep.`,
  },
});

// Object.freeze, for the object and everything in it.
function deepFreeze(object) {
  for (const value of Object.values(object)) {
    if (typeof value === 'object' && value !== null) deepFreeze(value);
  }
  return Object.freeze(object);
}
