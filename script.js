// Menu: loaded from the Supabase "products" table (edited in the Admin Dashboard).
// Built-in copy of the menu card, used until the database answers or if it can't be reached.
// Each row: [category, name, fullPrice, halfPrice, veg(1/0), special(1/0), specialTag, description]
const FALLBACK_MENU=[["Chinese Veg","Paneer Chilli Dry",200,null,1,0,null,null],["Chinese Veg","Paneer Chilli Gravy",200,100,1,0,null,null],["Chinese Veg","Paneer Pakoda",150,null,1,0,null,null],["Chinese Veg","Paneer Paper",200,null,1,0,null,null],["Chinese Veg","Paneer 65",200,null,1,0,null,null],["Chinese Veg","Mushroom Chilli Dry",200,null,1,0,null,null],["Chinese Veg","Mushroom Chilli Gravy",200,null,1,0,null,null],["Chinese Veg","Mushroom Crepes",220,null,1,0,null,null],["Chinese Veg","Veg Manchurian",120,null,1,1,"Veg Favourite","Crispy veg balls tossed in a tangy Indo-Chinese sauce."],["Chinese Non-Veg","Chicken Chilli Dry",200,null,0,0,null,null],["Chinese Non-Veg","Chicken Chilli Gravy",180,90,0,0,null,null],["Chinese Non-Veg","Chicken 65",200,null,0,0,null,null],["Chinese Non-Veg","Chicken Paper",200,null,0,0,null,null],["Chinese Non-Veg","Chicken Lollipop",230,null,0,0,null,null],["Noodles","Veg Noodles",60,35,1,0,null,null],["Noodles","Egg D. Noodles",80,45,0,0,null,null],["Noodles","Mix Veg Noodles",110,null,1,0,null,null],["Noodles","Garlic Noodles",130,70,1,0,null,null],["Noodles","Veg Szechwan Noodles",120,null,1,0,null,null],["Noodles","Chicken Noodles",140,80,0,0,null,null],["Noodles","Mushroom Noodles",130,null,1,0,null,null],["Soup","Veg Hot & Sour Soup",80,null,1,0,null,null],["Soup","Garlic Soup",120,null,1,0,null,null],["Soup","Chicken Hot & Sour Soup",150,null,0,0,null,null],["Veg Indian","Paneer Kadai",230,110,1,0,null,null],["Veg Indian","Paneer Handi",230,null,1,0,null,null],["Veg Indian","Paneer Masala",180,100,1,0,null,null],["Veg Indian","Paneer Butter Masala",200,100,1,0,null,null],["Veg Indian","Paneer Kofta",250,null,1,0,null,null],["Veg Indian","Paneer Do Pyaza",230,120,1,0,null,null],["Veg Indian","Shahi Paneer",250,null,1,0,null,null],["Veg Indian","Mutter Paneer",200,null,1,0,null,null],["Veg Indian","Mushroom Paneer",230,null,1,0,null,null],["Veg Indian","Mushroom Masala",220,null,1,0,null,null],["Veg Indian","Mushroom Handi",250,null,1,0,null,null],["Veg Indian","Mushroom Kadai",230,null,1,0,null,null],["Veg Indian","Mushroom Butter Masala",230,null,1,0,null,null],["Veg Indian","Mushroom Do Pyaza",230,null,1,0,null,null],["Veg Indian","Mushroom Mutter",230,null,1,0,null,null],["Daal","Daal Fry",80,null,1,0,null,null],["Daal","Daal Tadka",150,null,1,0,null,null],["Daal","Daal Butter",150,null,1,0,null,null],["Daal","Daal Makhni",150,null,1,0,null,null],["Indian Non-Veg","Chicken Kadai",250,130,0,0,null,null],["Indian Non-Veg","Chicken Handi",260,150,0,0,null,null],["Indian Non-Veg","Chicken Butter Masala",270,140,0,0,null,null],["Indian Non-Veg","Chicken Egg Masala",260,150,0,0,null,null],["Indian Non-Veg","Chicken Curry",250,130,0,0,null,null],["Indian Non-Veg","Chicken Do Pyaza",260,140,0,0,null,null],["Indian Non-Veg","Chicken Hyderabadi",270,150,0,0,null,null],["Indian Non-Veg","Chicken Kassa",270,150,0,0,null,null],["Indian Non-Veg","Chicken Korma",260,140,0,0,null,null],["Indian Non-Veg","Omelette Curry",140,null,0,0,null,null],["Indian Non-Veg","Egg Curry",100,null,0,0,null,null],["Indian Non-Veg","Chicken Dehati",449,null,0,1,"Signature","Our desi-style house special, rich, spicy and full of flavour."],["Biryani & Rice","Chicken Dum Biryani",180,99,0,1,"Bestseller","Fragrant rice and tender chicken, slow-cooked on dum."],["Biryani & Rice","Egg Biryani",120,null,0,0,null,null],["Biryani & Rice","Veg Biryani",130,null,1,0,null,null],["Biryani & Rice","Plain Rice",70,null,1,0,null,null],["Biryani & Rice","Jeera Rice",100,null,1,0,null,null],["Biryani & Rice","Veg Pulao",150,null,1,0,null,null],["Biryani & Rice","Peas Pulao",150,null,1,0,null,null],["Bread","Tawa Roti (per pc)",8,null,1,0,null,null],["Bread","Tawa Butter Roti (per pc)",12,null,1,0,null,null],["Bread","Lachha Paratha (per pc)",25,null,1,0,null,null],["Bread","Plain Paratha (per pc)",20,null,1,0,null,null],["Rolls","Egg D. Roll",50,null,0,0,null,null],["Rolls","Egg D. Chicken Roll",100,null,0,0,null,null],["Rolls","Chicken Roll",80,null,0,0,null,null],["Rolls","Paneer Roll",70,null,1,0,null,null],["Rolls","Mushroom Roll",90,null,1,0,null,null],["Rolls","Veg Roll",30,null,1,0,null,null],["Rolls","Paneer Kathi Roll",100,null,1,0,null,null]];

