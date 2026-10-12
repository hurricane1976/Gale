/* GALE — offline fallback page behaviour (pass #5 #5/#6). External module:
   the enforcing CSP allows only hashed inline bootstraps, so the retry
   logic lives here. Reloads the moment connectivity returns (online event
   fires even from a page the SW served from cache), otherwise the button
   is an honest manual check. */
const btn = document.getElementById("offline-retry");
if (btn) {
  btn.addEventListener("click", () => {
    if (navigator.onLine) location.reload();
    else btn.textContent = "still offline — the browser will retry when the network returns";
  });
}
addEventListener("online", () => location.reload(), { once: true });
