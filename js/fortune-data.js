/* Fortune data: zodiac animals, fortune texts, and generation logic */
;(function(){
  'use strict';

  // 12 zodiac animals with metadata
  const ZODIAC_ANIMALS = [
    { key: 'rat',     emoji: '\uD83D\uDC00', element: 'water', yin: true },
    { key: 'ox',      emoji: '\uD83D\uDC02', element: 'earth', yin: false },
    { key: 'tiger',   emoji: '\uD83D\uDC05', element: 'wood',  yin: true },
    { key: 'rabbit',  emoji: '\uD83D\uDC07', element: 'wood',  yin: false },
    { key: 'dragon',  emoji: '\uD83D\uDC09', element: 'earth', yin: true },
    { key: 'snake',   emoji: '\uD83D\uDC0D', element: 'fire',  yin: false },
    { key: 'horse',   emoji: '\uD83D\uDC0E', element: 'fire',  yin: true },
    { key: 'sheep',   emoji: '\uD83D\uDC11', element: 'earth', yin: false },
    { key: 'monkey',  emoji: '\uD83D\uDC12', element: 'metal', yin: true },
    { key: 'rooster', emoji: '\uD83D\uDC13', element: 'metal', yin: false },
    { key: 'dog',     emoji: '\uD83D\uDC15', element: 'earth', yin: true },
    { key: 'pig',     emoji: '\uD83D\uDC16', element: 'water', yin: false }
  ];

  // Compatibility pairs (indices)
  const COMPATIBLE_MAP = {
    0: [4, 8],   // Rat - Dragon, Monkey
    1: [5, 9],   // Ox - Snake, Rooster
    2: [6, 10],  // Tiger - Horse, Dog
    3: [7, 11],  // Rabbit - Sheep, Pig
    4: [0, 8],   // Dragon - Rat, Monkey
    5: [1, 9],   // Snake - Ox, Rooster
    6: [2, 10],  // Horse - Tiger, Dog
    7: [3, 11],  // Sheep - Rabbit, Pig
    8: [0, 4],   // Monkey - Rat, Dragon
    9: [1, 5],   // Rooster - Ox, Snake
    10: [2, 6],  // Dog - Tiger, Horse
    11: [3, 7]   // Pig - Rabbit, Sheep
  };

  // Lucky colors per zodiac
  const LUCKY_COLORS = {
    rat:     { ko: '파란색', en: 'Blue', colorHex: '#3b82f6' },
    ox:      { ko: '초록색', en: 'Green', colorHex: '#22c55e' },
    tiger:   { ko: '주황색', en: 'Orange', colorHex: '#f97316' },
    rabbit:  { ko: '분홍색', en: 'Pink', colorHex: '#ec4899' },
    dragon:  { ko: '금색', en: 'Gold', colorHex: '#fbbf24' },
    snake:   { ko: '보라색', en: 'Purple', colorHex: '#8b5cf6' },
    horse:   { ko: '빨간색', en: 'Red', colorHex: '#ef4444' },
    sheep:   { ko: '하늘색', en: 'Sky Blue', colorHex: '#38bdf8' },
    monkey:  { ko: '노란색', en: 'Yellow', colorHex: '#eab308' },
    rooster: { ko: '흰색', en: 'White', colorHex: '#f5f5f5' },
    dog:     { ko: '갈색', en: 'Brown', colorHex: '#a16207' },
    pig:     { ko: '연두색', en: 'Lime', colorHex: '#84cc16' }
  };

  // Lucky numbers per zodiac
  const LUCKY_NUMBERS = {
    rat: [2, 3, 7],
    ox: [1, 4, 9],
    tiger: [1, 3, 7],
    rabbit: [3, 6, 9],
    dragon: [1, 6, 8],
    snake: [2, 5, 8],
    horse: [3, 4, 9],
    sheep: [2, 6, 7],
    monkey: [1, 7, 8],
    rooster: [5, 7, 8],
    dog: [3, 4, 9],
    pig: [2, 5, 8]
  };

  // Fortune levels
  const LEVELS = [
    { key: 'great',   weight: 15, cssClass: 'level-great',   fillClass: 'level-fill-great',   score: 100 },
    { key: 'good',    weight: 30, cssClass: 'level-good',    fillClass: 'level-fill-good',    score: 80  },
    { key: 'normal',  weight: 30, cssClass: 'level-normal',  fillClass: 'level-fill-normal',  score: 60  },
    { key: 'caution', weight: 18, cssClass: 'level-caution', fillClass: 'level-fill-caution', score: 40  },
    { key: 'bad',     weight: 7,  cssClass: 'level-bad',     fillClass: 'level-fill-bad',     score: 20  }
  ];

  // Fortune categories
  const CATEGORIES = [
    { key: 'wealth',  emoji: '\uD83D\uDCB0', textKey: 'fortune.wealth'  },
    { key: 'health',  emoji: '\u2764\uFE0F',  textKey: 'fortune.health'  },
    { key: 'love',    emoji: '\uD83D\uDC95', textKey: 'fortune.love'    },
    { key: 'career',  emoji: '\uD83D\uDCBC', textKey: 'fortune.career'  }
  ];

  // Fortune messages per category per level (Korean)
  // These are base messages; i18n keys will be used for translations
  const FORTUNE_MESSAGES_KO = {
    wealth: {
      great: [
        '큰 재물이 들어올 기운이 넘칩니다! 투자나 사업에 행운이 따릅니다.',
        '뜻밖의 횡재가 기대됩니다. 금전적으로 풍요로운 한 해가 될 것입니다.',
        '재물운이 최고조! 새로운 수입원이 열리고 풍요가 넘칩니다.'
      ],
      good: [
        '안정적인 수입이 꾸준히 이어집니다. 저축에 좋은 시기입니다.',
        '작은 이익이 꾸준히 모여 큰 자산을 이룹니다.',
        '지출을 잘 관리하면 여유로운 한 해를 보낼 수 있습니다.'
      ],
      normal: [
        '큰 변화 없이 평범한 재정 상태가 유지됩니다.',
        '무리한 투자보다는 현 상태를 유지하는 것이 좋겠습니다.',
        '수입과 지출의 균형을 잘 맞추는 것이 중요합니다.'
      ],
      caution: [
        '예상치 못한 지출이 발생할 수 있으니 비상금을 준비하세요.',
        '충동적인 소비를 조심하세요. 계획적인 지출이 필요합니다.',
        '보증이나 대출은 신중하게 결정하세요.'
      ],
      bad: [
        '재물 손실에 주의하세요. 투자는 잠시 쉬어가는 것이 좋겠습니다.',
        '금전 거래에 특히 신중해야 합니다. 계약서를 꼼꼼히 확인하세요.',
        '불필요한 지출을 최대한 줄이고 절약하는 자세가 필요합니다.'
      ]
    },
    health: {
      great: [
        '활력이 넘치는 건강한 한 해! 새로운 운동을 시작하기 좋습니다.',
        '몸과 마음 모두 최상의 컨디션을 유지합니다.',
        '건강 운이 최고! 에너지가 넘치고 활기찬 나날이 이어집니다.'
      ],
      good: [
        '전반적으로 양호한 건강 상태가 유지됩니다.',
        '규칙적인 생활을 하면 더욱 건강해질 수 있습니다.',
        '가벼운 운동과 충분한 수면으로 좋은 컨디션을 유지하세요.'
      ],
      normal: [
        '무리하지 않는다면 큰 문제 없는 건강 상태입니다.',
        '계절 변화에 따른 감기 조심. 기본적인 건강 관리를 해주세요.',
        '특별히 나쁘지는 않지만, 건강검진은 꼭 받아보세요.'
      ],
      caution: [
        '과로와 스트레스에 주의하세요. 충분한 휴식이 필요합니다.',
        '소화기 건강에 신경 쓰세요. 폭식과 음주를 자제하면 좋겠습니다.',
        '무리한 일정은 피하고, 자신의 몸 상태를 잘 살피세요.'
      ],
      bad: [
        '건강에 적신호! 정기적인 건강검진을 꼭 받으세요.',
        '면역력이 떨어질 수 있으니 영양 관리에 신경 쓰세요.',
        '몸에서 보내는 신호를 무시하지 마세요. 조기 치료가 중요합니다.'
      ]
    },
    love: {
      great: [
        '운명적인 만남이 기다리고 있습니다! 사랑이 활짝 피어납니다.',
        '연인과의 관계가 한층 깊어지고, 특별한 순간이 찾아옵니다.',
        '매력이 최고조! 주변에서 호감을 가지는 사람이 나타납니다.'
      ],
      good: [
        '따뜻하고 안정적인 연애가 이어집니다. 소소한 행복이 가득합니다.',
        '소개팅이나 모임에서 좋은 인연을 만날 가능성이 높습니다.',
        '서로의 이해가 깊어지는 시기입니다. 대화를 많이 나누세요.'
      ],
      normal: [
        '큰 변화 없이 평온한 연애 생활이 이어집니다.',
        '급하게 서두르지 말고 자연스러운 만남을 기다려 보세요.',
        '자신을 먼저 돌보는 시간이 오히려 좋은 인연으로 이어집니다.'
      ],
      caution: [
        '오해나 갈등이 생길 수 있으니 대화로 풀어가세요.',
        '감정적인 판단을 조심하세요. 이성적인 태도가 필요합니다.',
        '과거의 인연에 미련을 두지 말고 새로운 시작을 준비하세요.'
      ],
      bad: [
        '연애에 시련이 찾아올 수 있습니다. 인내심이 필요합니다.',
        '이별의 기운이 있으니, 서로의 마음을 다시 확인해 보세요.',
        '혼자만의 시간을 가지며 자신을 되돌아보는 것이 좋겠습니다.'
      ]
    },
    career: {
      great: [
        '승진이나 이직에 최고의 기회가 찾아옵니다!',
        '능력을 인정받고 큰 성과를 이루는 한 해가 됩니다.',
        '새로운 프로젝트나 사업이 대성공할 운세입니다.'
      ],
      good: [
        '꾸준한 노력이 결실을 맺습니다. 상사의 인정을 받을 수 있습니다.',
        '동료와의 협력이 좋은 결과를 가져옵니다.',
        '자기 계발에 투자하면 큰 도움이 되는 시기입니다.'
      ],
      normal: [
        '현재의 위치에서 안정적으로 일할 수 있는 한 해입니다.',
        '급격한 변화보다는 실력을 쌓는 데 집중하세요.',
        '묵묵히 맡은 일을 해나가면 좋은 기회가 찾아옵니다.'
      ],
      caution: [
        '직장 내 인간관계에 신경 쓰세요. 불필요한 갈등을 피하세요.',
        '업무 실수를 조심하세요. 꼼꼼한 확인이 필요합니다.',
        '이직을 고려 중이라면 조금 더 신중하게 결정하세요.'
      ],
      bad: [
        '직장에서 어려움이 예상됩니다. 인내심을 가지세요.',
        '무리한 도전보다는 현 위치를 지키는 것이 현명합니다.',
        '스트레스 관리가 중요합니다. 번아웃에 주의하세요.'
      ]
    }
  };

  // Overall fortune messages (Korean)
  const OVERALL_MESSAGES_KO = {
    excellent: [
      '올해는 모든 면에서 최고의 한 해가 될 것입니다! 자신감을 가지고 도전하세요.',
      '하늘이 도와주는 대길한 해! 원하는 것을 이룰 수 있는 기운이 가득합니다.'
    ],
    good: [
      '전반적으로 좋은 한 해입니다. 꾸준히 노력하면 좋은 결과가 따라옵니다.',
      '안정적이고 발전적인 한 해가 기대됩니다. 긍정적인 마음을 유지하세요.'
    ],
    average: [
      '평범하지만 안정적인 한 해입니다. 기본에 충실하면 좋은 일이 생깁니다.',
      '무리하지 않고 차분하게 나아가면 좋은 결과를 얻을 수 있습니다.'
    ],
    below: [
      '조심해야 할 부분이 있지만, 지혜롭게 대처하면 무사히 넘길 수 있습니다.',
      '시련이 있더라도 포기하지 마세요. 어려움 뒤에 좋은 일이 기다리고 있습니다.'
    ]
  };

  /**
   * Get zodiac index from birth year (0=Rat ... 11=Pig)
   */
  function getZodiacIndex(year) {
    return (year - 4) % 12;
  }

  /**
   * Generate a seeded random number based on year + seed
   */
  function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Pick a fortune level using weighted random
   */
  function pickLevel(seed) {
    const rand = seededRandom(seed) * 100;
    let cumulative = 0;
    for (const level of LEVELS) {
      cumulative += level.weight;
      if (rand < cumulative) return level;
    }
    return LEVELS[2]; // fallback: normal
  }

  /**
   * Pick a random message from array using seed
   */
  function pickMessage(arr, seed) {
    const idx = Math.floor(seededRandom(seed) * arr.length);
    return arr[idx];
  }

  /**
   * Generate complete fortune result for a birth year
   */
  function generateFortune(birthYear) {
    const zodiacIdx = getZodiacIndex(birthYear);
    const animal = ZODIAC_ANIMALS[zodiacIdx];
    const currentYear = 2026;
    const baseSeed = birthYear * 7 + currentYear * 13;

    // Generate fortune for each category
    const fortunes = CATEGORIES.map((cat, i) => {
      const seed = baseSeed + i * 31 + cat.key.charCodeAt(0);
      const level = pickLevel(seed);
      const messages = FORTUNE_MESSAGES_KO[cat.key][level.key];
      const message = pickMessage(messages, seed + 17);

      return {
        category: cat,
        level: level,
        messageKo: message,
        messageKey: 'fortune_msg.' + cat.key + '.' + level.key + '.' + (Math.floor(seededRandom(seed + 17) * messages.length))
      };
    });

    // Calculate overall score
    const avgScore = fortunes.reduce((sum, f) => sum + f.level.score, 0) / fortunes.length;
    let overallKey;
    if (avgScore >= 85) overallKey = 'excellent';
    else if (avgScore >= 65) overallKey = 'good';
    else if (avgScore >= 45) overallKey = 'average';
    else overallKey = 'below';

    const overallMessages = OVERALL_MESSAGES_KO[overallKey];
    const overallMsg = pickMessage(overallMessages, baseSeed + 97);

    // Lucky info
    const luckyColor = LUCKY_COLORS[animal.key];
    const luckyNums = LUCKY_NUMBERS[animal.key];
    const compatibleIndices = COMPATIBLE_MAP[zodiacIdx];
    const compatibleAnimals = compatibleIndices.map(idx => ZODIAC_ANIMALS[idx]);

    return {
      birthYear: birthYear,
      zodiacIndex: zodiacIdx,
      animal: animal,
      fortunes: fortunes,
      overallScore: avgScore,
      overallKey: overallKey,
      overallMessageKo: overallMsg,
      luckyColor: luckyColor,
      luckyNumbers: luckyNums,
      compatibleAnimals: compatibleAnimals
    };
  }

  /**
   * Get birth year range
   */
  function getBirthYearRange() {
    const years = [];
    for (let y = 2025; y >= 1924; y--) {
      years.push(y);
    }
    return years;
  }

  // Export to global
  window.FortuneData = {
    ZODIAC_ANIMALS: ZODIAC_ANIMALS,
    CATEGORIES: CATEGORIES,
    LEVELS: LEVELS,
    LUCKY_COLORS: LUCKY_COLORS,
    LUCKY_NUMBERS: LUCKY_NUMBERS,
    COMPATIBLE_MAP: COMPATIBLE_MAP,
    getZodiacIndex: getZodiacIndex,
    generateFortune: generateFortune,
    getBirthYearRange: getBirthYearRange
  };
})();