// Cart keys are "Name" or "Name (Full)" / "Name (Half)".
const priceByKey={};
let imgByName={}, listGroups=[], specials=[], popular=[], bestsellers=[], cats=[], featuredInfo={}, vegByName={}, catByName={}, dishTotal=0;
function buildMenu(rows){
  Object.keys(priceByKey).forEach(k=>delete priceByKey[k]);
  featuredInfo={};vegByName={};catByName={};imgByName={};specials=[];popular=[];bestsellers=[];dishTotal=rows.length;
  const groups=new Map();
  rows.forEach(r=>{
    const item=[r.name,r.price_full,r.price_half||undefined];
    if(!groups.has(r.category))groups.set(r.category,[]);
    groups.get(r.category).push(item);
    if(r.is_special){specials.push(item);featuredInfo[r.name]={tag:r.special_tag||"Special",desc:r.description||""}}
    if(r.is_popular)popular.push(item);
    if(r.is_bestseller)bestsellers.push(item);
    vegByName[r.name]=r.is_veg;catByName[r.name]=r.category;if(r.image_url)imgByName[r.name]=r.image_url;
    if(r.price_half){priceByKey[`${r.name} (Full)`]=r.price_full;priceByKey[`${r.name} (Half)`]=r.price_half}else priceByKey[r.name]=r.price_full;
  });
  listGroups=[...groups].map(([cat,items])=>({cat,items}));
  cats=["All",...listGroups.map(g=>g.cat)];
}
// Home page picks used until the database answers (the admin chooses them in Admin > Products)
const FALLBACK_POPULAR=["Paneer Chilli Dry", "Chicken Chilli Gravy", "Chicken Lollipop", "Veg Noodles", "Paneer Butter Masala", "Chicken Kadai", "Paneer Roll", "Chicken 65"], FALLBACK_BESTSELLERS=["Chicken Butter Masala", "Chicken Roll", "Paneer Kadai", "Chicken Noodles", "Egg D. Roll"];
buildMenu(FALLBACK_MENU.map(([category,name,price_full,price_half,v,s,special_tag,description])=>({category,name,price_full,price_half,is_veg:!!v,is_special:!!s,special_tag,description,
  is_popular:FALLBACK_POPULAR.includes(name),is_bestseller:FALLBACK_BESTSELLERS.includes(name)})));
const isNonVeg=n=>n in vegByName?!vegByName[n]:/chicken|egg|omelette/i.test(n);
const catLabel=c=>c;
const categories=document.getElementById("categories"), grid=document.getElementById("menuGrid"), homePicks=document.getElementById("homePicks"), fullMenu=document.getElementById("fullMenu");
let current="All", search="", vegOnly=false;

