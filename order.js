/* ================= WhatsApp ordering =================
   Loaded before script.js; uses priceByKey/renderMenu from it at call time. */
const WHATSAPP_NUMBER="918677044213";          // +91 86770 44213
// Restaurant pin from Google Maps: https://maps.app.goo.gl/YDz5tdWJiaBkEeT88
const RESTAURANT={lat:25.472739,lng:85.706135};
const DELIVERY_RADIUS_KM=3;
const MIN_DELIVERY_SUBTOTAL=300;                 // delivery only when subtotal is MORE THAN ₹300
// Owner push alerts via the free ntfy app (https://ntfy.sh). Subscribe to this topic in the app.
// The topic is visible in this public code, so anyone could read these alerts:
// never put customer phone numbers, addresses or locations in them (those go only in the WhatsApp message).
const NTFY_TOPIC="chatkara-orders-eaqyevbq5w8w36";

// Sends an instant phone alert to the owner. Never blocks or breaks the order if it fails.
function notifyOwner({title,lines,tags}){
  const message=lines.filter(l=>!/^(Phone|Address|Location|Distance):/.test(l)).join("\n").replace(/\*/g,"")
    +"\n\nFull details arrive in WhatsApp when the customer taps Send.";
  try{
    fetch("https://ntfy.sh/",{method:"POST",keepalive:true,
      body:JSON.stringify({topic:NTFY_TOPIC,title,message,tags,priority:5,
        actions:[{action:"view",label:"Open WhatsApp",url:"https://wa.me/"}]})
    }).catch(()=>{});
  }catch{}
}

// Every order request / enquiry is saved to Supabase (config.js). When the customer is
// logged in, the database links it to their account so it shows in their dashboard.
function saveToSupabase(table,row){
  try{
    if(sb)return sb.from(table).insert(row).then(({error})=>{if(error)console.warn("Supabase save failed",error.message)});
    return fetch(`${SUPABASE_URL}/rest/v1/${table}`,{method:"POST",keepalive:true,
      headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json",Prefer:"return=minimal"},
      body:JSON.stringify(row)
    }).catch(()=>{});
  }catch{}
}

// Ordering requires an account (the database also rejects orders from logged-out visitors).
let currentAccount=null, accountChecked=false;
async function prefillFromAccount(){
  currentAccount=await getAccount().catch(()=>null);
  accountChecked=true;
  if(currentAccount){
    const p=currentAccount.profile;
    const fill=(id,v)=>{const el=$(id);if(el&&v&&!el.value)el.value=v};
    fill("custName",p.full_name);fill("custPhone",p.phone);
    fill("enqName",p.full_name);fill("enqPhone",p.phone);
    // Saved delivery address (already verified on a previous order): no need to verify again
    if(p.address&&!addressEl.value.trim()){
      addressEl.value=p.address;
      if(p.address_lat!=null&&p.address_lng!=null){
        setLocation(p.address_lat,p.address_lng,p.address_source||"gps");
        locStatus.textContent="📍 Your saved address. "+locStatus.textContent;
      }
    }
  }
  validateOrder();
}

// After an order, remember the customer's details for next time (only what changed)
function saveCustomerDetails(isDelivery){
  if(!currentAccount||!sb)return;
  const p=currentAccount.profile, upd={};
  const name=$("custName").value.trim(), phone=$("custPhone").value.trim();
  if(name&&name!==p.full_name)upd.full_name=name;
  if(phone&&phone!==p.phone)upd.phone=phone;
  if(isDelivery&&customerLoc){
    const addr=addressEl.value.trim();
    if(addr!==p.address||customerLoc.lat!==p.address_lat||customerLoc.lng!==p.address_lng)
      Object.assign(upd,{address:addr,address_lat:customerLoc.lat,address_lng:customerLoc.lng,address_source:customerLoc.source});
  }
  if(!Object.keys(upd).length)return;
  sb.from("profiles").update(upd).eq("id",currentAccount.user.id)
    .then(({error})=>{if(error)console.warn("Could not save details",error.message);else Object.assign(p,upd)});
}

