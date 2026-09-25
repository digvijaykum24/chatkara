/* Admin dashboard: orders, products, customers, revenue, enquiries, profile, password.
   Everything here is also enforced by the database: only admins can read or change this data. */
let orders=[], products=[], customers=[], enquiries=[];
let orderFilter="new", seenNew=new Set();
const dayKey=d=>new Date(d).toLocaleDateString("en-CA");            // YYYY-MM-DD in local time
const earning=o=>o.status==="confirmed"||o.status==="completed";
const phoneDigits=p=>String(p||"").replace(/\D/g,"").slice(-10);

(async()=>{
  const acc=await requireAccount("admin");
  bindProfile(acc);bindPassword();
  initTabs(name=>{if(name==="revenue")renderRevenue();if(name==="customers")renderCustomers()});
  await Promise.all([loadOrders(),loadProducts(),loadCustomers(),loadEnquiries()]);
  listenForOrders();
})();

/* ================= Orders ================= */
async function loadOrders(){
  const {data,error}=await sb.from("orders").select("*").order("created_at",{ascending:false}).limit(1000);
  if(error){$("orderList").innerHTML=`<p class="empty">${esc(error.message)}</p>`;return}
  orders=data;renderOrders();
}
$("refreshOrders").onclick=()=>loadOrders().then(()=>toast("Orders refreshed"));

function renderOrderFilters(){
  const count=s=>s==="all"?orders.length:orders.filter(o=>o.status===s).length;
  $("orderFilters").innerHTML=["new","confirmed","completed","rejected","all"].map(s=>
    `<button class="chip ${s===orderFilter?"active":""}" data-f="${s}">${s[0].toUpperCase()+s.slice(1)} (${count(s)})</button>`).join("");
  $("orderFilters").querySelectorAll(".chip").forEach(b=>b.onclick=()=>{orderFilter=b.dataset.f;renderOrders()});
}

function renderOrders(){
  const today=dayKey(new Date());
  const newCount=orders.filter(o=>o.status==="new").length;
  $("oNew").textContent=newCount;
  $("oToday").textContent=orders.filter(o=>dayKey(o.created_at)===today).length;
  $("oTodayRev").textContent=rupees(orders.filter(o=>earning(o)&&dayKey(o.created_at)===today).reduce((s,o)=>s+o.subtotal,0));
  $("oAll").textContent=orders.length;
  $("newBadge").textContent=newCount;$("newBadge").classList.toggle("hidden",!newCount);
  document.title=(newCount?`(${newCount}) `:"")+"Admin | Chatkara";
  renderOrderFilters();

  const q=$("orderSearch").value.trim().toLowerCase();
  const list=orders.filter(o=>(orderFilter==="all"||o.status===orderFilter)&&
    (!q||[o.order_code,o.customer_name,o.customer_phone].some(v=>String(v||"").toLowerCase().includes(q))));
  $("orderList").innerHTML=list.length?list.map(orderCard).join(""):`<p class="empty">No ${orderFilter==="all"?"":orderFilter+" "}orders${q?" match your search":""}.</p>`;
  $("orderList").querySelectorAll(".status-select").forEach(sel=>sel.onchange=()=>updateOrderStatus(sel.dataset.id,sel.value));
}
$("orderSearch").oninput=renderOrders;

function orderCard(o){
  const digits=phoneDigits(o.customer_phone);
  const waMsg=encodeURIComponent(`Hello ${o.customer_name}, your Chatkara order ${o.order_code} (${rupees(o.subtotal)}) is confirmed! 🍽️`);
  return `<article class="order ${o.status==="new"?"is-new":""}">
    <div class="order-top">
      <div><span class="order-code">${esc(o.order_code)}</span> <span class="pill type">${o.order_type==="delivery"?"🛵 Delivery":"🏪 Pickup"}</span> ${o.user_id?'<span class="pill confirmed">Account</span>':'<span class="pill rejected">Guest</span>'}</div>
      ${statusPill(o.status)}
    </div>
    <div class="order-meta">${fmtDate(o.created_at)}</div>
    <div class="order-cust">
      <div><b>${esc(o.customer_name)}</b> · ${esc(o.customer_phone)}</div>
      ${o.order_type==="delivery"?`<div>📍 ${esc(o.address)} <span class="dim">(${Number(o.distance_km).toFixed(2)} km, ${o.location_source==="gps"?"GPS":"address"})</span></div>`:""}
      ${o.note?`<div>📝 ${esc(o.note)}</div>`:""}
    </div>
    <div class="order-items">${(o.items||[]).map(i=>`<div><span>${esc(i.name)} × ${Number(i.qty)}</span><span>${rupees(i.total)}</span></div>`).join("")}</div>
    <div class="order-foot">
      <div class="order-actions">
        <select class="status-select" data-id="${o.id}" aria-label="Order status">${STATUS.map(s=>`<option value="${s}" ${s===o.status?"selected":""}>${s[0].toUpperCase()+s.slice(1)}</option>`).join("")}</select>
        ${digits.length===10?`<a class="btn btn-ghost btn-sm" href="https://wa.me/91${digits}?text=${waMsg}" target="_blank" rel="noopener">💬 WhatsApp</a><a class="btn btn-ghost btn-sm" href="tel:+91${digits}">📞 Call</a>`:""}
        ${o.location_lat?`<a class="btn btn-ghost btn-sm" href="https://maps.google.com/?q=${Number(o.location_lat)},${Number(o.location_lng)}" target="_blank" rel="noopener">🗺️ Map</a>`:""}
      </div>
      <span class="order-total">${rupees(o.subtotal)}</span>
    </div>
  </article>`;
}

