/* ===== Настройки ===== */
const WA_PHONE = "77000000000"; // ← номер WhatsApp в формате 7XXXXXXXXXX
const STORAGE_KEY = "doner-cart-v1";

/* ===== Товары (цены сохранены) =====
   Картинки: положите файлы рядом с index.html под этими именами.
   Пока файла нет — показывается эмодзи-заглушка. */
const PRODUCTS = [
  {id:"d1",cat:"doner",name:"Донер куриный стандарт",price:1390,img:"chicken-doner.jpg",emoji:"🌯"},
  {id:"d2",cat:"doner",name:"Донер куриный 1,5",price:1690,img:"chicken-doner.jpg",emoji:"🌯"},
  {id:"d3",cat:"doner",name:"Донер говяжий стандарт",price:1590,img:"cowdoner.jpg",emoji:"🌯"},
  {id:"d4",cat:"doner",name:"Донер говяжий 1,5",price:1890,img:"cowdoner.jpg",emoji:"🌯"},
  {id:"b1",cat:"burger",name:"Гамбургер",price:990,img:"hamburger.jpg",emoji:"🍔"},
  {id:"b2",cat:"burger",name:"Двойной Гамбургер",price:1290,img:"hamburger-double.jpg",emoji:"🍔"},
  {id:"b3",cat:"burger",name:"Чизбургер",price:990,img:"cheeseburger.jpg",emoji:"🍔"},
  {id:"b4",cat:"burger",name:"Двойной Чизбургер",price:1490,img:"cheeseburger-double.jpg",emoji:"🍔"},
  {id:"k1",cat:"drink",name:"Кока Кола",price:550,img:"cola.jpg",emoji:"🥤"},
  {id:"k2",cat:"drink",name:"Макси Чай",price:450,img:"maxi-tea.jpg",emoji:"🧋"},
  {id:"k3",cat:"drink",name:"Фанта",price:550,img:"fanta.jpg",emoji:"🥤"},
  {id:"k4",cat:"drink",name:"Фюсти",price:450,img:"fusti.jpg",emoji:"🥤"},
  /* Сеты: price — цена сета, old — сумма по отдельности */
  {id:"s1",cat:"sets",name:"Сет «Классика»",desc:"Куриный донер + Кока Кола",price:1790,old:1940,img:"chicken-doner.jpg",emoji:"🌯",tag:"Хит"},
  {id:"s2",cat:"sets",name:"Сет «Говяжий»",desc:"Говяжий донер 1,5 + Фанта",price:2190,old:2440,img:"cowdoner.jpg",emoji:"🌯"},
  {id:"s3",cat:"sets",name:"Сет «Бургер-комбо»",desc:"Двойной чизбургер + Кока Кола",price:1890,old:2040,img:"cheeseburger-double.jpg",emoji:"🍔"},
  {id:"s4",cat:"sets",name:"Сет «На двоих»",desc:"Куриный донер 1,5 + Гамбургер + Кока Кола + Макси Чай",price:3290,old:3680,img:"hamburger.jpg",emoji:"🍽️",tag:"Выгодно"}
];

/* ===== Утилиты ===== */
const $ = (s, el=document) => el.querySelector(s);
const fmt = n => n.toLocaleString("ru-RU") + " тг";
const byId = id => PRODUCTS.find(p => p.id === id);
const esc = s => s.replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const pic = p => `<div class="ph" data-emoji="${p.emoji}"><img src="${p.img}" alt="${esc(p.name)}" loading="lazy" onerror="this.remove()"></div>`;

/* ===== Состояние корзины (localStorage) ===== */
let cart = {};
try { cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { cart = {}; }
Object.keys(cart).forEach(id => { if (!byId(id)) delete cart[id]; }); // чистим устаревшие товары
const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch {} };

