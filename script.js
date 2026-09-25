// Full menu from the Chatkara menu card. Each item: [name, fullPrice, halfPrice?]
const menuData=[
{cat:"Specials",items:[["Chicken Dehati",449],["Chicken Dum Biryani",180,99],["Veg Manchurian",120]]},
{cat:"Chinese Veg",items:[["Paneer Chilli Dry",200],["Paneer Chilli Gravy",200,100],["Paneer Pakoda",150],["Paneer Paper",200],["Paneer 65",200],["Mushroom Chilli Dry",200],["Mushroom Chilli Gravy",200],["Mushroom Crepes",220]]},
{cat:"Chinese Non-Veg",items:[["Chicken Chilli Dry",200],["Chicken Chilli Gravy",180,90],["Chicken 65",200],["Chicken Paper",200],["Chicken Lollipop",230]]},
{cat:"Noodles",items:[["Veg Noodles",60,35],["Egg D. Noodles",80,45],["Mix Veg Noodles",110],["Garlic Noodles",130,70],["Veg Szechwan Noodles",120],["Chicken Noodles",140,80],["Mushroom Noodles",130]]},
{cat:"Soup",items:[["Veg Hot & Sour Soup",80],["Garlic Soup",120],["Chicken Hot & Sour Soup",150]]},
{cat:"Veg Indian",items:[["Paneer Kadai",230,110],["Paneer Handi",230],["Paneer Masala",180,100],["Paneer Butter Masala",200,100],["Paneer Kofta",250],["Paneer Do Pyaza",230,120],["Shahi Paneer",250],["Mutter Paneer",200],["Mushroom Paneer",230],["Mushroom Masala",220],["Mushroom Handi",250],["Mushroom Kadai",230],["Mushroom Butter Masala",230],["Mushroom Do Pyaza",230],["Mushroom Mutter",230]]},
{cat:"Daal",items:[["Daal Fry",80],["Daal Tadka",150],["Daal Butter",150],["Daal Makhni",150]]},
{cat:"Indian Non-Veg",items:[["Chicken Kadai",250,130],["Chicken Handi",260,150],["Chicken Butter Masala",270,140],["Chicken Egg Masala",260,150],["Chicken Curry",250,130],["Chicken Do Pyaza",260,140],["Chicken Hyderabadi",270,150],["Chicken Kassa",270,150],["Chicken Korma",260,140],["Omelette Curry",140],["Egg Curry",100]]},
{cat:"Biryani & Rice",items:[["Chicken Dum Biryani",180,99],["Egg Biryani",120],["Veg Biryani",130],["Plain Rice",70],["Jeera Rice",100],["Veg Pulao",150],["Peas Pulao",150]]},
{cat:"Bread",items:[["Tawa Roti (per pc)",8],["Tawa Butter Roti (per pc)",12],["Lachha Paratha (per pc)",25],["Plain Paratha (per pc)",20]]},
{cat:"Rolls",items:[["Egg D. Roll",50],["Egg D. Chicken Roll",100],["Chicken Roll",80],["Paneer Roll",70],["Mushroom Roll",90],["Veg Roll",30],["Paneer Kathi Roll",100]]}
];
// Cart keys are "Name" or "Name (Full)" / "Name (Half)"; the same dish in two categories shares a key.
const priceByKey={};
menuData.forEach(g=>g.items.forEach(([n,full,half])=>{
  if(half){priceByKey[`${n} (Full)`]=full;priceByKey[`${n} (Half)`]=half}else priceByKey[n]=full;
}));
const isNonVeg=n=>/chicken|egg|omelette/i.test(n);
const featuredInfo={
  "Chicken Dehati":{tag:"Signature",desc:"Our desi-style house special, rich, spicy and full of flavour."},
  "Chicken Dum Biryani":{tag:"Bestseller",desc:"Fragrant rice and tender chicken, slow-cooked on dum."},
  "Veg Manchurian":{tag:"Veg Favourite",desc:"Crispy veg balls tossed in a tangy Indo-Chinese sauce."}
};
const specials=menuData.find(g=>g.cat==="Specials").items;
const listGroups=menuData.filter(g=>g.cat!=="Specials");
const cats=["All","Specials",...listGroups.map(g=>g.cat)];
const catLabel=c=>c==="Specials"?"★ Chef's Specials":c;
const categories=document.getElementById("categories"), grid=document.getElementById("menuGrid"), featured=document.getElementById("featured");
let current="All", search="", vegOnly=false;

