/* GALE — runbooks: build per-section step lists + back-links from the ops-panel
   markup. External module so the enforcing CSP needs no inline hash. */
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
