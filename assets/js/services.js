/* =========================================================
   TOPNOTCH DETAILLAB — SERVICES.JS
   Preset-choice handling, selection banners, and Package Finder.
   PHASE 1: Updated pricing for locked packages
========================================================= */

(function () {
  'use strict';

  const STORAGE_KEY = 'topnotchSelection';
  const DRAFT_KEY = 'topnotchBuilderDraft';

  // ===== LOCKED PACKAGE PRICING =====
  const PACKAGE_PRICING = {
    'Quick Reset': 40,
    'Full Reset': 90,
    'Deep Reset': 180,
    'Recovery': null
  };

  function getSelection() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function isNestedPage() {
    return window.location.pathname !== '/' && window.location.pathname !== '/index.html';
  }

  function pathTo(target) {
    return isNestedPage() ? '../' + target : target;
  }

  function packageAnchor(packageName) {
    const anchors = {
      'Quick Reset': 'services/#quick-reset',
      'Full Reset': 'services/#full-reset',
      'Deep Reset': 'services/#deep-reset',
      'Recovery': 'services/#recovery',
      'Recovery Assessment': 'services/#recovery'
    };
    return anchors[packageName] || 'services/';
  }

  function priceLabelFor(packageName, price) {
    if (packageName === 'Quick Reset') return '$40';
    if (packageName === 'Full Reset') return 'From $90';
    if (packageName === 'Deep Reset') return 'From $180';
    if (packageName === 'Recovery' || packageName === 'Recovery Assessment') return 'Custom Assessment';
    if (typeof price === 'number' && !Number.isNaN(price)) return 'Starting total $' + price;
    return '';
  }

  function hasCustomOrAssessmentSelection() {
    const sel = getSelection();
    return !!(sel && (sel.mode === 'custom' || sel.mode === 'assessment'));
  }

  function savePreset(pkg, price) {
    const selection = {
      mode: 'preset',
      package: pkg,
      price: price !== null ? Number(price) : null,
      priceLabel: priceLabelFor(pkg, price !== null ? Number(price) : null),
      services: [],
      assessmentRequired: pkg === 'Recovery'
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    } catch (error) {
      /* ignore storage failure */
    }
    return selection;
  }

  function goToBook() {
    window.location.href = pathTo('book/');
  }

  function clearSelection() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      /* ignore storage failure */
    }
  }

  function renderSelectionBanner() {
    const banner = document.getElementById('selectionBanner');
    if (!banner) return;

    const selection = getSelection();
    const title = document.getElementById('selectionBannerTitle');
    const meta = document.getElementById('selectionBannerMeta');
    const continueLink = document.getElementById('selectionContinue');
    const changeLink = document.getElementById('selectionChange');
    const clearButton = document.getElementById('selectionClear');

    if (!selection || !selection.package) {
      banner.hidden = true;
      return;
    }

    banner.hidden = false;
    if (title) title.textContent = selection.package;
    if (meta) meta.textContent = selection.priceLabel || priceLabelFor(selection.package, selection.price);
    if (continueLink) continueLink.href = pathTo('book/');
    if (changeLink) {
      if (selection.mode === 'custom' || selection.mode === 'assessment') {
        changeLink.href = pathTo('build/');
      } else if (window.location.pathname.includes('/services/')) {
        changeLink.href = '#' + (packageAnchor(selection.package).split('#')[1] || 'packages');
      } else {
        changeLink.href = pathTo(packageAnchor(selection.package));
      }
    }
    if (clearButton) {
      clearButton.onclick = function () {
        if (!window.confirm('Clear the selected service and start over?')) return;
        clearSelection();
        renderSelectionBanner();
      };
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.preset-choice').forEach(function (button) {
      button.addEventListener('click', function () {
        const pkg = button.dataset.package;
        const priceAttr = button.dataset.price;
        const price = priceAttr !== undefined && priceAttr !== '' ? Number(priceAttr) : PACKAGE_PRICING[pkg] || null;

        if (hasCustomOrAssessmentSelection()) {
          const confirmed = window.confirm('You have a custom build in progress. Choosing a preset will replace it. Continue?');
          if (!confirmed) return;
          clearSelection();
        }

        savePreset(pkg, price);
        goToBook();
      });
    });

    renderSelectionBanner();
  });

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('packageFinder');
    const conditionSelect = document.getElementById('finderCondition');
    const specialSelect = document.getElementById('finderSpecial');
    const resultBox = document.getElementById('finderResult');
    const actionWrap = document.getElementById('finderAction');
    if (!form || !conditionSelect || !specialSelect || !resultBox) return;

    function recommend(condition, special) {
      // Severe condition → Recovery Assessment
      if (condition === 'severe') {
        return { 
          package: 'Recovery', 
          price: null, 
          text: 'Your interior may require a <strong>Recovery Assessment</strong>. This handles severe neglect, excessive buildup, and conditions beyond standard package scope. Clear interior photos will be required before pricing.' 
        };
      }

      // Extensive pet hair or odor → Recovery Assessment
      if (special === 'heavy') {
        return { 
          package: 'Recovery', 
          price: null, 
          text: 'Extensive embedded pet hair or strong persistent odors may require a <strong>Recovery Assessment</strong> before a fixed price can be provided. Clear interior photos will be required.' 
        };
      }

      // Deep cleaning needs or some pet hair/odor → Deep Reset
      if (condition === 'deep' || special === 'some') {
        return { 
          package: 'Deep Reset', 
          price: 180, 
          text: 'Based on your answers, a <strong>Deep Reset (from $180)</strong> is a strong starting point. It includes complete interior service with extraction, vent detail, crevice precision, and condition-specific care.' 
        };
      }

      // Normal daily buildup → Full Reset
      if (condition === 'normal') {
        return { 
          package: 'Full Reset', 
          price: 90, 
          text: 'Based on your answers, a <strong>Full Reset (from $90)</strong> is well suited for normal everyday interiors. It covers all accessible surfaces, interior glass, vent detail, precision crevices, and final inspection.' 
        };
      }

      // Light maintenance → Quick Reset
      return { 
        package: 'Quick Reset', 
        price: 40, 
        text: 'Based on your answers, a <strong>Quick Reset ($40)</strong> looks like the right fit — trash removal, vacuuming, and interior surface refresh.' 
      };
    }

    let lastRecommendation = null;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const condition = conditionSelect.value;
      const special = specialSelect.value;
      if (!condition || !special) {
        resultBox.innerHTML = 'Please answer both questions to get your recommendation.';
        return;
      }
      lastRecommendation = recommend(condition, special);
      resultBox.innerHTML = lastRecommendation.text;
      if (actionWrap) {
        actionWrap.classList.add('visible');
        const button = actionWrap.querySelector('[data-finder-book]') || actionWrap.querySelector('.button');
        if (button) {
          button.textContent = 'Book ' + (lastRecommendation.package || 'Reset');
        }
      }
    });

    if (actionWrap) {
      const button = actionWrap.querySelector('[data-finder-book]') || actionWrap.querySelector('.button');
      if (button) {
        button.addEventListener('click', function () {
          if (!lastRecommendation) return;
          if (hasCustomOrAssessmentSelection()) {
            const confirmed = window.confirm('You have a custom build in progress. Choosing this recommendation will replace it. Continue?');
            if (!confirmed) return;
            clearSelection();
          }
          savePreset(lastRecommendation.package, lastRecommendation.price);
          goToBook();
        });
      }
    }
  });
})();
