"use strict";
const $ = id => document.getElementById(id);
import words from "./translations.mjs";
let saved;
try { saved = localStorage.getItem("porcr-language"); } catch {}
const preferred = (navigator.languages || [navigator.language]).map(s => s.slice(0,2).toLowerCase()).find(s => s in words);
const pageLanguage = document.documentElement.dataset.language;
let lang = pageLanguage || (["en","es"].includes(saved) ? saved : preferred || "es");
let statusKey = "", point = null, result = null, ticket = 0, copied = false;
let pin, highlight, accuracyCircle;
const map = L.map("map",{zoomControl:false,zoomSnap:.1,zoomDelta:1,scrollWheelZoom:false,minZoom:5,maxZoom:19,preferCanvas:true,worldCopyJump:false});
map.attributionControl.setPrefix(false);
const palette = ["","#b6c599","#bbcb9e","#aec39a","#9dbb91","#cbd1a4","#b8caa8","#a2bf9d"];
const overview = L.layerGroup().addTo(map);
const labels = L.layerGroup().addTo(map);
const streets = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'});
const dataCache = new Map();
function json(name) {
  if (!dataCache.has(name)) dataCache.set(name,fetch("map/"+name+".json").then(r=>{
    if (!r.ok) throw Error("map data");
    return r.json();
  }).catch(e=>{dataCache.delete(name);throw e;}));
  return dataCache.get(name);
}
function national() {
  map.fitBounds([[8.04,-85.96],[11.24,-82.51]],{padding:[18,18],animate:false});
}
function label(lat,lng,name,style) {
  const span = document.createElement("span"); span.textContent=name;
  L.marker([lat,lng],{interactive:false,keyboard:false,icon:L.divIcon({className:style,html:span,iconSize:[0,0]})}).addTo(labels);
}
function drawLabels() {
  labels.clearLayers();
  for(const [lat,lon,name] of [[10.59,-85.43,"Liberia"],[9.93,-84.08,"San José"],[10,-83.04,"Limón"],[9.28,-83.7,"San Isidro"],[10.35,-84.46,"Ciudad Quesada"]]) {
    L.circleMarker([lat,lon],{radius:3,color:"#f9f9e9",weight:1,fillColor:"#31563f",fillOpacity:1,interactive:false}).addTo(labels);
    label(lat+.085,lon,name,"place-label");
  }
  label(9.12,-85.25,words[lang].pacific,"water-label");label(10.91,-82.8,words[lang].caribbean,"water-label");
  label(11.28,-84.98,"NICARAGUA","neighbor-label");label(8.58,-82.62,"PANAMÁ","neighbor-label");
}
national();
function detailLevel() {
  if(map.getZoom()>=10){streets.addTo(map);map.removeLayer(labels);}
  else {map.removeLayer(streets);labels.addTo(map);}
  // Keep regional polygons beneath the street layer as a network fallback.
  if(map.hasLayer(streets)) streets.setZIndex(1);
  map.getPane("regional").style.zIndex=map.hasLayer(streets)?"190":"350";
}
map.createPane("regional");
map.on("zoomend",detailLevel);detailLevel();
Promise.all([json("neighbors"),json("overview")]).then(([neighbors,districts])=>{
  L.geoJSON(neighbors,{pane:"regional",interactive:false,style:{color:"#9fae99",weight:1,fillColor:"#e3e5cd",fillOpacity:1}}).addTo(overview);
  L.geoJSON(districts,{pane:"regional",interactive:false,style:f=>({color:"#819c7c",weight:.6,opacity:.55,fillColor:palette[f.properties.p],fillOpacity:1})}).addTo(overview);
}).catch(()=>setStatus("failed"));
function render() {
  const t=words[lang];
  document.documentElement.lang=lang;document.title=t.title;
  document.querySelectorAll("[data-t]").forEach(el=>el.textContent=t[el.dataset.t]);
  for(const code of ["es","en"]) $(code).setAttribute("aria-current",code===lang?"true":"false");
  for(const key of ["plus","minus","reset","close"]) {$(key).title=t[key];$(key).setAttribute("aria-label",t[key]);}
  $("map").setAttribute("aria-label",t.keyboard);
  $("status").textContent=t[statusKey]||"";$("intro").hidden=!!result;$("answer").hidden=!result;
  if(result){
    const [code,province,canton,district]=result;
    $("districtName").textContent=district;$("province").textContent=province;$("canton").textContent=canton;$("code").textContent=code;
  }
  $("copy").textContent=copied?t.copied:t.copy;
  $("mapHint").textContent=t[point?"selected":"tap"];
  $("readout").textContent=point?point.map(n=>n.toFixed(4)).join(", "):"";
  $("pinActions").hidden = !point;
  $("sharePin").hidden = typeof navigator.share !== "function";
  $("manualLink").hidden = true;
  $("shareNotice").textContent = "";
}
function setStatus(key){statusKey=key;render();}
for(const code of ["en","es"]) $(code).onclick=event=>{
  if(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
  event.preventDefault();
  history.replaceState(null,"",$(code).href);
  window.gtag?.("set", "page_location", location.origin + location.pathname);
  document.querySelector('link[rel="canonical"]').href="https://porcostarica.com/"+code+"/";
  document.querySelector('meta[name="description"]').content=words[code].intro;
  lang=code;try {localStorage.setItem("porcr-language",code);} catch {}
  render();drawLabels();
};
function decode(ring) {
  const coords=[];let x=0,y=0;
  for(let i=0;i<ring.length;i+=2){x+=ring[i];y+=ring[i+1];coords.push([y/1e6,x/1e6]);}
  return coords;
}
// Ray crossing for containment, plus shortest distance to an edge in local metres.
function inspectRing(ring,lat,lon) {
  let inside=false, distance=Infinity;
  const east=111320*Math.cos(lat*Math.PI/180),north=110574;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const [ay,ax]=ring[j],[by,bx]=ring[i];
    if((ay>lat)!==(by>lat)&&lon<(bx-ax)*(lat-ay)/(by-ay)+ax)inside=!inside;
    const x=(ax-lon)*east,y=(ay-lat)*north,dx=(bx-ax)*east,dy=(by-ay)*north;
    const t=Math.max(0,Math.min(1,-(x*dx+y*dy)/(dx*dx+dy*dy||1)));
    distance=Math.min(distance,(x+t*dx)**2+(y+t*dy)**2);
  }
  return {inside,distance:Math.sqrt(distance)};
}
async function lookup(lat,lon,accuracy=0,zoom=true) {
  clearCoordinateParams();
  return lookupPoint(lat,lon,accuracy,zoom);
}
async function lookupPoint(lat,lon,accuracy=0,zoom=true) {
  const request=++ticket;point=[lat,lon];copied=false;result=null;
  for(const layer of [highlight,pin,accuracyCircle]) if(layer)map.removeLayer(layer);
  pin=L.marker(point,{keyboard:false,interactive:false,icon:L.divIcon({className:"",html:'<div class="pin"></div>',iconSize:[25,25],iconAnchor:[12,28]})}).addTo(map);
  if(accuracy>0) accuracyCircle=L.circle(point,{radius:accuracy,interactive:false,color:"#5472a7",fillOpacity:.08,weight:1}).addTo(map);
  setStatus("loading");
  try{
    const list=await json("index");
    const candidates=list.filter(d=>{const [w,s,e,n]=d[4];return lon>=w&&lon<=e&&lat>=s&&lat<=n;});
    const groups=await Promise.all(candidates.map(d=>json(d[0].slice(0,3))));
    if(request!==ticket)return;
    let near=false;
    for(const [i,d] of candidates.entries()){
      const polys=groups[i][d[0]].map(poly=>poly.map(decode));
      for(const poly of polys){
        const rings=poly.map(r=>inspectRing(r,lat,lon));
        if(rings.some(r=>r.distance<.2)){near=true;continue;}
        if(!rings[0].inside||rings.slice(1).some(r=>r.inside))continue;
        result=d;
        window.gtag?.("event","district_lookup",{interface_language:lang});
        highlight=L.polygon(polys,{color:"#25614e",fillColor:"#86b58c",weight:2,fillOpacity:.16,interactive:false}).addTo(map);
        if(zoom)map.setView(point,Math.max(13,map.getZoom()),{animate:false});
        const distance=Math.min(...rings.map(r=>r.distance));
        setStatus(distance<accuracy?"uncertain":distance<5?"border":"");return;
      }
    }
    if(zoom && !map.getBounds().contains(point))map.setView(point,7);
    setStatus(near?"border":"outside");
  }catch{if(request===ticket)setStatus("failed");}
}
$("locate").onclick=()=>{
  const request=++ticket;
  if(!navigator.geolocation){setStatus("unavailable");return;}
  setStatus("locating");
  navigator.geolocation.getCurrentPosition(p=>{if(request===ticket)lookup(p.coords.latitude,p.coords.longitude,p.coords.accuracy);},
    e=>{if(request===ticket)setStatus(e.code===1?"denied":"unavailable");},{enableHighAccuracy:true,timeout:15000,maximumAge:30000});
};
$("pointForm").onsubmit=e=>{
  e.preventDefault();const match=$("point").value.trim().match(/^([+-]?\d+(?:\.\d+)?)\s*[,;\s]\s*([+-]?\d+(?:\.\d+)?)$/);
  if(!match||Math.abs(+match[1])>90||Math.abs(+match[2])>180){setStatus("invalid");return;}
  lookup(+match[1],+match[2]);
};
const coordinateKeys = ["lat", "lng", "lon"];