// Keep the cart while the customer logs in / signs up, then bring them back to finish the order
const DRAFT_KEY="chatkara-order-draft";
function saveOrderDraft(){
  try{localStorage.setItem(DRAFT_KEY,JSON.stringify({t:Date.now(),cart,type:orderType(),
    name:$("custName").value,phone:$("custPhone").value,address:addressEl.value,note:$("custNote").value,loc:customerLoc}))}catch{}
}
function restoreOrderDraft(){          // called from script.js once the menu prices are known
  let d=null;
  try{d=JSON.parse(localStorage.getItem(DRAFT_KEY)||"null");localStorage.removeItem(DRAFT_KEY)}catch{}
  if(!d||Date.now()-d.t>864e5)return;
  Object.entries(d.cart||{}).forEach(([k,q])=>{if(k in priceByKey&&q>0)cart[k]=q});
  const radio=document.querySelector(`input[name="orderType"][value="${d.type}"]`);if(radio)radio.checked=true;
  const set=(id,v)=>{if(v&&!$(id).value)$(id).value=v};
  set("custName",d.name);set("custPhone",d.phone);set("custNote",d.note);
  if(d.address){addressEl.value=d.address;if(d.loc)setLocation(d.loc.lat,d.loc.lng,d.loc.source)}
  renderMenu();renderCart();
  if(itemCount()&&location.hash==="#order")orderPanel.classList.remove("hidden");
}

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
  $("cartFabCount").textContent=count;$("navCartCount").textContent=count>99?"99+":count;$("navCartCount").classList.toggle("hidden",!count);$("navCart").setAttribute("aria-label",`Open cart, ${count} ${count===1?"item":"items"}`);$("cartFabWord").textContent=count===1?"item":"items";$("cartFabTotal").textContent=sub;
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
  if(!currentAccount){
    $("ruleMsg").textContent=accountChecked?"🔐 Please login or sign up to place your order. Your cart will be saved.":"";
    $("waOrderBtn").disabled=!accountChecked||!itemCount();
    $("waOrderBtn").textContent="🔐 Login / Sign up to Order";
    return;
  }
  const problem=orderProblem();
  $("ruleMsg").textContent=problem;
  $("waOrderBtn").disabled=!!problem;
  $("waOrderBtn").textContent=isDelivery?"🛵 Send Delivery Order Request":"🏪 Send Pickup Order Request";
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

const openCart=()=>{orderPanel.classList.remove("hidden");validateOrder()};
$("cartFab").onclick=openCart;
$("navCart").onclick=openCart;
$("closeOrder").onclick=()=>orderPanel.classList.add("hidden");
orderPanel.onclick=e=>{if(e.target===orderPanel)orderPanel.classList.add("hidden")};

$("orderForm").onsubmit=e=>{
  e.preventDefault();
  if(!currentAccount){if(accountChecked&&itemCount()){saveOrderDraft();location.href="login.html?next=order"}return}
  if(orderProblem())return validateOrder();
  const isDelivery=orderType()==="delivery";
  // Order ID appears in both the WhatsApp message and the owner's alert, so the
  // restaurant can tell a genuine website order from a direct WhatsApp message.
  const now=new Date(), abc="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const orderId=`CK-${String(now.getDate()).padStart(2,"0")}${String(now.getMonth()+1).padStart(2,"0")}-${Array.from(crypto.getRandomValues(new Uint8Array(4)),b=>abc[b%abc.length]).join("")}`;
  const lines=[
    `*${isDelivery?"DELIVERY":"PICKUP"} ORDER REQUEST — Chatkara Family Restaurant*`,
    `Order ID: ${orderId} (placed on website)`,"",
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
  lines.push("","Please confirm my order.");
  saveToSupabase("orders",{
    order_code:orderId,
    order_type:isDelivery?"delivery":"pickup",
    items:Object.entries(cart).map(([n,q])=>({name:n,qty:q,price:priceOf(n),total:priceOf(n)*q})),
    subtotal:subtotal(),
    customer_name:$("custName").value.trim(),
    customer_phone:$("custPhone").value.trim(),
    address:isDelivery?addressEl.value.trim():null,
    distance_km:isDelivery?+customerLoc.km.toFixed(2):null,
    location_lat:isDelivery?customerLoc.lat:null,
    location_lng:isDelivery?customerLoc.lng:null,
    location_source:isDelivery?customerLoc.source:null,
    note:note||null
  });
  saveCustomerDetails(isDelivery);
  notifyOwner({
    title:`New ${isDelivery?"delivery":"pickup"} order ${orderId}: ₹${subtotal()}`,
    lines:lines.slice(3,-2),
    tags:[isDelivery?"motor_scooter":"shopping_bags","bell"]
  });
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`,"_blank");
  const sent=$("orderSentMsg");
  sent.innerHTML=`✅ Order request ${orderId} is ready in WhatsApp. Tap Send there. Our team will review it and confirm your order. <a href="account.html">Track it in My Account →</a>`;
  sent.classList.remove("hidden");
};

renderCart();