function renderCats(){
  categories.innerHTML=cats.map(c=>`<button type="button" role="tab" aria-selected="${c===current}" class="cat-chip ${c===current?'active':''}" onclick="setCat(this.dataset.cat)" data-cat="${esc(c)}">${esc(catLabel(c))}</button>`).join("");
  // Centre the active chip in the horizontal bar (without scrolling the page)
  const a=categories.querySelector(".active");
  if(a)categories.scrollTo({left:a.offsetLeft-(categories.clientWidth-a.offsetWidth)/2,behavior:"smooth"});
}
const priceOpts=(n,full,half)=>half?[["Half",half,`${n} (Half)`],["Full",full,`${n} (Full)`]]:[["",full,n]];
const dishImg=(n,cls)=>imgByName[n]?`<img class="${cls}" src="${esc(imgByName[n])}" alt="${esc(n)}" loading="lazy" decoding="async">`:"";
const dietDot=n=>`<span class="diet ${isNonVeg(n)?'nonveg':'veg'}" title="${isNonVeg(n)?'Non-veg':'Veg'}"></span>`;
function dishRow([n,full,half]){
  return `<div class="dish${half?" multi":""}"><div class="dish-main">${dishImg(n,"dish-thumb")}${dietDot(n)}<span class="dish-name">${esc(n)}</span><span class="leader" aria-hidden="true"></span></div><div class="dish-prices">${priceOpts(n,full,half).map(([label,p,key])=>`<div class="dish-opt">${label?`<span class="portion">${label}</span>`:""}<span class="amt">₹${p}</span>${qtyControl(key)}</div>`).join("")}</div></div>`;
}
function featuredCard([n,full,half]){
  const info=featuredInfo[n]||{tag:"Special",desc:""};
  return `<article class="feature-card${imgByName[n]?" has-img":""}">${dishImg(n,"feature-img")}<div class="feature-top"><span class="feature-tag">${esc(info.tag)}</span>${dietDot(n)}</div><h3>${esc(n)}</h3><p>${esc(info.desc)}</p><div class="feature-prices">${priceOpts(n,full,half).map(([label,p,key])=>`<div class="dish-opt">${label?`<span class="portion">${label}</span>`:""}<span class="amt">₹${p}</span>${qtyControl(key)}</div>`).join("")}</div></article>`;
}
const matches=n=>(!vegOnly||!isNonVeg(n))&&(!search||n.toLowerCase().includes(search));
const optsHtml=(n,full,half)=>priceOpts(n,full,half).map(([label,p,key])=>`<div class="dish-opt">${label?`<span class="portion">${label}</span>`:""}<span class="amt">₹${p}</span>${qtyControl(key)}</div>`).join("");
function pickCard([n,full,half],badge){
  return `<article class="pick-card${imgByName[n]?" has-img":""}">${badge?`<span class="pick-badge">${badge}</span>`:""}${dishImg(n,"pick-img")}
    <div class="pick-top">${dietDot(n)}<span class="pick-cat">${esc(catByName[n]||"")}</span></div>
    <h4>${esc(n)}</h4>
    <div class="pick-prices">${optsHtml(n,full,half)}</div></article>`;
}
function pickBlock(id,icon,title,sub,body){
  return `<section class="pick-block" id="${id}"><header class="pick-head"><span class="pick-icon" aria-hidden="true">${icon}</span><div><h3>${title}</h3><p>${sub}</p></div></header>${body}</section>`;
}
// Home page: only selected dishes
function renderPicks(){
  let html="";
  if(popular.length)html+=pickBlock("popular","🔥","Popular Items","What Barh loves to order",`<div class="pick-row">${popular.map(i=>pickCard(i)).join("")}</div>`);
  if(bestsellers.length)html+=pickBlock("bestsellers","🏆","Best Sellers","Our most-ordered dishes",`<div class="pick-row">${bestsellers.map(i=>pickCard(i,"Bestseller")).join("")}</div>`);
  if(specials.length)html+=pickBlock("offers","🏷️","Special Offers","Chef's specials at great prices",`<div class="featured-grid">${specials.map(featuredCard).join("")}</div>`);
  homePicks.innerHTML=html;
  document.querySelectorAll(".js-dish-count").forEach(el=>el.textContent=`· ${dishTotal} dishes`);
}
function renderMenu(){
  // Full menu list; a search looks across all categories
  const groups=(search||current==="All"?listGroups:listGroups.filter(g=>g.cat===current))
    .map(g=>({cat:g.cat,items:(search&&g.cat.toLowerCase().includes(search))?g.items.filter(([n])=>!vegOnly||!isNonVeg(n)):g.items.filter(([n])=>matches(n))}))
    .filter(g=>g.items.length);
  grid.innerHTML=groups.length
    ?groups.map(g=>`<section class="menu-group"><header class="group-head"><h3>${esc(g.cat)}</h3><span>${g.items.length} ${g.items.length>1?"dishes":"dish"}</span></header>${g.items.map(dishRow).join("")}</section>`).join("")
    :`<p class="menu-empty">${search?`No dishes found for “${search.replace(/[<>&]/g,"")}”. Try paneer, biryani or roll.`:"No veg dishes in this category. Turn off “Veg only” to see all."}</p>`;
  renderPicks();   // keeps ADD / quantity buttons in sync on the home picks too
}
// Show / hide the full menu
const fmBtn=document.getElementById("toggleFullMenu");
function setFullMenu(open,scroll){
  fullMenu.hidden=!open;
  fmBtn.setAttribute("aria-expanded",open);
  fmBtn.classList.toggle("open",open);
  fmBtn.querySelector(".fm-label").textContent=open?"Hide Full Menu":"View Full Menu";
  fmBtn.querySelector(".fm-arrow").textContent=open?"↑":"↓";
  if(open&&scroll)fullMenu.scrollIntoView({behavior:"smooth"});
}
// Collapse the full menu and bring the customer back to the menu heading
function collapseFullMenu(){
  setFullMenu(false,false);
  document.querySelector("#menu .menu-head").scrollIntoView({behavior:"smooth",block:"start"});
}
fmBtn.onclick=()=>fullMenu.hidden?setFullMenu(true,true):collapseFullMenu();
document.getElementById("hideFullMenuBottom").onclick=collapseFullMenu;
if(location.hash==="#full-menu")setFullMenu(true,false);
document.getElementById("heroOrderNow").onclick=e=>{e.preventDefault();setFullMenu(true,true)};
// Bring the results into view when the user is scrolled past them
function scrollToResults(){
  if(grid.getBoundingClientRect().top<0)grid.scrollIntoView({behavior:"smooth"});
}
window.setCat=c=>{current=c;clearSearch();renderCats();renderMenu();scrollToResults()};
document.getElementById("vegOnly").addEventListener("change",e=>{vegOnly=e.target.checked;renderMenu()});
renderCats();renderMenu();

