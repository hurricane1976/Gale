import {boot,esc,setHTML,setText,tracedFetch,skeleton} from "./shared.js";
const $=(id)=>document.getElementById(id);
boot();
let busy=false,hadData=false;
for(const g of ["climate","water","security"]) skeleton(document.getElementById("home-"+g),2,72); // first-paint placeholder (#68)
async function refresh(){
 if(busy)return;busy=true;
 try{
  const response=await tracedFetch("/api/fleet/home/status",{cache:"no-store",signal:AbortSignal.timeout(15000)});
  const data=await response.json();
  const states={pairing_required:"Home Assistant is installed. Create your account, pair devices, then connect selected entities to Gale.",not_configured:"Home Assistant is not installed or connected yet.",authentication_required:"Home data requires an authorized Tailscale operator connection. Use Home Assistant to sign in for device controls.",unavailable:"Home connection unavailable. Device states are unknown.",connected:"Home Assistant connected · monitoring selected devices."};
  setText($("home-status"),states[data.state]||"Home connection unknown.");
  $("home-setup").hidden=data.state==="connected";
  for(const group of ["climate","water","security"]){
   const rows=data.groups?.[group]||[];
   setHTML($("home-"+group),rows.length?rows.map(r=>`<article class="target-card"><strong>${esc(r.attributes.friendly_name||r.entity_id)}</strong><p>${esc(r.state)} ${esc(r.attributes.unit_of_measurement||"")}</p>${Object.entries(r.attributes).filter(([k])=>["current_temperature","temperature","hvac_action","current_humidity","battery_level"].includes(k)).map(([k,v])=>`<p>${esc(k.replaceAll("_"," "))}: ${esc(String(v))}</p>`).join("")}<p class="mono-dim">Last state update ${esc(r.last_updated?new Date(r.last_updated).toLocaleString():"unknown")}</p></article>`).join(""):"<p>No verified connected data.</p>");
  }
  hadData=true;
  setText($("home-freshness"),data.collected_at?`Collected ${new Date(data.collected_at).toLocaleString()} · refresh every 30 seconds. Availability is reported by Home Assistant; unchanged state timestamps do not prove a disconnected device.`:"No verified device collection timestamp.");
  const link=$("home-controls");link.hidden=!data.dashboard_url;if(data.dashboard_url)link.href=data.dashboard_url;
 }catch(e){
  // stale-tolerant (#68): one blip used to wipe the last good render
  setText($("home-status"),"Home connection unavailable. Device states are unknown.");
  if(hadData) setText($("home-freshness"),`Collection unavailable (${String(e.message||e)}) — device data above is the last known state, not a live reading.`);
  else { for(const group of ["climate","water","security"])setText($("home-"+group),"Unknown — home data unavailable."); setText($("home-freshness"),"Collection unavailable; no data has been received yet."); }
  $("home-controls").hidden=true;
 }finally{busy=false;}
}
refresh();setInterval(refresh,30000);
// manual refresh (#68)
{
  const btn=document.createElement("button");
  btn.type="button";btn.className="mini-toggle";btn.textContent="refresh now";
  btn.style.marginLeft="8px";
  const fresh=document.getElementById("home-freshness");
  if(fresh&&fresh.parentElement){fresh.parentElement.appendChild(btn);btn.addEventListener("click",()=>{if(!busy)refresh();});}
}
