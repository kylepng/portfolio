/* ============================================
   Auto Flow - User Guide Scripts
   ============================================ */

(function () {
  'use strict';

  // --- DOM References ---
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const scrollTopBtn = document.getElementById('scroll-top');
  const langSelect = document.getElementById('lang-select');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.section');

  // ============================================
  // 1. Smooth Scroll Navigation
  // ============================================
  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var targetId = this.getAttribute('href').substring(1);
      var target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Close mobile sidebar
        closeSidebar();
      }
    });
  });

  // ============================================
  // 2. Active Section Tracking
  // ============================================
  var observerOptions = {
    root: null,
    rootMargin: '-80px 0px -60% 0px',
    threshold: 0
  };

  var currentActive = null;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var id = entry.target.id;
        setActiveNav(id);
      }
    });
  }, observerOptions);

  sections.forEach(function (section) {
    observer.observe(section);
  });

  function setActiveNav(sectionId) {
    if (currentActive === sectionId) return;
    currentActive = sectionId;
    navLinks.forEach(function (link) {
      var href = link.getAttribute('href').substring(1);
      if (href === sectionId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // ============================================
  // 3. Mobile Hamburger
  // ============================================
  function closeSidebar() {
    document.body.classList.remove('sidebar-open');
  }

  function toggleSidebar() {
    document.body.classList.toggle('sidebar-open');
  }

  if (hamburger) {
    hamburger.addEventListener('click', toggleSidebar);
  }

  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  // Close on escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('sidebar-open')) {
      closeSidebar();
    }
  });

  // ============================================
  // 4. Expandable Sections
  // ============================================
  var expandableHeaders = document.querySelectorAll('.expandable-header');

  expandableHeaders.forEach(function (header) {
    header.addEventListener('click', function () {
      var content = this.nextElementSibling;
      var isExpanded = this.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
        this.setAttribute('aria-expanded', 'false');
        content.style.maxHeight = null;
      } else {
        this.setAttribute('aria-expanded', 'true');
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });

  // ============================================
  // 5. Copy Buttons
  // ============================================
  var copyButtons = document.querySelectorAll('.copy-btn');

  copyButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var codeBlock = this.closest('.code-block');
      if (!codeBlock) return;

      var codeEl = codeBlock.querySelector('code');
      if (!codeEl) return;

      var text = codeEl.textContent;

      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(function () {
          btn.classList.remove('copied');
          // Restore i18n text if available
          if (currentTranslations && currentTranslations['copy_btn']) {
            btn.textContent = currentTranslations['copy_btn'];
          } else {
            btn.textContent = 'Copy';
          }
        }, 2000);
      }).catch(function () {
        // Fallback for older browsers / file:// protocol
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(function () {
            btn.classList.remove('copied');
            btn.textContent = 'Copy';
          }, 2000);
        } catch (err) {
          btn.textContent = 'Error';
          setTimeout(function () {
            btn.textContent = 'Copy';
          }, 2000);
        }
        document.body.removeChild(textarea);
      });
    });
  });

  // ============================================
  // 6. Language Switcher (i18n)
  // ============================================
  var currentTranslations = null;
  var defaultLang = 'en';

  // RTL languages
  var rtlLanguages = ['ar'];

  // Store original innerHTML for each i18n element so we can restore
  // English formatting (which uses <strong>, <code>, etc.)
  var originalHTML = {};
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    originalHTML[el.getAttribute('data-i18n')] = el.innerHTML;
  });

  // Simple sanitizer: only allow <strong>, <code>, <em>, <br> tags
  // Safe because we control all translation JSON files
  function sanitizeHTML(str) {
    // First escape everything
    var div = document.createElement('div');
    div.textContent = str;
    var escaped = div.innerHTML;
    // Then restore only allowed tags
    escaped = escaped.replace(/&lt;(\/?(strong|code|em|br)\s*\/?)&gt;/gi, '<$1>');
    return escaped;
  }

  function applyTranslations(translations) {
    currentTranslations = translations;
    var elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (translations[key] !== undefined) {
        // Use sanitized innerHTML to preserve <strong>, <code>, <em> formatting
        el.innerHTML = sanitizeHTML(translations[key]);
      }
    });
  }

  function setLanguageDirection(lang) {
    if (rtlLanguages.indexOf(lang) !== -1) {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }

  function restoreOriginalHTML() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (originalHTML[key] !== undefined) {
        el.innerHTML = originalHTML[key];
      }
    });
  }

  function loadLanguage(lang) {
    setLanguageDirection(lang);

    // For English, restore original HTML (preserves inline formatting)
    if (lang === defaultLang) {
      restoreOriginalHTML();
      currentTranslations = null;
      localStorage.setItem('autoflow-lang', lang);
      // Still load en.json for copy button text etc.
      fetch('i18n/en.json')
        .then(function (r) { return r.ok ? r.json() : {}; })
        .then(function (t) { currentTranslations = t; })
        .catch(function () {});
      return;
    }

    var url = 'i18n/' + lang + '.json';

    fetch(url)
      .then(function (response) {
        if (!response.ok) throw new Error('Language file not found');
        return response.json();
      })
      .then(function (translations) {
        applyTranslations(translations);
        localStorage.setItem('autoflow-lang', lang);
      })
      .catch(function (err) {
        console.warn('Could not load language file: ' + lang, err);
        if (lang !== defaultLang) {
          loadLanguage(defaultLang);
        }
      });
  }

  if (langSelect) {
    langSelect.addEventListener('change', function () {
      loadLanguage(this.value);
    });

    // Restore saved language
    var savedLang = localStorage.getItem('autoflow-lang');
    if (savedLang && savedLang !== defaultLang) {
      langSelect.value = savedLang;
      loadLanguage(savedLang);
    } else {
      // Load English to populate currentTranslations
      loadLanguage(defaultLang);
    }
  }

  // ============================================
  // 7. Scroll-to-Top Button
  // ============================================
  function handleScrollTop() {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  }

  if (scrollTopBtn) {
    window.addEventListener('scroll', handleScrollTop, { passive: true });

    scrollTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============================================
  // 8. Patch Notes Modal
  // ============================================
  var PATCH_VERSION = 'v10.6.89';
  var patchOverlay = document.getElementById('patch-overlay');
  var patchDismiss = document.getElementById('patch-dismiss');

  function showPatchNotes() {
    var dismissed = localStorage.getItem('autoflow-patch-dismissed');
    if (dismissed === PATCH_VERSION) return;

    if (patchOverlay) {
      setTimeout(function () {
        patchOverlay.classList.add('visible');
      }, 600);
    }
  }

  function dismissPatchNotes() {
    if (patchOverlay) {
      patchOverlay.classList.remove('visible');
      localStorage.setItem('autoflow-patch-dismissed', PATCH_VERSION);
    }
  }

  if (patchDismiss) {
    patchDismiss.addEventListener('click', dismissPatchNotes);
  }

  if (patchOverlay) {
    patchOverlay.addEventListener('click', function (e) {
      if (e.target === patchOverlay) {
        dismissPatchNotes();
      }
    });
  }

  // Show patch notes on load
  showPatchNotes();

  // ============================================
  // 9. Smooth page load — set first section active
  // ============================================
  // If URL has a hash, scroll to it
  if (window.location.hash) {
    var hashTarget = document.querySelector(window.location.hash);
    if (hashTarget) {
      setTimeout(function () {
        hashTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

})();