// Swap in the live menu from the database (prices/dishes edited by the admin)
async function loadProducts(){
  if(!sb)return;
  const {data,error}=await sb.from("products").select("category,name,price_full,price_half,is_veg,is_special,is_popular,is_bestseller,special_tag,description,image_url").order("sort_order");
  if(error||!data?.length)return;
  buildMenu(data);
  Object.keys(cart).forEach(k=>{if(!(k in priceByKey))delete cart[k]});   // dish removed or renamed
  if(!cats.includes(current))current="All";
  renderCats();renderMenu();renderCart();
}
loadProducts();
prefillFromAccount();
restoreOrderDraft();

// Navbar menu search
const searchInputs=document.querySelectorAll(".menu-search input");
function clearSearch(){search="";searchInputs.forEach(i=>i.value="")}
searchInputs.forEach(input=>{
  input.addEventListener("input",()=>{
    search=input.value.trim().toLowerCase();
    searchInputs.forEach(i=>{if(i!==input)i.value=input.value});
    if(search){current="All";renderCats();setFullMenu(true,false)}
    renderMenu();
    if(search)grid.scrollIntoView({behavior:"smooth"});
  });
  input.addEventListener("keydown",e=>{if(e.key==="Escape"){clearSearch();renderMenu();input.blur()}});
});

const navbar=document.getElementById("navbar");
function updateNavbar(){
  navbar.classList.toggle("nav-scrolled", window.scrollY > 30);
}
updateNavbar();
// Sticky menu toolbar sits right under the header, whatever its height
const setHeaderVar=()=>document.documentElement.style.setProperty("--hdr",navbar.offsetHeight+"px");
setHeaderVar();window.addEventListener("resize",setHeaderVar);
window.addEventListener("scroll", updateNavbar);
// Mobile menu drawer
const menuBtn=document.getElementById("menuBtn"), drawer=document.getElementById("mobileNav"), backdrop=document.getElementById("drawerBackdrop");
function setDrawer(open){
  drawer.classList.toggle("open",open);
  drawer.setAttribute("aria-hidden",!open);
  menuBtn.setAttribute("aria-expanded",open);
  menuBtn.classList.toggle("active",open);
  backdrop.hidden=!open;
  document.body.classList.toggle("no-scroll",open);
  if(open)document.getElementById("closeNav").focus();
}
menuBtn.onclick=()=>setDrawer(!drawer.classList.contains("open"));
document.getElementById("closeNav").onclick=()=>setDrawer(false);
backdrop.onclick=()=>setDrawer(false);
drawer.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>setDrawer(false)));
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&drawer.classList.contains("open"))setDrawer(false)});

