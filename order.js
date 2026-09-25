/* ================= WhatsApp ordering =================
   Loaded before script.js; uses priceByKey/renderMenu from it at call time. */
const WHATSAPP_NUMBER="918677044213";          // +91 86770 44213
// Restaurant pin from Google Maps: https://maps.app.goo.gl/YDz5tdWJiaBkEeT88
const RESTAURANT={lat:25.472739,lng:85.706135};
const DELIVERY_RADIUS_KM=3;
const MIN_DELIVERY_SUBTOTAL=300;                 // delivery only when subtotal is MORE THAN ₹300

const cart={};                                   // item name -> qty
let customerLoc=null;                            // {lat,lng,km,source}

function qtyControl(name){
  const q=cart[name]||0, n=name.replace(/'/g,"\\'");
  return q
    ?`<div class="qty"><button type="button" onclick="changeQty('${n}',-1)" aria-label="Remove one">−</button><span>${q}</span><button type="button" onclick="changeQty('${n}',1)" aria-label="Add one">+</button></div>`
    :`<button type="button" class="add-btn" onclick="changeQty('${n}',1)">ADD<sup>+</sup></button>`;
}
window.changeQty=(name,d)=>{
  cart[name]=Math.max(0,(cart[name]||0)+d);
  if(!cart[name])delete cart[name];
  renderMenu();renderCart();
};

const priceOf=key=>priceByKey[key];
const subtotal=()=>Object.entries(cart).reduce((s,[n,q])=>s+priceOf(n)*q,0);
const itemCount=()=>Object.values(cart).reduce((a,b)=>a+b,0);

// Haversine great-circle distance in km
function haversineKm(a,b){
  const R=6371,rad=d=>d*Math.PI/180;
  const dLat=rad(b.lat-a.lat),dLng=rad(b.lng-a.lng);
  const h=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}

const $=id=>document.getElementById(id);
const orderPanel=$("orderPanel"), addressEl=$("custAddress"), verifyBtn=$("verifyLocBtn"), locStatus=$("locStatus");
const orderType=()=>document.querySelector('input[name="orderType"]:checked').value;

function renderCart(){
  const count=itemCount(), sub=subtotal();
  $("cartFab").classList.toggle("hidden",!count);
  $("cartFabCount").textContent=count;$("cartFabWord").textContent=count===1?"item":"items";$("cartFabTotal").textContent=sub;
  $("subtotal").textContent=sub;
  $("cartItems").innerHTML=count
    ?Object.entries(cart).map(([n,q])=>`<div class="cart-line"><span>${n}</span>${qtyControl(n)}<b>₹${priceOf(n)*q}</b></div>`).join("")
    :`<p class="order-note">Your cart is empty. Add items from the menu.</p>`;
  if(!count)orderPanel.classList.add("hidden");
  validateOrder();
}

// Returns why the order can't be sent yet, or "" when it can
function orderProblem(){
  if(!itemCount())return "Add at least one item.";
  if(!$("custName").value.trim()||!$("custPhone").value.trim())return "Enter your name and phone number.";
  if(orderType()==="pickup")return "";           // pickup: no minimum, no distance limit
  const sub=subtotal();
  if(!(sub>MIN_DELIVERY_SUBTOTAL))return `Delivery needs a subtotal of more than ₹${MIN_DELIVERY_SUBTOTAL} (add ₹${MIN_DELIVERY_SUBTOTAL+1-sub} more), or choose Pickup.`;
  if(!addressEl.value.trim())return "Enter your delivery address.";
  if(!customerLoc)return "Tap “Verify Delivery Location” to confirm you are within delivery range.";
  if(customerLoc.km>DELIVERY_RADIUS_KM)return `You are ${customerLoc.km.toFixed(1)} km away — we deliver within ${DELIVERY_RADIUS_KM} km. Please choose Pickup.`;
  return "";
}
function validateOrder(){
  const isDelivery=orderType()==="delivery";
  $("deliveryFields").classList.toggle("hidden",!isDelivery);
  verifyBtn.disabled=!addressEl.value.trim();
  const problem=orderProblem();
  $("ruleMsg").textContent=problem;
  $("waOrderBtn").disabled=!!problem;
  $("waOrderBtn").textContent=isDelivery?"🛵 Order Delivery on WhatsApp":"🏪 Order Pickup on WhatsApp";
}

function setLocation(lat,lng,source){
  const km=haversineKm(RESTAURANT,{lat,lng});
  customerLoc={lat,lng,km,source};
  const ok=km<=DELIVERY_RADIUS_KM;
  locStatus.className="order-note "+(ok?"ok":"bad");
  locStatus.textContent=ok
    ?`✅ Delivery available — you are ${km.toFixed(2)} km from the restaurant.`
    :`❌ Outside delivery area — you are ${km.toFixed(2)} km away (limit ${DELIVERY_RADIUS_KM} km). Pickup is still available.`;
  validateOrder();
}

// Fallback when GPS is blocked/unavailable: geocode the typed address (OpenStreetMap, no API key)
async function geocodeAddress(){
  locStatus.className="order-note";locStatus.textContent="Finding your address on the map…";
  try{
    const q=encodeURIComponent(addressEl.value.trim()+", Barh, Bihar, India");
    const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${q}`);
    const [hit]=await r.json();
    if(!hit)throw new Error("not found");
    setLocation(+hit.lat,+hit.lon,"address");
  }catch{
    locStatus.className="order-note bad";
    locStatus.textContent="Could not verify your location. Please allow location access and try again, or choose Pickup.";
  }
}

verifyBtn.onclick=()=>{
  customerLoc=null;validateOrder();
  if(!navigator.geolocation)return geocodeAddress();
  locStatus.className="order-note";locStatus.textContent="Getting your location…";
  navigator.geolocation.getCurrentPosition(
    p=>setLocation(p.coords.latitude,p.coords.longitude,"gps"),
    ()=>geocodeAddress(),
    {enableHighAccuracy:true,timeout:15000,maximumAge:0}
  );
};

// Editing the address invalidates a previous verification
addressEl.addEventListener("input",()=>{if(customerLoc){customerLoc=null;locStatus.textContent=""}validateOrder()});
["custName","custPhone"].forEach(id=>$(id).addEventListener("input",validateOrder));
document.querySelectorAll('input[name="orderType"]').forEach(r=>r.addEventListener("change",validateOrder));

$("cartFab").onclick=()=>{orderPanel.classList.remove("hidden");validateOrder()};
$("closeOrder").onclick=()=>orderPanel.classList.add("hidden");
orderPanel.onclick=e=>{if(e.target===orderPanel)orderPanel.classList.add("hidden")};

$("orderForm").onsubmit=e=>{
  e.preventDefault();
  if(orderProblem())return validateOrder();
  const isDelivery=orderType()==="delivery";
  const lines=[
    `*New ${isDelivery?"DELIVERY":"PICKUP"} Order — Chatkara Family Restaurant*`,"",
    ...Object.entries(cart).map(([n,q])=>`• ${n} × ${q} = ₹${priceOf(n)*q}`),
    "",`*Subtotal: ₹${subtotal()}*`,"",
    `Name: ${$("custName").value.trim()}`,
    `Phone: ${$("custPhone").value.trim()}`
  ];
  if(isDelivery){
    lines.push(`Address: ${addressEl.value.trim()}`,
      `Distance: ${customerLoc.km.toFixed(2)} km (${customerLoc.source==="gps"?"GPS verified":"address verified"})`,
      `Location: https://maps.google.com/?q=${customerLoc.lat.toFixed(6)},${customerLoc.lng.toFixed(6)}`);
  }
  const note=$("custNote").value.trim();
  if(note)lines.push(`Note: ${note}`);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`,"_blank");
};

renderCart();
