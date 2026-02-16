/* i18n module — try-catch IIFE to prevent loader freeze */
;(function(){try{
  class I18n {
    constructor() {
      this.locale = this._detectLocale();
      this.translations = {};
      this.fallback = {};
      this._ready = false;
      this._readyCallbacks = [];
    }

    _detectLocale() {
      const supported = ['ko','en','ja','zh','es','pt','id','tr','de','fr','hi','ru'];
      // Check URL param
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');
      if (urlLang && supported.includes(urlLang)) return urlLang;
      // Check localStorage
      const saved = localStorage.getItem('seollal-fortune-lang');
      if (saved && supported.includes(saved)) return saved;
      // Check browser language
      const browserLang = (navigator.language || '').slice(0, 2);
      if (supported.includes(browserLang)) return browserLang;
      return 'ko';
    }

    async init() {
      try {
        const basePath = this._getBasePath();
        // Load fallback (ko) and target locale in parallel
        const loads = [this._loadJSON(basePath + 'ko.json')];
        if (this.locale !== 'ko') {
          loads.push(this._loadJSON(basePath + this.locale + '.json'));
        }
        const results = await Promise.allSettled(loads);
        this.fallback = results[0].status === 'fulfilled' ? results[0].value : {};
        this.translations = this.locale === 'ko'
          ? this.fallback
          : (results[1] && results[1].status === 'fulfilled' ? results[1].value : this.fallback);

        this._applyTranslations();
        this._updateHtmlLang();
        this._ready = true;
        this._readyCallbacks.forEach(cb => cb());
      } catch (e) {
        console.warn('i18n init load failed:', e.message);
        this._ready = true;
        this._readyCallbacks.forEach(cb => cb());
      }
    }

    _getBasePath() {
      const scripts = document.querySelectorAll('script[src*="i18n.js"]');
      if (scripts.length > 0) {
        const src = scripts[0].getAttribute('src');
        return src.replace('i18n.js', 'locales/');
      }
      return 'js/locales/';
    }

    async _loadJSON(url) {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed to load ' + url);
      return resp.json();
    }

    t(key, replacements) {
      const keys = key.split('.');
      let val = this.translations;
      for (const k of keys) {
        if (val && typeof val === 'object') val = val[k];
        else { val = undefined; break; }
      }
      // Fallback
      if (val === undefined) {
        val = this.fallback;
        for (const k of keys) {
          if (val && typeof val === 'object') val = val[k];
          else { val = undefined; break; }
        }
      }
      if (val === undefined) return key;
      if (typeof val !== 'string') return key;
      // Replace {{placeholders}}
      if (replacements) {
        Object.keys(replacements).forEach(rk => {
          val = val.replace(new RegExp('\\{\\{' + rk + '\\}\\}', 'g'), replacements[rk]);
        });
      }
      return val;
    }

    _applyTranslations() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const text = this.t(key);
        if (text !== key) {
          el.textContent = text;
        }
      });
      // Apply to placeholders
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const text = this.t(key);
        if (text !== key) el.placeholder = text;
      });
      // Apply to aria-label
      document.querySelectorAll('[data-i18n-aria]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria');
        const text = this.t(key);
        if (text !== key) el.setAttribute('aria-label', text);
      });
    }

    _updateHtmlLang() {
      document.documentElement.lang = this.locale;
    }

    async setLocale(lang) {
      this.locale = lang;
      localStorage.setItem('seollal-fortune-lang', lang);
      await this.init();
    }

    onReady(cb) {
      if (this._ready) cb();
      else this._readyCallbacks.push(cb);
    }

    getLocale() {
      return this.locale;
    }
  }

  window.i18n = new I18n();
  window.i18n.init();
}catch(e){console.warn('i18n init failed:',e.message);}})();