function renderCats(){
  categories.innerHTML=cats.map(c=>`<button type="button" role="tab" aria-selected="${c===current}" class="cat-chip ${c===current?'active':''}" onclick="setCat('${c}')">${catLabel(c)}</button>`).join("");
  // Centre the active chip in the horizontal bar (without scrolling the page)
  const a=categories.querySelector(".active");
  if(a)categories.scrollTo({left:a.offsetLeft-(categories.clientWidth-a.offsetWidth)/2,behavior:"smooth"});
}
const priceOpts=(n,full,half)=>half?[["Half",half,`${n} (Half)`],["Full",full,`${n} (Full)`]]:[["",full,n]];
const dietDot=n=>`<span class="diet ${isNonVeg(n)?'nonveg':'veg'}" title="${isNonVeg(n)?'Non-veg':'Veg'}"></span>`;
function dishRow([n,full,half]){
  return `<div class="dish${half?" multi":""}"><div class="dish-main">${dietDot(n)}<span class="dish-name">${n}</span><span class="leader" aria-hidden="true"></span></div><div class="dish-prices">${priceOpts(n,full,half).map(([label,p,key])=>`<div class="dish-opt">${label?`<span class="portion">${label}</span>`:""}<span class="amt">₹${p}</span>${qtyControl(key)}</div>`).join("")}</div></div>`;
}
function featuredCard([n,full,half]){
  const info=featuredInfo[n]||{tag:"Special",desc:""};
  return `<article class="feature-card"><div class="feature-top"><span class="feature-tag">${info.tag}</span>${dietDot(n)}</div><h3>${n}</h3><p>${info.desc}</p><div class="feature-prices">${priceOpts(n,full,half).map(([label,p,key])=>`<div class="dish-opt">${label?`<span class="portion">${label}</span>`:""}<span class="amt">₹${p}</span>${qtyControl(key)}</div>`).join("")}</div></article>`;
}
const matches=n=>(!vegOnly||!isNonVeg(n))&&(!search||n.toLowerCase().includes(search));
function renderMenu(){
  // Chef's specials: featured cards (on "All"/"Specials", or when a search matches them)
  const feat=(current==="All"||current==="Specials"||search)?specials.filter(([n])=>matches(n)):[];
  featured.innerHTML=feat.length?`<div class="featured-label"><span>★</span> Chef's Specials</div>${feat.map(featuredCard).join("")}`:"";
  featured.hidden=!feat.length;
  // Regular menu list; a search looks across all categories
  const groups=(search||current==="All"?listGroups:listGroups.filter(g=>g.cat===current))
    .map(g=>({cat:g.cat,items:(search&&g.cat.toLowerCase().includes(search))?g.items.filter(([n])=>!vegOnly||!isNonVeg(n)):g.items.filter(([n])=>matches(n))}))
    .filter(g=>g.items.length);
  grid.innerHTML=groups.length
    ?groups.map(g=>`<section class="menu-group"><header class="group-head"><h3>${g.cat}</h3><span>${g.items.length} ${g.items.length>1?"dishes":"dish"}</span></header>${g.items.map(dishRow).join("")}</section>`).join("")
    :feat.length?"":`<p class="menu-empty">${search?`No dishes found for “${search.replace(/[<>&]/g,"")}”. Try paneer, biryani or roll.`:"No veg dishes in this category. Turn off “Veg only” to see all."}</p>`;
}
// Bring the results into view when the user is scrolled past them
function scrollToResults(){
  const target=featured.hidden?grid:featured;
  if(target.getBoundingClientRect().top<0)target.scrollIntoView({behavior:"smooth"});
}
window.setCat=c=>{current=c;clearSearch();renderCats();renderMenu();scrollToResults()};
document.getElementById("vegOnly").addEventListener("change",e=>{vegOnly=e.target.checked;renderMenu()});
renderCats();renderMenu();

// Navbar menu search
const searchInputs=document.querySelectorAll(".menu-search input");
function clearSearch(){search="";searchInputs.forEach(i=>i.value="")}
searchInputs.forEach(input=>{
  input.addEventListener("input",()=>{
    search=input.value.trim().toLowerCase();
    searchInputs.forEach(i=>{if(i!==input)i.value=input.value});
    if(search){current="All";renderCats()}
    renderMenu();
    (featured.hidden?grid:featured).scrollIntoView({behavior:"smooth"});
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

// Enquire / Reserve form -> WhatsApp (WHATSAPP_NUMBER comes from order.js)
const enqDate=document.getElementById("enqDate");
enqDate.min=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
document.getElementById("contactForm").onsubmit=e=>{
  e.preventDefault();
  const v=id=>document.getElementById(id).value.trim();
  const when=[v("enqDate")&&new Date(v("enqDate")+"T00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"}),v("enqTime")&&new Date(`2000-01-01T${v("enqTime")}`).toLocaleTimeString("en-IN",{hour:"numeric",minute:"2-digit",hour12:true})].filter(Boolean).join(" at ");
  const lines=[`*${v("enqType")} — Chatkara Family Restaurant*`,"",`Name: ${v("enqName")}`,`Phone: ${v("enqPhone")}`];
  if(v("enqGuests"))lines.push(`Guests: ${v("enqGuests")}`);
  if(when)lines.push(`Date/Time: ${when}`);
  if(v("enqMsg"))lines.push(`Message: ${v("enqMsg")}`);
  notifyOwner({title:`New enquiry: ${v("enqType")}`,lines:lines.slice(2),tags:["calendar","bell"]});
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`,"_blank");
  document.getElementById("formMsg").classList.remove("hidden");
};