async function updateOrderStatus(id,status){
  const {error}=await sb.from("orders").update({status,updated_at:new Date().toISOString()}).eq("id",id);
  if(error)return toast("Could not update: "+error.message);
  const o=orders.find(x=>String(x.id)===String(id));if(o)o.status=status;
  toast(`Order marked ${status}`);renderOrders();
}

// New orders arrive live (Supabase Realtime, admins only by database policy)
function listenForOrders(){
  sb.channel("admin-orders")
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"orders"},({new:o})=>{
      if(orders.some(x=>x.id===o.id))return;
      orders.unshift(o);renderOrders();
      toast(`🔔 New ${o.order_type} order ${o.order_code}: ${rupees(o.subtotal)}`);
      beep();
    })
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"enquiries"},({new:q})=>{
      if(enquiries.some(x=>x.id===q.id))return;
      enquiries.unshift(q);renderEnquiries();
      toast(`📅 New ${q.enquiry_type} from ${q.name}`);
      beep();
    }).subscribe();
}
function beep(){
  try{const c=new AudioContext(),g=c.createGain(),o=c.createOscillator();o.frequency.value=880;g.gain.value=.12;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.25)}catch{}
}

/* ================= Products ================= */
async function loadProducts(){
  const {data,error}=await sb.from("products").select("*").order("sort_order");
  if(error){$("productRows").innerHTML=`<tr><td colspan="7">${esc(error.message)}</td></tr>`;return}
  products=data;
  const cats=[...new Set(products.map(p=>p.category))];
  $("productCat").innerHTML=`<option value="">All categories</option>`+cats.map(c=>`<option>${esc(c)}</option>`).join("");
  $("catList").innerHTML=cats.map(c=>`<option value="${esc(c)}">`).join("");
  renderProducts();
}
function renderProducts(){
  const q=$("productSearch").value.trim().toLowerCase(), cat=$("productCat").value;
  const list=products.filter(p=>(!cat||p.category===cat)&&(!q||p.name.toLowerCase().includes(q)));
  $("productRows").innerHTML=list.length?list.map(p=>`<tr class="${p.is_available?"":"tag-off"}">
    <td><span class="diet ${p.is_veg?"veg":"nonveg"}"></span>${esc(p.name)}</td>
    <td>${esc(p.category)}</td>
    <td class="num">${rupees(p.price_full)}</td>
    <td class="num">${p.price_half?rupees(p.price_half):"–"}</td>
    <td>${p.is_special?`<span class="pill type">★ ${esc(p.special_tag||"Special")}</span>`:""}</td>
    <td><label class="switch" title="Show on website"><input type="checkbox" data-avail="${p.id}" ${p.is_available?"checked":""}><span></span></label></td>
    <td class="num"><button class="btn btn-ghost btn-sm" data-edit="${p.id}">Edit</button> <button class="btn btn-danger btn-sm" data-del="${p.id}">Delete</button></td>
  </tr>`).join(""):`<tr><td colspan="7" class="loading">No dishes found.</td></tr>`;
  $("productRows").querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>openProduct(products.find(p=>p.id==b.dataset.edit)));
  $("productRows").querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>deleteProduct(products.find(p=>p.id==b.dataset.del)));
  $("productRows").querySelectorAll("[data-avail]").forEach(c=>c.onchange=()=>saveProduct(+c.dataset.avail,{is_available:c.checked},c.checked?"Dish is now on the menu":"Dish hidden from the menu"));
}
$("productSearch").oninput=renderProducts;$("productCat").onchange=renderProducts;

