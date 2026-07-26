/* =========================================================
   TOPNOTCH DETAILLAB — SERVICES.JS
   Preset-choice handling and Package Finder.
   Saves to sessionStorage key: topnotchSelection
========================================================= */

(function () {
  'use strict';

  const STORAGE_KEY = 'topnotchSelection';
  const DRAFT_KEY = 'topnotchBuilderDraft';

  /* ---------- Read existing selection ---------- */
  function getExistingSelection() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function hasCustomOrAssessmentSelection() {
    const sel = getExistingSelection();
    if (!sel) return false;
    return sel.mode === 'custom' || sel.mode === 'assessment';
  }

  /* ---------- Save preset selection ---------- */
  function savePreset(pkg, price) {
    const selection = {
      mode: 'preset',
      package: pkg,
      price: price !== null ? Number(price) : null,
      services: [],
      assessmentRequired: pkg === 'Recovery'
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    } catch (e) {
      /* sessionStorage unavailable */
    }
    return selection;
  }

  /* ---------- Navigate to book page ---------- */
  function goToBook() {
    /* Detect if we're already in a subdirectory */
    const path = window.location.pathname;
    const isNested = path.includes('/services/');
    window.location.href = isNested ? '../book/' : 'book/';
  }

  /* ---------- Preset-choice buttons ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    const presetButtons = document.querySelectorAll('.preset-choice');

    presetButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const pkg = btn.dataset.package;
        const priceAttr = btn.dataset.price;
        const price = priceAttr !== undefined ? Number(priceAttr) : null;

        /* Warn before replacing a custom or assessment build */
        if (hasCustomOrAssessmentSelection()) {
          const confirmed = window.confirm(
            'You have a custom build in progress. Choosing a preset will replace it. Continue?'
          );
          if (!confirmed) return;
          /* Clear the builder draft too */
          try { sessionStorage.removeItem(DRAFT_KEY); } catch (e) { /* */ }
        }

        savePreset(pkg, price);
        goToBook();
      });
    });
  });

  /* ---------- Package Finder ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('packageFinder');
    const conditionSelect = document.getElementById('finderCondition');
    const specialSelect = document.getElementById('finderSpecial');
    const resultBox = document.getElementById('finderResult');
    const actionWrap = document.getElementById('finderAction');

    if (!form || !conditionSelect || !specialSelect || !resultBox) return;

    /* Recommendation engine */
    function recommend(condition, special) {
      /* Severe neglect → Recovery regardless */
      if (condition === 'severe') {
        return {
          package: 'Recovery',
          price: null,
          assessmentRequired: true,
          text: 'Your interior may require a <strong>Recovery Assessment</strong>. Recovery handles severe neglect, excessive buildup, and conditions beyond the scope of our preset services. Clear interior photos are required before pricing.',
          actionText: 'Request Recovery Assessment'
        };
      }

      /* Heavy special conditions → Recovery */
      if (special === 'heavy') {
        return {
          package: 'Recovery',
          price: null,
          assessmentRequired: true,
          text: 'Extensive embedded pet hair or strong persistent odors may require a <strong>Recovery Assessment</strong> before a fixed price can be provided.',
          actionText: 'Request Recovery Assessment'
        };
      }

      /* Deep cleaning or some special conditions */
      if (condition === 'deep' || special === 'some') {
        return {
          package: 'Deep Reset',
          price: 150,
          assessmentRequired: false,
          text: 'Based on your answers, a <strong>Deep Reset (from $150)</strong> is a strong starting point. It includes extraction, compressed-air blowout, vent cleaning, door jambs, and cargo area.',
          actionText: 'Book Deep Reset'
        };
      }

      /* Normal daily buildup */
      if (condition === 'normal') {
        return {
          package: 'Full Reset',
          price: 75,
          assessmentRequired: false,
          text: 'Based on your answers, a <strong>Full Reset (from $75)</strong> is well suited for normal everyday interiors. It covers all accessible surfaces, interior glass, and Interior Finish &amp; UV Protection.',
          actionText: 'Book Full Reset'
        };
      }

      /* Light / maintained */
      return {
        package: 'Quick Reset',
        price: 40,
        assessmentRequired: false,
        text: 'Based on your answers, a <strong>Quick Reset ($40)</strong> looks like the right fit — vacuuming, trash removal, and a light surface wipe-down.',
        actionText: 'Book Quick Reset'
      };
    }

    let lastRecommendation = null;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const condition = conditionSelect.value;
      const special = specialSelect.value;

      if (!condition || !special) {
        resultBox.innerHTML = 'Please answer both questions to get your recommendation.';
        return;
      }

      const rec = recommend(condition, special);
      lastRecommendation = rec;

      resultBox.innerHTML = rec.text;

      if (actionWrap) {
        actionWrap.classList.add('visible');
        const btn = actionWrap.querySelector('[data-finder-book]') ||
                    actionWrap.querySelector('.button');
        if (btn) btn.textContent = rec.actionText;
      }
    });

    /* Action button: save and navigate */
    if (actionWrap) {
      const btn = actionWrap.querySelector('[data-finder-book]') ||
                  actionWrap.querySelector('.button');
      if (btn) {
        btn.addEventListener('click', function () {
          if (!lastRecommendation) return;

          if (hasCustomOrAssessmentSelection()) {
            const confirmed = window.confirm(
              'You have a custom build in progress. Choosing this recommendation will replace it. Continue?'
            );
            if (!confirmed) return;
            try { sessionStorage.removeItem(DRAFT_KEY); } catch (e) { /* */ }
          }

          savePreset(lastRecommendation.package, lastRecommendation.price);
          goToBook();
        });
      }
    }
  });
})();
