/* GALE — runbooks: build per-section step lists + back-links from the ops-panel
   markup. External module so the enforcing CSP needs no inline hash. */

/* live runbook filter (pass #5 #26/#27/#46): one search input filters whole
   sections by heading + step text, with an aria-live result count and an
   empty state. Match highlighting is <mark>-based and rebuilds the heading
   text nodes only (steps stay untouched so progress state is preserved). */
function initRunbookFilter() {
  const main = document.querySelector("main");
  const sections = [...main.querySelectorAll("section.ops-panel[id]")];
  if (!main || sections.length < 2) return;
  const bar = document.createElement("div");
  bar.className = "runbook-filter";
  const input = document.createElement("input");
  input.type = "search";
  input.id = "runbook-search";
  input.placeholder = "Filter runbooks… (title or step text)";
  input.setAttribute("aria-label", "Filter runbooks");
  input.setAttribute("autocomplete", "off");
  const count = document.createElement("p");
  count.className = "mini-note";
  count.id = "runbook-filter-count";
  count.setAttribute("role", "status");
  count.setAttribute("aria-live", "polite");
  bar.append(input, count);
  const intro = main.querySelector("p");
  if (intro) intro.insertAdjacentElement("afterend", bar);
  else main.insertBefore(bar, main.firstChild);

  const sectionsText = new Map(sections.map((s) => [s, s.textContent.toLowerCase()]));
  const paint = () => {
    const q = input.value.trim().toLowerCase();
    let visible = 0;
    for (const s of sections) {
      const show = !q || sectionsText.get(s).includes(q);
      s.hidden = !show;
      if (show) visible++;
      const h = s.querySelector("h2");
      if (h && h.dataset.origTitle === undefined) h.dataset.origTitle = h.textContent;
      if (h) {
        if (q && show) {
          const i = h.dataset.origTitle.toLowerCase().indexOf(q);
          h.innerHTML = i < 0 ? h.dataset.origTitle
            : `${h.dataset.origTitle.slice(0, i)}<mark>${h.dataset.origTitle.slice(i, i + q.length)}</mark>${h.dataset.origTitle.slice(i + q.length)}`;
        } else h.textContent = h.dataset.origTitle;
      }
    }
    count.textContent = q
      ? (visible ? `${visible} of ${sections.length} runbooks match “${input.value.trim()}”` : `No runbook matches “${input.value.trim()}” — clear the filter to see all.`)
      : "";
    main.classList.toggle("runbook-filter-empty", !!q && !visible);
  };
  input.addEventListener("input", paint);
  paint();
}
initRunbookFilter();

document.querySelectorAll("main section.ops-panel[id]").forEach((section) => {
    const steps = [...section.querySelectorAll("ol > li")];
    if (!steps.length) return;
    const key = `gale-runbook-progress:${section.id}`;
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(key) || "[]"); } catch {}
    const status = document.createElement("p");
    status.className = "runbook-progress mini-note";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    const update = () => {
      const done = steps.filter((step) => step.querySelector("input").checked).length;
      status.innerHTML = `<span>Progress</span><span class="runbook-progress-track" aria-hidden="true"><i style="width:${Math.round(done / steps.length * 100)}%"></i></span><strong>${done}/${steps.length} complete</strong>`;
      try { localStorage.setItem(key, JSON.stringify(steps.map((step) => step.querySelector("input").checked))); } catch {}
    };
    section.insertBefore(status, section.querySelector("ol"));
    steps.forEach((step, index) => {
      const check = document.createElement("input");
      check.type = "checkbox";
      check.className = "runbook-step-check";
      check.setAttribute("aria-label", `Mark step ${index + 1} complete`);
      check.checked = !!saved[index];
      check.addEventListener("change", update);
      step.prepend(check);
      step.classList.toggle("runbook-step-done", check.checked);
      check.addEventListener("change", () => step.classList.toggle("runbook-step-done", check.checked));
    });
    update();
  });
  document.querySelectorAll("code[data-copy]").forEach((code) => {
    const raw = code.textContent || "", parts = raw.split(/(\s+)/);
    const fragment = document.createDocumentFragment();
    parts.forEach((part, index) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { fragment.append(document.createTextNode(part)); return; }
      const span = document.createElement("span");
      span.className = /^\//.test(part) ? "runbook-token-path" : /^-/.test(part) ? "runbook-token-flag" : index === 0 ? "runbook-token-command" : "";
      span.textContent = part;
      fragment.append(span);
    });
    code.replaceChildren(fragment);
  });