async function saveProduct(id,changes,msg){
  const {error}=await sb.from("products").update({...changes,updated_at:new Date().toISOString()}).eq("id",id);
  if(error){toast("Could not save: "+error.message);return false}
  Object.assign(products.find(p=>p.id===id),changes);renderProducts();toast(msg||"Saved");return true;
}
async function deleteProduct(p){
  if(!confirm(`Delete “${p.name}” from the menu?\n\nTip: switch “Available” off instead to hide it temporarily.`))return;
  const {error}=await sb.from("products").delete().eq("id",p.id);
  if(error)return toast("Could not delete: "+error.message);
  products=products.filter(x=>x.id!==p.id);renderProducts();toast("Dish deleted");
}

let editing=null;
function openProduct(p){
  editing=p||null;
  $("pmTitle").textContent=p?"Edit dish":"Add dish";
  $("pmName").value=p?.name||"";$("pmCat").value=p?.category||"";
  $("pmFull").value=p?.price_full||"";$("pmHalf").value=p?.price_half||"";
  $("pmVeg").checked=p?p.is_veg:true;$("pmAvail").checked=p?p.is_available:true;$("pmSpecial").checked=!!p?.is_special;
  $("pmTag").value=p?.special_tag||"";$("pmDesc").value=p?.description||"";
  $("pmSort").value=p?.sort_order??(Math.max(0,...products.map(x=>x.sort_order))+1);
  $("pmSpecialFields").classList.toggle("hidden",!$("pmSpecial").checked);
  $("pmMsg").textContent="";
  $("productModal").classList.remove("hidden");$("pmName").focus();
}
$("addProduct").onclick=()=>openProduct(null);
$("pmSpecial").onchange=()=>$("pmSpecialFields").classList.toggle("hidden",!$("pmSpecial").checked);
$("pmCancel").onclick=()=>$("productModal").classList.add("hidden");
$("productModal").onclick=e=>{if(e.target.id==="productModal")$("productModal").classList.add("hidden")};

$("productForm").onsubmit=async e=>{
  e.preventDefault();
  const full=parseInt($("pmFull").value,10), half=$("pmHalf").value?parseInt($("pmHalf").value,10):null;
  const row={name:$("pmName").value.trim(),category:$("pmCat").value.trim(),price_full:full,price_half:half,
    is_veg:$("pmVeg").checked,is_available:$("pmAvail").checked,is_special:$("pmSpecial").checked,
    special_tag:$("pmSpecial").checked?($("pmTag").value.trim()||null):null,
    description:$("pmSpecial").checked?($("pmDesc").value.trim()||null):null,
    sort_order:parseInt($("pmSort").value,10)||0};
  const m=$("pmMsg");m.className="msg bad";
  if(!row.name||!row.category)return m.textContent="Enter a dish name and category.";
  if(!(full>0))return m.textContent="Enter the full price.";
  if(half!==null&&!(half>0))return m.textContent="Half price must be more than 0, or leave it empty.";
  const res=editing
    ?await sb.from("products").update({...row,updated_at:new Date().toISOString()}).eq("id",editing.id).select().single()
    :await sb.from("products").insert(row).select().single();
  if(res.error)return m.textContent=res.error.message.includes("duplicate")?"A dish with this name already exists.":res.error.message;
  $("productModal").classList.add("hidden");
  toast(editing?"Dish updated":"Dish added");
  await loadProducts();
};

/* ================= Customers ================= */
async function loadCustomers(){
  const {data,error}=await sb.from("profiles").select("*").eq("role","customer").order("created_at",{ascending:false});
  if(error){$("customerRows").innerHTML=`<tr><td colspan="7">${esc(error.message)}</td></tr>`;return}
  customers=data;renderCustomers();
}
function renderCustomers(){
  const q=$("customerSearch").value.trim().toLowerCase();
  const rows=customers.filter(c=>!q||[c.full_name,c.email,c.phone].some(v=>String(v||"").toLowerCase().includes(q))).map(c=>{
    const mine=orders.filter(o=>o.user_id===c.id);
    return {c,count:mine.length,spent:mine.filter(earning).reduce((s,o)=>s+o.subtotal,0)};
  });
  $("customerRows").innerHTML=rows.length?rows.map(({c,count,spent})=>{
    const d=phoneDigits(c.phone);
    return `<tr><td>${esc(c.full_name||"–")}</td><td>${esc(c.email)}</td><td>${esc(c.phone||"–")}</td><td>${new Date(c.created_at).toLocaleDateString("en-IN")}</td>
      <td class="num">${count}</td><td class="num">${rupees(spent)}</td>
      <td class="num">${d.length===10?`<a class="btn btn-ghost btn-sm" href="https://wa.me/91${d}" target="_blank" rel="noopener">💬</a>`:""}</td></tr>`;
  }).join(""):`<tr><td colspan="7" class="loading">No customers yet.</td></tr>`;
}
$("customerSearch").oninput=renderCustomers;