function pinnedUrl() {
  const url = new URL("/" + lang + "/", "https://porcostarica.com");
  url.searchParams.set("lat", point[0].toFixed(10));
  url.searchParams.set("lng", point[1].toFixed(10));
  return url.href;
}

function offerManualCopy(url) {
  const field = $("manualLink");
  field.value = url;
  field.hidden = false;
  field.focus();
  field.select();
  $("shareNotice").textContent = words[lang].manualCopy;
}

$("copyLink").onclick = async () => {
  const url = pinnedUrl();
  try {
    await navigator.clipboard.writeText(url);
    if (point && pinnedUrl() === url) $("shareNotice").textContent = words[lang].linkCopied;
  } catch {
    if (point && pinnedUrl() === url) offerManualCopy(url);
  }
};

$("sharePin").onclick = async () => {
  const url = pinnedUrl();
  try {
    await navigator.share({title: "Por Costa Rica", url});
  } catch (error) {
    if (error.name !== "AbortError" && point && pinnedUrl() === url) offerManualCopy(url);
  }
};

function updateLanguageLinks() {
  for (const language of ["es", "en"]) {
    const link = new URL($(language).href);
    link.search = location.search;
    $(language).href = link.href;
  }
}

function clearCoordinateParams() {
  const url = new URL(location.href);
  if (!coordinateKeys.some(key => url.searchParams.has(key))) return;
  for (const key of coordinateKeys) url.searchParams.delete(key);
  history.replaceState(null, "", url);
  updateLanguageLinks();
}

