import {boot,esc,setHTML,setText,tracedFetch} from "./shared.js";
boot();
const $=id=>document.getElementById(id);
let busy=false;
async function refresh(){
 if(busy)return;busy=true;
 try{
  const response=await tracedFetch("api/fleet/home/status",{cache:"no-store",signal:AbortSignal.timeout(15000)});
  const data=await response.json();
  const states={pairing_required:"Home Assistant is installed. Create your account, pair devices, then connect selected entities to Gale.",not_configured:"Home Assistant is not installed or connected yet.",authentication_required:"Home data requires an authorized Tailscale operator connection. Use Home Assistant to sign in for device controls.",unavailable:"Home connection unavailable. Device states are unknown.",connected:"Home Assistant connected · monitoring selected devices."};
  setText($("home-status"),states[data.state]||"Home connection unknown.");
  $("home-setup").hidden=data.state==="connected";
  for(const group of ["climate","water","security"]){
   const rows=data.groups?.[group]||[];
   setHTML($("home-"+group),rows.length?rows.map(r=>`<article class="target-card"><strong>${esc(r.attributes.friendly_name||r.entity_id)}</strong><p>${esc(r.state)} ${esc(r.attributes.unit_of_measurement||"")}</p>${Object.entries(r.attributes).filter(([k])=>["current_temperature","temperature","hvac_action","current_humidity","battery_level"].includes(k)).map(([k,v])=>`<p>${esc(k.replaceAll("_"," "))}: ${esc(String(v))}</p>`).join("")}<p class="mono-dim">Last state update ${esc(r.last_updated?new Date(r.last_updated).toLocaleString():"unknown")}</p></article>`).join(""):"<p>No verified connected data.</p>");
  }
  setText($("home-freshness"),data.collected_at?`Collected ${new Date(data.collected_at).toLocaleString()} · refresh every 30 seconds. Availability is reported by Home Assistant; unchanged state timestamps do not prove a disconnected device.`:"No verified device collection timestamp.");
  const link=$("home-controls");link.hidden=!data.dashboard_url;if(data.dashboard_url)link.href=data.dashboard_url;
 }catch(e){setText($("home-status"),"Home connection unavailable. Device states are unknown.");for(const group of ["climate","water","security"])setText($("home-"+group),"Unknown — home data unavailable.");setText($("home-freshness"),"Collection unavailable; previous data has been cleared.");$("home-controls").hidden=true;
 }finally{busy=false;}
}
refresh();setInterval(refresh,30000);
