/* Customer dashboard: my orders, profile, change password */
(async()=>{
  // Password-reset link from email lands here (#reset): Supabase signs the user in from the link
  const fromReset=location.hash.includes("reset")||location.hash.includes("type=recovery");
  if(fromReset)await new Promise(r=>setTimeout(r,400));   // let supabase-js read the link token
  const acc=await requireAccount("customer");
  const openTab=initTabs();
  bindProfile(acc);bindPassword();
  if(fromReset){openTab("password");$("resetNote").textContent="Set a new password for your account.";}

  const {data:orders,error}=await sb.from("orders")
    .select("order_code,created_at,order_type,items,subtotal,status,address")
    .eq("user_id",acc.user.id).order("created_at",{ascending:false});
  const box=$("myOrders");
  if(error){box.innerHTML=`<p class="empty">Could not load orders: ${esc(error.message)}</p>`;return}

  $("stCount").textContent=orders.length;
  $("stPending").textContent=orders.filter(o=>o.status==="new").length;
  $("stDone").textContent=orders.filter(o=>o.status==="completed").length;
  $("stSpent").textContent=rupees(orders.filter(o=>o.status==="confirmed"||o.status==="completed").reduce((s,o)=>s+o.subtotal,0));

  box.innerHTML=orders.length?orders.map(o=>`
    <article class="order">
      <div class="order-top">
        <div><span class="order-code">${esc(o.order_code)}</span> <span class="pill type">${o.order_type==="delivery"?"🛵 Delivery":"🏪 Pickup"}</span></div>
        ${statusPill(o.status)}
      </div>
      <div class="order-meta">${fmtDate(o.created_at)}${o.address?" · "+esc(o.address):""}</div>
      <div class="order-items">${(o.items||[]).map(i=>`<div><span>${esc(i.name)} × ${Number(i.qty)}</span><span>${rupees(i.total)}</span></div>`).join("")}</div>
      <div class="order-foot"><span class="dim">${o.status==="new"?"Waiting for the restaurant to confirm on WhatsApp":o.status==="confirmed"?"Confirmed, being prepared":o.status==="completed"?"Completed, enjoy your meal!":"Not accepted, please call us"}</span><span class="order-total">${rupees(o.subtotal)}</span></div>
    </article>`).join("")
    :`<div class="empty">No orders yet.<br><br><a class="btn btn-primary" href="index.html#menu">🍽️ Browse the menu</a></div>`;
})();
