/* Shared by account.html (customer) and admin.html (admin) */
const $=id=>document.getElementById(id);
const fmtDate=d=>new Date(d).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit",hour12:true});
const STATUS=["new","confirmed","completed","rejected"];
const statusPill=s=>`<span class="pill ${esc(s)}">${esc(s)}</span>`;

function toast(text){
  const t=document.createElement("div");t.className="toast";t.textContent=text;
  document.body.appendChild(t);setTimeout(()=>t.remove(),2800);
}

// Redirects to login when logged out, and to the right dashboard when the role doesn't match
async function requireAccount(role){
  if(!sb){document.body.innerHTML='<p class="loading">Could not connect. Please reload.</p>';throw new Error("no supabase")}
  const acc=await getAccount();
  if(!acc){location.replace("login.html");throw new Error("logged out")}
  if(role==="admin"&&acc.profile.role!=="admin"){location.replace("account.html");throw new Error("not admin")}
  if(role==="customer"&&acc.profile.role==="admin"&&!location.hash.includes("reset")){location.replace("admin.html");throw new Error("is admin")}
  document.querySelectorAll(".js-user").forEach(el=>el.textContent=acc.profile.full_name||acc.user.email);
  document.querySelectorAll(".js-email").forEach(el=>el.textContent=acc.user.email);
  return acc;
}

// Sidebar tabs: <button data-tab="orders"> ↔ <section id="tab-orders">
function initTabs(onShow){
  const buttons=[...document.querySelectorAll(".side-nav [data-tab]")];
  const open=name=>{
    buttons.forEach(b=>b.classList.toggle("active",b.dataset.tab===name));
    document.querySelectorAll(".tab").forEach(s=>s.classList.toggle("hidden",s.id!=="tab-"+name));
    history.replaceState(null,"","#"+name);
    onShow?.(name);
  };
  buttons.forEach(b=>b.onclick=()=>open(b.dataset.tab));
  const start=location.hash.slice(1);
  open(buttons.some(b=>b.dataset.tab===start)?start:buttons[0].dataset.tab);
  return open;
}

document.querySelectorAll(".js-logout").forEach(b=>b.onclick=async()=>{await sb.auth.signOut();location.replace("login.html")});

// Profile tab
function bindProfile(acc){
  $("pfName").value=acc.profile.full_name||"";
  $("pfPhone").value=acc.profile.phone||"";
  $("pfEmail").value=acc.user.email;
  const addrBox=$("pfAddress");   // customer page only
  const addrNote=()=>{if($("pfAddrNote"))$("pfAddrNote").textContent=!acc.profile.address?"":acc.profile.address_lat!=null
    ?"✅ Location verified. Your next delivery order won't need verifying again."
    :"📍 This address will be verified on your next delivery order."};
  if(addrBox){addrBox.value=acc.profile.address||"";addrNote()}
  $("profileForm").onsubmit=async e=>{
    e.preventDefault();
    const upd={full_name:$("pfName").value.trim(),phone:$("pfPhone").value.trim()};
    if(addrBox){
      const address=addrBox.value.trim()||null;
      if(address!==(acc.profile.address||null))Object.assign(upd,{address,address_lat:null,address_lng:null,address_source:null});  // edited → verify again
    }
    const {error}=await sb.from("profiles").update(upd).eq("id",acc.user.id);
    const m=$("profileMsg");m.className="msg "+(error?"bad":"ok");m.textContent=error?error.message:"✅ Profile saved.";
    if(!error){Object.assign(acc.profile,upd);addrNote();document.querySelectorAll(".js-user").forEach(el=>el.textContent=upd.full_name||acc.user.email)}
  };
}

// Change password tab
function bindPassword(){
  $("passwordForm").onsubmit=async e=>{
    e.preventDefault();
    const p1=$("newPass").value, p2=$("newPass2").value, m=$("passMsg");
    m.className="msg bad";
    if(p1.length<8)return m.textContent="Password must be at least 8 characters.";
    if(p1!==p2)return m.textContent="The two passwords don't match.";
    const {error}=await sb.auth.updateUser({password:p1});
    m.className="msg "+(error?"bad":"ok");
    m.textContent=error?error.message:"✅ Password changed.";
    if(!error)e.target.reset();
  };
}
