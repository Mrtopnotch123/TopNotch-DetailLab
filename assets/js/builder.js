/* =========================================================
   TOPNOTCH DETAILLAB — BUILDER.JS
   Build Your Own Reset interactive page logic.
   Enforces rules, minimum, dependencies, assessment states.
   Uses sessionStorage keys: topnotchBuilderDraft, topnotchSelection
========================================================= */

(function () {
  'use strict';

  const DRAFT_KEY = 'topnotchBuilderDraft';
  const SELECTION_KEY = 'topnotchSelection';
  const MOBILE_MINIMUM = 40;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('builderForm');
    if (!form) return;

    const materialSelect = document.getElementById('interiorMaterial');
    const summaryEl = document.getElementById('builderSummary');
    const totalEl = document.getElementById('builderTotal');
    const messageEl = document.getElementById('builderMessage');
    const itemsEl = document.getElementById('selectedServices');
    const bundleWrap = document.getElementById('bundleRecommendation');
    const applyBtn = document.getElementById('applyRecommendedPreset');
    const continueBtn = document.getElementById('continueBooking');
    const resetBtn = document.getElementById('resetBuilder');

    /* ---- Collect all service controls ---- */
    function getServiceInputs() {
      return Array.from(form.querySelectorAll('[data-service]'));
    }

    /* ---- Read selected items ---- */
    function getSelected() {
      return getServiceInputs().filter(function (inp) {
        return inp.checked;
      });
    }

    /* ---- Read assessment-only triggers ---- */
    function getAssessmentSelected() {
      return getServiceInputs().filter(function (inp) {
        return inp.checked && inp.dataset.assessment === 'true';
      });
    }

    /* ---- Check assessment state ---- */
    function isAssessmentMode() {
      return getAssessmentSelected().length > 0;
    }

    /* ---- Get material value ---- */
    function getMaterial() {
      return materialSelect ? materialSelect.value : '';
    }

    /* ---- Enforce mutually exclusive groups ---- */
    function enforceGroups(changed) {
      if (!changed.dataset.group) return;
      const group = changed.dataset.group;
      if (!changed.checked) return;

      getServiceInputs().forEach(function (inp) {
        if (inp !== changed && inp.dataset.group === group) {
          inp.checked = false;
        }
      });
    }

    /* ---- Enforce dependencies ---- */
    function enforceDependencies() {
      getServiceInputs().forEach(function (inp) {
        if (!inp.dataset.requires) return;
        const reqKey = inp.dataset.requires;
        /* Check if the required service is selected */
        const reqInput = findServiceInput(reqKey);
        const item = inp.closest('.builder-item');
        if (!item) return;

        if (reqInput && !reqInput.checked) {
          inp.checked = false;
          item.classList.add('is-disabled');
          inp.disabled = true;
        } else {
          item.classList.remove('is-disabled');
          inp.disabled = false;
        }
      });
    }

    /* ---- Find service input by exact data-service name ---- */
    function findServiceInput(name) {
      return Array.from(getServiceInputs()).find(function (inp) {
        return inp.dataset.service === name;
      }) || null;
    }

    /* ---- Enforce material eligibility for Leather ---- */
    function enforceLeatherEligibility() {
      const leatherInput = findServiceInput('Leather Cleaning & Conditioning');
      if (!leatherInput) return;
      const item = leatherInput.closest('.builder-item');
      if (!item) return;

      const mat = getMaterial();
      const eligible = mat === 'Leather / leather-trimmed' || mat === 'Mixed materials';

      if (!eligible) {
        leatherInput.checked = false;
        leatherInput.disabled = true;
        item.classList.add('is-disabled');
      } else {
        leatherInput.disabled = false;
        item.classList.remove('is-disabled');
      }
    }

    /* ---- Enforce extraction overlap rules ---- */
    function enforceExtractionRules() {
      const oneArea = form.querySelector('[data-service="One Localized Extraction Area"]');
      const twoArea = form.querySelector('[data-service="Two Localized Extraction Areas"]');
      const fullCarpet = form.querySelector('[data-service="Full Carpet Extraction"]');
      const fullSeat = form.querySelector('[data-service="Full Cloth-Seat Extraction"]');

      /* Full Carpet replaces localized carpet extraction */
      if (fullCarpet && fullCarpet.checked) {
        /* Uncheck one/two localized if they're carpet-only selections */
        /* (allowed to keep both if user wants seat too — just deactivate the duplicates) */
      }

      /* Full Cloth-Seat replaces localized seat extraction */
      if (fullSeat && fullSeat.checked) {
        /* Similarly handled — both full extractions may coexist */
      }

      /* One and Two localized are mutually exclusive (enforced by data-group) */
      /* No additional handling needed beyond enforceGroups */
    }

    /* ---- Calculate total ---- */
    function calculateTotal() {
      let subtotal = 0;
      getSelected().forEach(function (inp) {
        const price = parseFloat(inp.dataset.price) || 0;
        subtotal += price;
      });
      return Math.max(subtotal > 0 ? MOBILE_MINIMUM : 0, subtotal);
    }

    /* ---- Render summary ---- */
    function renderSummary() {
      const selected = getSelected();
      const assessment = getAssessmentSelected();
      const inAssessmentMode = assessment.length > 0;

      /* Render items list */
      if (itemsEl) {
        itemsEl.innerHTML = '';
        if (selected.length === 0) {
          const li = document.createElement('li');
          li.style.color = 'var(--muted)';
          li.style.fontStyle = 'italic';
          li.textContent = 'No services selected yet.';
          itemsEl.appendChild(li);
        } else {
          selected.forEach(function (inp) {
            const li = document.createElement('li');
            const nameSpan = document.createElement('span');
            nameSpan.textContent = inp.dataset.service;
            const priceSpan = document.createElement('span');

            if (inp.dataset.assessment === 'true') {
              priceSpan.textContent = 'Assessment';
              priceSpan.style.color = '#ffd24a';
            } else {
              priceSpan.textContent = '$' + (parseFloat(inp.dataset.price) || 0).toFixed(0);
            }

            li.appendChild(nameSpan);
            li.appendChild(priceSpan);
            itemsEl.appendChild(li);
          });
        }
      }

      /* Total */
      if (totalEl) {
        if (inAssessmentMode) {
          if (!prefersReducedMotion) animateBump(totalEl);
          totalEl.textContent = 'Assessment Required';
          totalEl.style.fontSize = '1.25rem';
        } else {
          const total = calculateTotal();
          if (!prefersReducedMotion) animateBump(totalEl);
          totalEl.textContent = total > 0 ? '$' + total : '$0';
          totalEl.style.fontSize = '';
        }
      }

      /* Message */
      if (messageEl) {
        messageEl.className = 'builder-message';
        messageEl.innerHTML = '';

        if (inAssessmentMode) {
          messageEl.classList.add('assessment');
          const conditions = assessment.map(function (inp) {
            return inp.dataset.service;
          }).join(', ');
          messageEl.innerHTML = '<strong>Assessment required</strong><br>The following conditions require a Recovery Assessment before pricing can be provided: ' +
            escapeHtml(conditions) + '. A fixed price cannot be calculated.';
          messageEl.style.display = 'block';
        } else {
          const subtotal = getSelected().reduce(function (sum, inp) {
            return sum + (parseFloat(inp.dataset.price) || 0);
          }, 0);

          if (subtotal > 0 && subtotal < MOBILE_MINIMUM) {
            messageEl.classList.add('info');
            messageEl.innerHTML = 'A $' + MOBILE_MINIMUM + ' mobile service minimum applies. Your total has been adjusted.';
            messageEl.style.display = 'block';
          } else {
            messageEl.style.display = 'none';
          }
        }
      }

      /* Preset recommendation */
      checkPresetRecommendation(selected, inAssessmentMode);

      /* Continue button */
      if (continueBtn) {
        continueBtn.disabled = selected.length === 0;
      }
    }

    /* ---- Animate total bump ---- */
    function animateBump(el) {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
      setTimeout(function () { el.classList.remove('bump'); }, 200);
    }

    /* ---- Escape HTML helper ---- */
    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    /* ---- Check preset recommendations ---- */
    function checkPresetRecommendation(selected, inAssessmentMode) {
      if (!bundleWrap) return;
      bundleWrap.className = 'bundle-recommendation';
      bundleWrap.innerHTML = '';

      if (inAssessmentMode || selected.length === 0) {
        if (applyBtn) applyBtn.style.display = 'none';
        return;
      }

      const total = calculateTotal();
      let rec = null;

      /* Recommend Quick Reset if selection matches or costs more than $40 */
      if (total === 40 && selected.length <= 4) {
        const quickServices = [
          'Interior Vacuum',
          'Light Surface Wipe-Down',
          'Cargo-Area Cleaning'
        ];
        const hasOnlyQuick = selected.every(function (inp) {
          return quickServices.some(function (s) { return inp.dataset.service.includes(s); });
        });
        if (!hasOnlyQuick) {
          /* Selection not clearly Quick Reset territory */
        } else {
          rec = { package: 'Quick Reset', price: 40 };
        }
      }

      /* Recommend Full Reset if total is ≥ $75 and selection is broad */
      if (!rec && total >= 75 && total <= 90) {
        /* Check if selected services are covered by Full Reset */
        const fullResetCovers = [
          'Interior Vacuum',
          'Light Surface Wipe-Down',
          'Thorough Interior-Surface Cleaning',
          'Interior Glass',
          'Interior Finish & UV Protection'
        ];
        const allCovered = selected.every(function (inp) {
          return fullResetCovers.some(function (s) {
            return inp.dataset.service === s;
          });
        });
        if (allCovered) {
          rec = { package: 'Full Reset', price: 75 };
        }
      }

      /* Recommend Deep Reset if total >= $150 and comprehensive */
      if (!rec && total >= 150) {
        const deepCovers = [
          'Interior Vacuum', 'Light Surface Wipe-Down', 'Thorough Interior-Surface Cleaning',
          'Interior Glass', 'Air Blowout, Vents & Crevices', 'Door-Jamb Cleaning',
          'Full Carpet Extraction', 'Full Cloth-Seat Extraction',
          'Leather Cleaning & Conditioning', 'Interior Finish & UV Protection',
          'Cargo-Area Cleaning'
        ];
        const deepCount = selected.filter(function (inp) {
          return deepCovers.some(function (s) { return inp.dataset.service === s; });
        }).length;
        if (deepCount >= 6) {
          rec = { package: 'Deep Reset', price: 150 };
        }
      }

      if (!rec) {
        if (applyBtn) applyBtn.style.display = 'none';
        return;
      }

      const msg = document.createElement('div');
      msg.className = 'builder-message recommend';
      msg.innerHTML = '<strong>Preset recommendation:</strong> The <strong>' + escapeHtml(rec.package) +
        ' (from $' + rec.price + ')</strong> offers equal or better coverage at this price. ' +
        'Apply it to continue, or keep your custom build.';
      bundleWrap.appendChild(msg);

      if (applyBtn) {
        applyBtn.dataset.recPackage = rec.package;
        applyBtn.dataset.recPrice = rec.price;
      }

      bundleWrap.classList.add('visible');
      if (applyBtn) applyBtn.style.display = '';
    }

    /* ---- Apply recommended preset ---- */
    if (applyBtn) {
      applyBtn.addEventListener('click', function () {
        const pkg = applyBtn.dataset.recPackage;
        const price = applyBtn.dataset.recPrice;
        if (!pkg) return;

        const confirmed = window.confirm(
          'Replace your custom build with the ' + pkg + ' preset?'
        );
        if (!confirmed) return;

        const selection = {
          mode: 'preset',
          package: pkg,
          price: price ? Number(price) : null,
          services: [],
          assessmentRequired: false
        };

        try {
          sessionStorage.setItem(SELECTION_KEY, JSON.stringify(selection));
          sessionStorage.removeItem(DRAFT_KEY);
        } catch (e) { /* */ }

        window.location.href = '../book/';
      });
    }

    /* ---- Continue to booking ---- */
    if (continueBtn) {
      continueBtn.addEventListener('click', function () {
        const selected = getSelected();
        if (selected.length === 0) return;

        const inAssessmentMode = isAssessmentMode();

        let selection;

        if (inAssessmentMode) {
          const conditions = getAssessmentSelected().map(function (inp) {
            return inp.dataset.service;
          });
          selection = {
            mode: 'assessment',
            package: 'Recovery Assessment',
            price: null,
            services: conditions,
            assessmentRequired: true
          };
        } else {
          const services = selected.map(function (inp) {
            return {
              name: inp.dataset.service,
              price: parseFloat(inp.dataset.price) || 0
            };
          });
          const rawTotal = services.reduce(function (sum, s) { return sum + s.price; }, 0);
          const total = Math.max(rawTotal > 0 ? MOBILE_MINIMUM : 0, rawTotal);

          selection = {
            mode: 'custom',
            package: 'Build Your Own Reset',
            price: total,
            services: services,
            assessmentRequired: false
          };
        }

        try {
          sessionStorage.setItem(SELECTION_KEY, JSON.stringify(selection));
          /* Save draft for potential restoration */
          const draft = { material: getMaterial(), checked: selected.map(function (inp) { return inp.dataset.service; }) };
          sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        } catch (e) { /* */ }

        window.location.href = '../book/';
      });
    }

    /* ---- Reset builder ---- */
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        const confirmed = window.confirm('Reset all selections and start over?');
        if (!confirmed) return;

        getServiceInputs().forEach(function (inp) {
          inp.checked = false;
          inp.disabled = false;
        });

        if (materialSelect) materialSelect.value = '';

        try {
          sessionStorage.removeItem(DRAFT_KEY);
          sessionStorage.removeItem(SELECTION_KEY);
        } catch (e) { /* */ }

        /* Re-enable all disabled items */
        form.querySelectorAll('.builder-item.is-disabled').forEach(function (item) {
          item.classList.remove('is-disabled');
        });

        renderSummary();
      });
    }

    /* ---- Handle changes ---- */
    form.addEventListener('change', function (e) {
      const inp = e.target;
      if (!inp.dataset.service && inp !== materialSelect) return;

      if (inp.dataset.group) {
        enforceGroups(inp);
      }

      enforceLeatherEligibility();
      enforceDependencies();
      enforceExtractionRules();
      renderSummary();
      saveDraft();
    });

    /* ---- Material change ---- */
    if (materialSelect) {
      materialSelect.addEventListener('change', function () {
        enforceLeatherEligibility();
        renderSummary();
        saveDraft();
      });
    }

    /* ---- Save draft to session ---- */
    function saveDraft() {
      const selected = getSelected();
      const draft = {
        material: getMaterial(),
        checked: selected.map(function (inp) { return inp.dataset.service; })
      };
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch (e) { /* */ }
    }

    /* ---- Restore draft from session ---- */
    function restoreDraft() {
      try {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        if (!raw) return;
        const draft = JSON.parse(raw);

        if (draft.material && materialSelect) {
          materialSelect.value = draft.material;
        }

        if (Array.isArray(draft.checked)) {
          draft.checked.forEach(function (serviceName) {
            var inp = Array.from(form.querySelectorAll('[data-service]')).find(function (el) {
              return el.dataset.service === serviceName;
            });
            if (inp) inp.checked = true;
          });
        }

        enforceLeatherEligibility();
        enforceDependencies();
      } catch (e) {
        /* Malformed storage — ignore */
        try { sessionStorage.removeItem(DRAFT_KEY); } catch (e2) { /* */ }
      }
    }

    /* ---- Init ---- */
    restoreDraft();
    enforceLeatherEligibility();
    enforceDependencies();
    renderSummary();
  });
})();