/* ===== Рендер каталога ===== */
function card(p){
  return `<article class="card">
    <div style="position:relative">${pic(p)}${p.tag ? `<span class="tag">${p.tag}</span>` : ""}</div>
    <div class="card-body">
      <h3>${p.name}</h3>${p.desc ? `<p class="desc">${p.desc}</p>` : ""}
      <div class="card-foot">
        <div class="price">${p.old ? `<s>${fmt(p.old)}</s>` : ""}${fmt(p.price)}</div>
        <button class="add" data-add="${p.id}">Добавить</button>
      </div>
    </div></article>`;
}
const GRIDS = {sets:"#grid-sets", doner:"#grid-doner", burger:"#grid-burger", drink:"#grid-drink"};
Object.entries(GRIDS).forEach(([cat, sel]) => {
  $(sel).innerHTML = PRODUCTS.filter(p => p.cat === cat).map(card).join("");
});

/* ===== Рендер корзины ===== */
function render(){
  const ids = Object.keys(cart);
  const count = ids.reduce((s, id) => s + cart[id], 0);
  const total = ids.reduce((s, id) => s + cart[id] * byId(id).price, 0);
  $("#count").textContent = count;
  $("#total").textContent = fmt(total);
  $("#order").toggleAttribute("disabled", !count);
  $("#clear").style.display = count ? "" : "none";

  $("#items").innerHTML = count ? ids.map(id => {
    const p = byId(id), q = cart[id];
    return `<div class="item">
      ${pic(p)}
      <div><div class="item-name">${p.name}</div>
        <div class="item-sum">${fmt(p.price * q)}</div>
        <div class="qty"><button data-dec="${id}" aria-label="Уменьшить">−</button><span>${q}</span><button data-inc="${id}" aria-label="Увеличить">+</button></div>
      </div>
      <button class="remove icon-btn" data-del="${id}" aria-label="Удалить ${esc(p.name)}">×</button>
    </div>`;
  }).join("") : `<div class="empty"><b>Корзина пуста</b>Добавьте донер или сет из меню.</div>`;

  // Ссылка на заказ в WhatsApp
  const lines = ids.map(id => `• ${byId(id).name} × ${cart[id]} = ${fmt(byId(id).price * cart[id])}`);
  const text = `Здравствуйте! Хочу заказать:\n${lines.join("\n")}\nИтого: ${fmt(total)}`;
  $("#order").href = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`;
}

/* ===== Действия ===== */
function setQty(id, q){ q > 0 ? cart[id] = q : delete cart[id]; save(); render(); }

let toastTimer;
function toast(msg){
  $("#toastText").textContent = msg;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 2000);
}

function addToCart(id, btn){
  setQty(id, (cart[id] || 0) + 1);
  toast(`${byId(id).name} — в корзине`);
  const b = $("#count"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
  if (btn){ btn.classList.add("done"); btn.textContent = "Добавлено"; setTimeout(() => { btn.classList.remove("done"); btn.textContent = "Добавить"; }, 1100); }
}

/* ===== Drawer ===== */
function openCart(open){
  $("#drawer").classList.toggle("open", open);
  $("#overlay").classList.toggle("open", open);
  $("#drawer").setAttribute("aria-hidden", !open);
  document.body.classList.toggle("lock", open);
  if (open) $("#closeCart").focus(); else $("#openCart").focus({preventScroll:true});
}

/* ===== События (делегирование) ===== */
document.addEventListener("click", e => {
  const t = e.target.closest("[data-add],[data-inc],[data-dec],[data-del]");
  if (!t) return;
  const d = t.dataset;
  if (d.add) addToCart(d.add, t);
  if (d.inc) setQty(d.inc, cart[d.inc] + 1);
  if (d.dec) setQty(d.dec, cart[d.dec] - 1);
  if (d.del) setQty(d.del, 0);
});
$("#openCart").addEventListener("click", () => openCart(true));
$("#closeCart").addEventListener("click", () => openCart(false));
$("#overlay").addEventListener("click", () => openCart(false));
document.addEventListener("keydown", e => { if (e.key === "Escape") openCart(false); });
$("#clear").addEventListener("click", () => { cart = {}; save(); render(); });

/* Тень у шапки при прокрутке */
const header = $("#header");
addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 8), {passive:true});

/* Подсветка активного раздела в навигации */
const links = document.querySelectorAll(".nav a, .mobile-nav a");
const spy = new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id)); });
}, {rootMargin:"-45% 0px -50% 0px"});
["sets","menu","contacts"].forEach(id => spy.observe(document.getElementById(id)));

render();