function lookupFromUrl() {
  const params = new URLSearchParams(location.search);
  if (!coordinateKeys.some(key => params.has(key))) return;
  const latitudes = params.getAll("lat");
  const longitudes = [...params.getAll("lng"), ...params.getAll("lon")];
  const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
  const lat = Number(latitudes[0]), lon = Number(longitudes[0]);
  if (latitudes.length !== 1 || longitudes.length !== 1 ||
      !decimal.test(latitudes[0].trim()) || !decimal.test(longitudes[0].trim()) ||
      Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    $("coords").open = true;
    setStatus("invalid");
    return;
  }
  $("point").value = lat + ", " + lon;
  lookupPoint(lat, lon);
}
$("copy").onclick=async()=>{try{await navigator.clipboard.writeText($("code").textContent);copied=true;render();}catch{setStatus("copyFailed");}};
map.on("click",e=>lookup(e.latlng.lat,e.latlng.lng));
const centerLookup=()=>{const p=map.getCenter();lookup(p.lat,p.lng);};
$("map").onkeydown=e=>{if(e.target!==$("map"))return;if(e.key.startsWith("Arrow"))$("center").hidden=false;if(e.key==="Enter"){e.preventDefault();centerLookup();}};
$("center").onclick=centerLookup;$("plus").onclick=()=>map.zoomIn();$("minus").onclick=()=>map.zoomOut();
$("reset").onclick=()=>{++ticket;result=null;point=null;clearCoordinateParams();for(const layer of [highlight,pin,accuracyCircle])if(layer)map.removeLayer(layer);national();setStatus("");};
$("sources").onclick=()=>$("info").showModal();$("close").onclick=()=>$("info").close();
drawLabels();render();
updateLanguageLinks();
lookupFromUrl();