/* ================= Revenue ================= */
function renderRevenue(){
  const paid=orders.filter(earning), now=new Date(), today=dayKey(now);
  const sinceDays=n=>{const d=new Date(now);d.setDate(d.getDate()-(n-1));d.setHours(0,0,0,0);return paid.filter(o=>new Date(o.created_at)>=d)};
  const sum=list=>list.reduce((s,o)=>s+o.subtotal,0);
  $("rToday").textContent=rupees(sum(paid.filter(o=>dayKey(o.created_at)===today)));
  $("r7").textContent=rupees(sum(sinceDays(7)));
  $("r30").textContent=rupees(sum(sinceDays(30)));
  $("rAll").textContent=rupees(sum(paid));
  $("rAvg").textContent=paid.length?`avg ${rupees(Math.round(sum(paid)/paid.length))} / order`:"";

  const days=[...Array(14)].map((_,i)=>{const d=new Date(now);d.setDate(d.getDate()-(13-i));return d});
  const totals=days.map(d=>sum(paid.filter(o=>dayKey(o.created_at)===dayKey(d))));
  const max=Math.max(1,...totals);
  $("revBars").innerHTML=days.map((d,i)=>`<div class="bar" title="${d.toLocaleDateString("en-IN")}: ${rupees(totals[i])}"><i style="height:${Math.round(totals[i]/max*100)}%"></i><small>${d.getDate()}/${d.getMonth()+1}</small></div>`).join("");

  const dish={};paid.forEach(o=>(o.items||[]).forEach(i=>{dish[i.name]=dish[i.name]||{qty:0,total:0};dish[i.name].qty+=Number(i.qty);dish[i.name].total+=Number(i.total)}));
  const top=Object.entries(dish).sort((a,b)=>b[1].total-a[1].total).slice(0,8);
  $("topDishes").innerHTML=top.length?top.map(([n,v])=>`<div><span>${esc(n)} <span class="dim">× ${v.qty}</span></span><b>${rupees(v.total)}</b></div>`).join(""):`<p class="dim">No confirmed orders yet.</p>`;

  const split=t=>paid.filter(o=>o.order_type===t);
  $("typeSplit").innerHTML=["delivery","pickup"].map(t=>`<div><span>${t==="delivery"?"🛵 Delivery":"🏪 Pickup"} <span class="dim">(${split(t).length} orders)</span></span><b>${rupees(sum(split(t)))}</b></div>`).join("");
}

/* ================= Enquiries ================= */
async function loadEnquiries(){
  const {data,error}=await sb.from("enquiries").select("*").order("created_at",{ascending:false}).limit(500);
  if(error){$("enquiryList").innerHTML=`<p class="empty">${esc(error.message)}</p>`;return}
  enquiries=data;renderEnquiries();
}
function renderEnquiries(){
  const newCount=enquiries.filter(q=>q.status==="new").length;
  $("enqBadge").textContent=newCount;$("enqBadge").classList.toggle("hidden",!newCount);
  $("enquiryList").innerHTML=enquiries.length?enquiries.map(q=>{
    const d=phoneDigits(q.phone);
    return `<article class="order ${q.status==="new"?"is-new":""}">
      <div class="order-top"><div><span class="order-code">${esc(q.enquiry_type)}</span>${q.guests?` <span class="pill type">${Number(q.guests)} guests</span>`:""}</div>${statusPill(q.status)}</div>
      <div class="order-meta">Received ${fmtDate(q.created_at)}${q.visit_date?` · For ${new Date(q.visit_date+"T00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}${q.visit_time?" at "+esc(q.visit_time.slice(0,5)):""}`:""}</div>
      <div class="order-cust"><div><b>${esc(q.name)}</b> · ${esc(q.phone)}</div>${q.message?`<div>💬 ${esc(q.message)}</div>`:""}</div>
      <div class="order-foot" style="margin-top:.7rem"><div class="order-actions">
        <select class="status-select" data-enq="${q.id}" aria-label="Enquiry status">${STATUS.map(s=>`<option value="${s}" ${s===q.status?"selected":""}>${s[0].toUpperCase()+s.slice(1)}</option>`).join("")}</select>
        ${d.length===10?`<a class="btn btn-ghost btn-sm" href="https://wa.me/91${d}" target="_blank" rel="noopener">💬 WhatsApp</a><a class="btn btn-ghost btn-sm" href="tel:+91${d}">📞 Call</a>`:""}
      </div></div>
    </article>`;
  }).join(""):`<p class="empty">No enquiries yet.</p>`;
  $("enquiryList").querySelectorAll("[data-enq]").forEach(sel=>sel.onchange=async()=>{
    const {error}=await sb.from("enquiries").update({status:sel.value}).eq("id",sel.dataset.enq);
    if(error)return toast("Could not update: "+error.message);
    enquiries.find(q=>String(q.id)===sel.dataset.enq).status=sel.value;renderEnquiries();toast("Enquiry updated");
  });
}
