/* Main application logic */
;(function(){
  'use strict';

  // State
  let currentFortune = null;
  let flippedCount = 0;
  let allRevealed = false;

  // DOM refs
  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);

  // Screens
  const screenIntro = $('#screen-intro');
  const screenDrawing = $('#screen-drawing');
  const screenResult = $('#screen-result');

  // Elements
  const birthYearSelect = $('#birth-year');
  const zodiacDisplay = $('#zodiac-display');
  const btnStart = $('#btn-start');
  const fortuneCardsGrid = $('#fortune-cards');
  const btnRevealAll = $('#btn-reveal-all');
  const btnRetry = $('#btn-retry');
  const btnBack = $('#btn-back');
  const langSelect = $('#lang-select');
  const themeToggle = $('#theme-toggle');

  // Share buttons
  const btnShareDownload = $('#btn-share-download');
  const btnShareTwitter = $('#btn-share-twitter');
  const btnShareFacebook = $('#btn-share-facebook');
  const btnShareCopy = $('#btn-share-copy');

  /* ===== Init ===== */
  function init() {
    populateYears();
    setupTheme();
    setupEventListeners();

    // Wait for i18n to be ready
    if (window.i18n && window.i18n.onReady) {
      window.i18n.onReady(function() {
        updateDynamicTexts();
        syncLangSelect();
        hideLoader();
      });
    } else {
      // i18n not available, proceed anyway
      hideLoader();
    }
  }

  function hideLoader() {
    const loader = $('#app-loader');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => { loader.style.display = 'none'; }, 500);
    }
  }

  /* ===== Year Dropdown ===== */
  function populateYears() {
    const years = window.FortuneData.getBirthYearRange();
    const defaultYear = 1990;
    years.forEach(y => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === defaultYear) opt.selected = true;
      birthYearSelect.appendChild(opt);
    });
    updateZodiacDisplay(defaultYear);
  }

  function updateZodiacDisplay(year) {
    const idx = window.FortuneData.getZodiacIndex(year);
    const animal = window.FortuneData.ZODIAC_ANIMALS[idx];
    const name = t('zodiac.' + animal.key);
    zodiacDisplay.textContent = animal.emoji + ' ' + name + ' (' + year + ')';
  }

  /* ===== Theme ===== */
  function setupTheme() {
    const saved = localStorage.getItem('seollal-fortune-theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      // Default dark
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('seollal-fortune-theme', next);
  }

  /* ===== Event Listeners ===== */
  function setupEventListeners() {
    birthYearSelect.addEventListener('change', function() {
      updateZodiacDisplay(parseInt(this.value));
    });

    btnStart.addEventListener('click', startDrawing);
    btnRevealAll.addEventListener('click', revealAllCards);
    btnRetry.addEventListener('click', retryDrawing);
    btnBack.addEventListener('click', goToIntro);

    themeToggle.addEventListener('click', toggleTheme);

    langSelect.addEventListener('change', function() {
      if (window.i18n) {
        window.i18n.setLocale(this.value).then(function() {
          updateDynamicTexts();
          if (currentFortune) {
            updateResultTexts();
          }
        });
      }
    });

    // Share buttons
    btnShareDownload.addEventListener('click', shareAsImage);
    btnShareTwitter.addEventListener('click', shareTwitter);
    btnShareFacebook.addEventListener('click', shareFacebook);
    btnShareCopy.addEventListener('click', shareCopyLink);
  }

  function syncLangSelect() {
    if (window.i18n) {
      langSelect.value = window.i18n.getLocale();
    }
  }

  /* ===== i18n Helper ===== */
  function t(key, replacements) {
    if (window.i18n && window.i18n.t) {
      return window.i18n.t(key, replacements);
    }
    return key;
  }

  function updateDynamicTexts() {
    // Update zodiac display if year is selected
    if (birthYearSelect.value) {
      updateZodiacDisplay(parseInt(birthYearSelect.value));
    }
  }

  /* ===== Screen Navigation ===== */
  function showScreen(screen) {
    [screenIntro, screenDrawing, screenResult].forEach(s => {
      s.classList.remove('active');
    });
    screen.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ===== Start Drawing ===== */
  function startDrawing() {
    const birthYear = parseInt(birthYearSelect.value);
    currentFortune = window.FortuneData.generateFortune(birthYear);
    flippedCount = 0;
    allRevealed = false;
    btnRevealAll.style.display = 'none';

    // Update drawing screen info
    const animal = currentFortune.animal;
    const zodiacName = t('zodiac.' + animal.key);
    $('#drawing-zodiac-info').textContent = animal.emoji + ' ' + zodiacName + ' (' + birthYear + ')';

    // Build cards
    buildFortuneCards();
    showScreen(screenDrawing);

    // GA4 event
    trackEvent('fortune_draw', {
      birth_year: birthYear,
      zodiac: animal.key
    });
  }

  function buildFortuneCards() {
    fortuneCardsGrid.innerHTML = '';
    const categories = window.FortuneData.CATEGORIES;

    categories.forEach(function(cat, i) {
      const fortune = currentFortune.fortunes[i];
      const levelName = t('level.' + fortune.level.key);
      const categoryName = t(cat.textKey);

      // Build fortune message — use i18n key, fall back to Korean
      const msgKey = 'fortune_msg.' + cat.key + '.' + fortune.level.key;
      let message = t(msgKey);
      // If i18n key not found (returns the key itself), use Korean text
      if (message === msgKey) {
        message = fortune.messageKo;
      }

      const card = document.createElement('div');
      card.className = 'fortune-card';
      card.setAttribute('data-index', i);
      card.innerHTML =
        '<div class="fortune-card-inner">' +
          '<div class="fortune-card-front">' +
            '<span class="card-emoji">' + cat.emoji + '</span>' +
            '<span class="card-label">' + categoryName + '</span>' +
          '</div>' +
          '<div class="fortune-card-back">' +
            '<span class="card-category">' + categoryName + '</span>' +
            '<span class="card-level ' + fortune.level.cssClass + '">' + levelName + '</span>' +
            '<p class="card-message">' + message + '</p>' +
            '<div class="level-bar"><div class="level-fill ' + fortune.level.fillClass + '"></div></div>' +
          '</div>' +
        '</div>';

      card.addEventListener('click', function() {
        flipCard(card, i);
      });

      fortuneCardsGrid.appendChild(card);
    });
  }

  function flipCard(card, index) {
    if (card.classList.contains('flipped')) return;

    card.classList.add('shake');
    setTimeout(function() {
      card.classList.remove('shake');
      card.classList.add('flipped');
      flippedCount++;

      if (flippedCount === 2 && !allRevealed) {
        btnRevealAll.style.display = 'inline-flex';
      }

      if (flippedCount >= 4) {
        setTimeout(function() {
          showResult();
        }, 1200);
      }
    }, 500);
  }

  function revealAllCards() {
    allRevealed = true;
    btnRevealAll.style.display = 'none';

    const cards = $$('.fortune-card:not(.flipped)');
    let delay = 0;
    cards.forEach(function(card) {
      setTimeout(function() {
        card.classList.add('shake');
        setTimeout(function() {
          card.classList.remove('shake');
          card.classList.add('flipped');
          flippedCount++;
          if (flippedCount >= 4) {
            setTimeout(function() { showResult(); }, 800);
          }
        }, 400);
      }, delay);
      delay += 300;
    });
  }

  /* ===== Show Result ===== */
  function showResult() {
    buildResultScreen();
    showScreen(screenResult);
    launchConfetti();
  }

  function buildResultScreen() {
    const fortune = currentFortune;
    const animal = fortune.animal;
    const zodiacName = t('zodiac.' + animal.key);

    // Header
    $('#result-zodiac').textContent = animal.emoji + ' ' + zodiacName + ' (' + fortune.birthYear + ')';

    // Overall message — try i18n, fall back to Korean
    const overallKey = 'overall.' + fortune.overallKey;
    let overallText = t(overallKey);
    if (overallText === overallKey) {
      overallText = fortune.overallMessageKo;
    }
    $('#result-overall').textContent = overallText;

    // Result cards
    const resultCardsEl = $('#result-cards');
    resultCardsEl.innerHTML = '';

    fortune.fortunes.forEach(function(f) {
      const categoryName = t(f.category.textKey);
      const levelName = t('level.' + f.level.key);
      const msgKey = 'fortune_msg.' + f.category.key + '.' + f.level.key;
      let message = t(msgKey);
      if (message === msgKey) message = f.messageKo;

      const card = document.createElement('div');
      card.className = 'result-card glass-card';
      card.innerHTML =
        '<span class="rc-emoji">' + f.category.emoji + '</span>' +
        '<span class="rc-category">' + categoryName + '</span>' +
        '<span class="rc-level ' + f.level.cssClass + '">' + levelName + '</span>' +
        '<p class="rc-message">' + message + '</p>' +
        '<div class="rc-bar"><div class="rc-fill ' + f.level.fillClass + '"></div></div>';

      resultCardsEl.appendChild(card);
    });

    // Extras
    const lang = (window.i18n && window.i18n.getLocale()) || 'ko';
    const colorKey = 'color.' + fortune.animal.key;
    let colorText = t(colorKey);
    if (colorText === colorKey) {
      colorText = lang === 'ko' ? fortune.luckyColor.ko : fortune.luckyColor.en;
    }

    $('#lucky-color').textContent = colorText;
    $('#lucky-color').style.color = fortune.luckyColor.colorHex;
    $('#lucky-number').textContent = fortune.luckyNumbers.join(', ');

    const compatText = fortune.compatibleAnimals.map(function(a) {
      return a.emoji + ' ' + t('zodiac.' + a.key);
    }).join(', ');
    $('#compatible-zodiac').textContent = compatText;
  }

  function updateResultTexts() {
    if (!currentFortune) return;
    buildResultScreen();
  }

  /* ===== Confetti ===== */
  function launchConfetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const colors = ['#dc2626', '#fbbf24', '#22c55e', '#3b82f6', '#f97316', '#ec4899'];
    for (let i = 0; i < 40; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.top = '-10px';
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 0.5 + 's';
      piece.style.animationDuration = (2 + Math.random() * 2) + 's';
      piece.style.width = (6 + Math.random() * 8) + 'px';
      piece.style.height = (6 + Math.random() * 8) + 'px';
      piece.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
      document.body.appendChild(piece);

      setTimeout(function() {
        piece.remove();
      }, 4000);
    }
  }

  /* ===== Retry / Back ===== */
  function retryDrawing() {
    startDrawing();
  }

  function goToIntro() {
    currentFortune = null;
    showScreen(screenIntro);
  }

  /* ===== Share Functions ===== */
  function shareAsImage() {
    // Build a canvas-based image of the result
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 600;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#060612';
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Inner border
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Title
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('intro.title'), width / 2, 70);

    // Zodiac info
    const animal = currentFortune.animal;
    const zodiacName = t('zodiac.' + animal.key);
    ctx.fillStyle = '#fbbf24';
    ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(animal.emoji + ' ' + zodiacName + ' (' + currentFortune.birthYear + ')', width / 2, 110);

    // Fortune results
    const fortunes = currentFortune.fortunes;
    const startY = 160;
    const cardH = 130;
    const cardW = 250;
    const gap = 20;

    fortunes.forEach(function(f, i) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = col === 0 ? 40 : width / 2 + 10;
      const y = startY + row * (cardH + gap);

      // Card background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.roundRect(x, y, cardW, cardH, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.stroke();

      // Category
      const categoryName = t(f.category.textKey);
      ctx.fillStyle = '#a0a0b8';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.category.emoji + ' ' + categoryName, x + cardW / 2, y + 30);

      // Level
      const levelName = t('level.' + f.level.key);
      const levelColors = {
        great: '#fbbf24', good: '#22c55e', normal: '#60a5fa',
        caution: '#f97316', bad: '#ef4444'
      };
      ctx.fillStyle = levelColors[f.level.key] || '#f0f0f5';
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(levelName, x + cardW / 2, y + 65);

      // Bar
      const barX = x + 20;
      const barY = y + 85;
      const barW = cardW - 40;
      const barH = 6;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 3);
      ctx.fill();

      const fillWidths = { great: 1, good: 0.8, normal: 0.6, caution: 0.4, bad: 0.2 };
      ctx.fillStyle = levelColors[f.level.key];
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * (fillWidths[f.level.key] || 0.5), barH, 3);
      ctx.fill();
    });

    // Lucky info
    const infoY = startY + 2 * (cardH + gap) + 30;
    ctx.fillStyle = '#a0a0b8';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';

    const lang = (window.i18n && window.i18n.getLocale()) || 'ko';
    const colorText = lang === 'ko' ? currentFortune.luckyColor.ko : currentFortune.luckyColor.en;

    ctx.fillText(
      t('result.luckyColor') + ': ' + colorText +
      '  |  ' + t('result.luckyNumber') + ': ' + currentFortune.luckyNumbers.join(', '),
      width / 2, infoY
    );

    const compatText = currentFortune.compatibleAnimals.map(function(a) {
      return a.emoji + ' ' + t('zodiac.' + a.key);
    }).join(', ');
    ctx.fillText(t('result.compatible') + ': ' + compatText, width / 2, infoY + 30);

    // Footer
    ctx.fillStyle = 'rgba(160, 160, 184, 0.5)';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('dopabrain.com/seollal-fortune', width / 2, height - 30);

    // Download
    canvas.toBlob(function(blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'seollal-fortune-' + currentFortune.birthYear + '.png';
      a.click();
      URL.revokeObjectURL(url);
    });

    trackEvent('share', { method: 'download' });
  }

  function shareTwitter() {
    if (!currentFortune) return;
    const animal = currentFortune.animal;
    const zodiacName = t('zodiac.' + animal.key);
    const text = t('share.twitterText', {
      zodiac: animal.emoji + zodiacName,
      year: currentFortune.birthYear
    }) || animal.emoji + zodiacName + ' ' + t('intro.title');
    const url = 'https://dopabrain.com/seollal-fortune/?lang=' + ((window.i18n && window.i18n.getLocale()) || 'ko');
    window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url), '_blank');
    trackEvent('share', { method: 'twitter' });
  }

  function shareFacebook() {
    if (!currentFortune) return;
    const url = 'https://dopabrain.com/seollal-fortune/?lang=' + ((window.i18n && window.i18n.getLocale()) || 'ko');
    window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank');
    trackEvent('share', { method: 'facebook' });
  }

  function shareCopyLink() {
    const url = 'https://dopabrain.com/seollal-fortune/?lang=' + ((window.i18n && window.i18n.getLocale()) || 'ko');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function() {
        showToast(t('share.copySuccess') || t('share.copyText'));
      });
    } else {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      showToast(t('share.copySuccess') || t('share.copyText'));
    }
    trackEvent('share', { method: 'copy_link' });
  }

  /* ===== Toast ===== */
  function showToast(msg) {
    let toast = $('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function() {
      toast.classList.remove('show');
    }, 2000);
  }

  /* ===== GA4 ===== */
  function trackEvent(name, params) {
    if (typeof gtag === 'function') {
      gtag('event', name, params || {});
    }
  }

  /* ===== Boot ===== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