// Enquire / Reserve form -> saved in Supabase, shown in the Admin Dashboard (Enquiries)
const enqDate=document.getElementById("enqDate");
enqDate.min=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
// Request type cards + guest stepper
document.querySelectorAll('input[name="enqTypeChoice"]').forEach(r=>r.addEventListener("change",()=>{
  document.getElementById("enqType").value=r.value;
  document.getElementById("enqBooking").classList.toggle("hidden",r.value==="General Enquiry");
}));
document.querySelectorAll(".enq-stepper [data-step]").forEach(b=>b.onclick=()=>{
  const g=document.getElementById("enqGuests");
  g.value=Math.min(500,Math.max(1,(parseInt(g.value,10)||0)+Number(b.dataset.step)));
});
document.getElementById("contactForm").onsubmit=async e=>{
  e.preventDefault();
  const v=id=>document.getElementById(id).value.trim();
  const msg=document.getElementById("formMsg"), btn=e.target.querySelector('button[type="submit"]');
  const say=(text,ok)=>{msg.textContent=text;msg.className="form-msg "+(ok?"ok":"bad")};
  if(!v("enqName")||!v("enqPhone"))return say("Please enter your name and phone number.",false);
  const booking=v("enqType")!=="General Enquiry";
  const row={enquiry_type:v("enqType"),name:v("enqName"),phone:v("enqPhone"),
    guests:booking&&v("enqGuests")?+v("enqGuests"):null,visit_date:booking&&v("enqDate")||null,visit_time:booking&&v("enqTime")||null,
    message:v("enqMsg")||null};

  btn.disabled=true;say("Sending…",true);
  let ok=false;
  try{
    if(sb){ok=!(await sb.from("enquiries").insert(row)).error}
    else{ok=(await fetch(`${SUPABASE_URL}/rest/v1/enquiries`,{method:"POST",headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify(row)})).ok}
  }catch{}
  btn.disabled=false;
  if(!ok)return say("Sorry, we couldn't send your request. Please check your internet and try again, or call 086770 44213.",false);

  const when=[v("enqDate")&&new Date(v("enqDate")+"T00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"}),v("enqTime")&&new Date(`2000-01-01T${v("enqTime")}`).toLocaleTimeString("en-IN",{hour:"numeric",minute:"2-digit",hour12:true})].filter(Boolean).join(" at ");
  notifyOwner({title:`New enquiry: ${v("enqType")}`,lines:[`Name: ${v("enqName")}`,...(v("enqGuests")?[`Guests: ${v("enqGuests")}`]:[]),...(when?[`For: ${when}`]:[])],tags:["calendar","bell"]});
  say(`✅ Thank you, ${v("enqName")}! Your ${v("enqType").toLowerCase()} request has been received. We'll call you on ${v("enqPhone")} to confirm.`,true);
  ["enqDate","enqTime","enqMsg"].forEach(id=>document.getElementById(id).value="");document.getElementById("enqGuests").value=2;
};

// Instagram: paste the profile link here (e.g. "https://www.instagram.com/your_handle/").
// While empty, the icons show but do nothing when tapped.
const INSTAGRAM_URL="https://www.instagram.com/chatkara_restro_barh/";
document.querySelectorAll(".insta-link").forEach(a=>{
  if(INSTAGRAM_URL){a.href=INSTAGRAM_URL;return}
  a.classList.add("is-empty");a.removeAttribute("target");
  a.addEventListener("click",e=>e.preventDefault());
});

// Navbar / drawer account button: "Login" or "My Account" / "Admin"
(async()=>{
  const acc=await getAccount().catch(()=>null);
  if(!acc)return;
  const admin=acc.profile.role==="admin";
  document.querySelectorAll(".js-account").forEach(a=>{
    a.href=dashboardFor(acc);
    a.setAttribute("aria-label",admin?"Admin dashboard":"My account");
    a.querySelector(".js-account-label").textContent=admin?"Admin":"My Account";
  });
})();
