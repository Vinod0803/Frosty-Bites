const API = https://frosty-backend.onrender.com
let FREE_DELIVERY = 199;

// ================= PRODUCTS =================

function renderProducts(products){

let html="";

products.forEach((p,i)=>{
let type = (p.type || "").toString().trim().toLowerCase();
let dropdown="";

if(type=="size"){
dropdown=`<select id="grams${i}" onchange="updatePrice(${i},${p.price})">
<option value="1">Small Cup</option>
<option value="1.5">Medium Cup</option>
<option value="2">Large Cup</option>
</select>`;
}
else if(type=="ml"){
dropdown=`<select id="grams${i}" onchange="updatePrice(${i},${p.price})">
<option value="1">250ml</option>
<option value="2">500ml</option>
<option value="3.5">1L</option>
<option value="5.5">2.25L</option>
</select>`;
}
else if(type.includes("pieces")){
dropdown=`<select id="grams${i}" onchange="updatePrice(${i},${p.price})">
<option value="1">1 Piece</option>
<option value="2">2 Pieces</option>
<option value="4">4 Pieces</option>
</select>`;
}
else{
dropdown=`<select id="grams${i}" onchange="updatePrice(${i},${p.price})">
<option value="1">250g</option>
<option value="2">500g</option>
<option value="4">1kg</option>
</select>`;
}

let icon="🛒";
if(p.category=="pickle") icon="🥭";
else if(p.category=="masala") icon="🌶️";
else if(p.category=="sweet") icon="🍬";
else if(p.category=="snack") icon="🍟";
else if(p.category=="drink") icon="🥤";
else if(p.category=="icecream") icon="🍦";

html+=`
<div class="card" data-cat="${p.category}">
<img src="http://localhost:5000/uploads/${p.image}">
<h3>${icon} ${p.name}</h3>
${dropdown}
<p class="price">₹<span id="price${i}">${p.price}</span></p>
<button class="addBtn"
onclick="addCart('${p.name}','price${i}','grams${i}','${p.image}',this)">
Add to Cart
</button>
</div>
`;
});

let container = document.getElementById("products");
if(container){
  container.innerHTML = html;
}
}

function updatePrice(i,base){
let g=document.getElementById("grams"+i).value;
document.getElementById("price"+i).innerText=base*g;
}
//Searching on Product
function searchProduct(){

let input=document.getElementById("search").value.toLowerCase()

document.querySelectorAll(".card").forEach(card=>{
let text=card.innerText.toLowerCase()
card.style.display=text.includes(input)?"block":"none"
})

}
// Filters on category

function filterCategory(cat,el){

let container=document.getElementById("products")

document.querySelectorAll(".card").forEach(card=>{
  card.style.display=
  (cat==="all"||card.dataset.cat===cat)
  ?"block"
  :"none";
});
 if(el){
    document.querySelectorAll(".cat").forEach(c=>c.classList.remove("active"))
    el.classList.add("active")
 }
}


// ================= CART =================

let cart={};

function addCart(name,priceID,gramsID,img,btn){

let price=parseInt(document.getElementById(priceID).innerText);
let grams=document.getElementById(gramsID).selectedOptions[0].text;

let key=name+" "+grams;

if(!cart[key]) cart[key]={qty:1,price,img};
else cart[key].qty++;

localStorage.setItem("cart", JSON.stringify(cart));
updateCart();
animateCart();
animateBadge();

btn.innerText="Added ✓";
btn.disabled=true;

setTimeout(()=>{
btn.innerText="Add to Cart";
btn.disabled=false;
},1200);
}

function updateCart(){

let html="";
let total=0;
let count=0;

let cartItemsEl = document.getElementById("cartItems");
if(Object.keys(cart).length === 0){
  if(cartItemsEl){
    cartItemsEl.innerHTML = `
  <div style="text-align:center;padding:20px">
    <h3>Your cart is empty 😔</h3>
    <button onclick="goToProducts()"
      style="margin-top:10px;padding:10px 20px;background:#ff6600;color:white;border:none;border-radius:5px;cursor:pointer">
      Start Shopping 🛍️
    </button>
  </div>
  `;
  }
  let summary = document.getElementById("cartSummary");
  if(summary) summary.style.display = "none";

  let amount = document.getElementById("cartAmount");
  if(amount) amount.innerText = 0;

  let delivery = document.getElementById("deliveryFee");
  if(delivery) delivery.innerText = 0;

  let final = document.getElementById("finalAmount");
  if(final) final.innerText = 0;

  return; // 🔥 STOP HERE
}
let summary = document.getElementById("cartSummary");
if(summary){
  summary.style.display = "block";
}
if(summary){
  summary.offsetHeight; // force reflow
}
for(let item in cart){
  let q=cart[item].qty;
  let p=cart[item].price;

  total+=q*p;
  count+=q;

  html+=`
  <div class="cartItem">
    <img src="${cart[item].img}">
    <div>${item}</div>
    <div>
      <button onclick="changeQty('${item}',-1)">-</button>
      ${q}
      <button onclick="changeQty('${item}',1)">+</button>
    </div>
  </div>
  `;
}

if(cartItemsEl){
  cartItemsEl.innerHTML = html;
}
let countEl = document.getElementById("cartCount");
if(countEl) countEl.innerText = count;

let amountEl = document.getElementById("cartAmount");
if(amountEl) amountEl.innerText = total;

let delivery= total>=FREE_DELIVERY ? 0 : 30;
let deliveryEl = document.getElementById("deliveryFee");
if(deliveryEl) deliveryEl.innerText = delivery;

let final=total+delivery;
let finalEl = document.getElementById("finalAmount");
if(finalEl) finalEl.innerText = final;

if(document.getElementById("progressFill")){
  updateProgress(total);
}
}
function updateProgress(total){

  let percent = (total / FREE_DELIVERY) * 100;
  if(percent > 100) percent = 100;

  let progress = document.getElementById("progressFill");
  let text = document.getElementById("deliveryText");

  // ✅ safe check
  if(progress){
    progress.style.width = percent + "%";
  }

  if(text){
    if(total >= FREE_DELIVERY){
      text.innerText = "🎉 Congratulations! You got FREE DELIVERY";
    }else{
      let remain = FREE_DELIVERY - total;
      text.innerText = "Add ₹" + remain + " more for FREE DELIVERY";
    }
  }
}

function changeQty(item,val){
cart[item].qty+=val;
if(cart[item].qty<=0) delete cart[item];

// 🔥 ADD THIS
localStorage.setItem("cart", JSON.stringify(cart));
updateCart();
}

// ================= Logout=================


function logout(){
localStorage.clear();
location.reload();
}


// ================= MODALS (🔥 FIXED) =================

function openLogin(){
document.getElementById("loginModal").style.display="flex"
document.body.classList.add("noScroll")

}

function closeLogin(){
document.getElementById("loginModal").style.display="none";
}


function closeAuth(){

  let login = document.getElementById("loginModal");
  let acc = document.getElementById("accountModal");
  let orders = document.getElementById("ordersModal");
  let edit = document.getElementById("editNameModal");

  if(login) login.style.display = "none";
  if(acc) acc.style.display = "none";
  if(orders) orders.style.display = "none";
  if(edit) edit.style.display = "none";

  document.body.classList.remove("noScroll");
}
async function openAccount(){

let email = localStorage.getItem("userEmail");
if(!email){
showToast("Login first");
return;
}
document.getElementById("accountModal").style.display="flex";
let res = await fetch(API + "/get-user/" + email);
let user = await res.json();

let name = user?.name || localStorage.getItem("userName") || "";
let mail = user?.email || localStorage.getItem("userEmail") || "";
document.getElementById("profileNameInput").value = name;
document.getElementById("profileEmailInput").value = mail;
document.getElementById("profilePhoneInput").value = user?.phone || "";


let imgUrl = "images/user.png";

if(user.profile_pic){
imgUrl = API + "/uploads/" + user.profile_pic;
document.getElementById("profilePicPreview").src = imgUrl;
}

document.getElementById("profilePicPreview").src = imgUrl;
}
// View Orders
async function viewOrders(){

document.getElementById("accountModal").style.display="none";
document.getElementById("ordersModal").style.display="flex";

let email = localStorage.getItem("userEmail");

let res = await fetch(API + "/my-orders/" + email);
let orders = await res.json();

let html="";

orders.forEach(o=>{

let status = o.status || "Preparing";
let track = `
<div style="display:flex;justify-content:space-between;margin-top:10px">

<span>${status=="Preparing"?"🟢":"⚪"} 🍳</span>
<span>${status=="Out for Delivery"?"🟢":"⚪"} 🚴</span>
<span>${status=="Delivered"?"🟢":"⚪"} ✅</span>

</div>
`;

html+=`
<div style="
border:1px solid #eee;
padding:15px;
margin:10px 0;
border-radius:10px;
box-shadow:0 2px 5px rgba(0,0,0,0.1)
">

<h4>🧾 Order #${o.id}</h4>

<p>💰 Amount: ₹${o.amount}</p>

<p>📦 Status: <b>${status}</b></p>
${track}

<p style="color:gray;font-size:12px">
🕒 ${new Date(o.created_at).toLocaleString()}
</p>

<button onclick='openInvoice(${JSON.stringify(o)})'
style="margin-top:10px;padding:5px 10px">
View Invoice 🧾
</button>
</div>
`;

});

document.getElementById("ordersList").innerHTML = html;

}
function editName(){
document.getElementById("editNameModal").style.display="flex";
}
function openInvoice(order){

document.getElementById("invoiceModal").style.display="flex";

let html = `
<h4>Order #${order.id}</h4>
<p>Name: ${order.name}</p>
<p>Email: ${order.email}</p>
<p>Amount: ₹${order.amount}</p>
<p>Status: ${order.status || "Pending"}</p>
<p>Date: ${new Date(order.created_at).toLocaleString()}</p>
`;

document.getElementById("invoiceContent").innerHTML = html;

}

function printInvoice(){
window.print();
}

async function saveName(){

let newName = document.getElementById("newName").value;
let email = localStorage.getItem("userEmail");

if(newName==""){
showToast("Enter name");
return;
}

// 🔥 DB update
await fetch(API + "/update-user",{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body: JSON.stringify({
name:newName,
email:email
})
});

document.getElementById("profileName").innerText = newName;
document.getElementById("welcomeUser").innerText = "Hi "+newName+" 👋";

closeAuth();

showToast("Name updated successfully ✅");

}
async function updateProfile(){

let oldEmail = localStorage.getItem("userEmail");

let name = document.getElementById("profileNameInput").value;
let newEmail = document.getElementById("profileEmailInput").value;
let phone = document.getElementById("profilePhoneInput").value;

await fetch(API + "/update-profile",{
method:"PUT",
headers:{"Content-Type":"application/json"},
body: JSON.stringify({
name:name,
email:oldEmail,
newEmail:newEmail,
phone:phone,
profile_pic: imgName
})
});

// update localStorage
localStorage.setItem("userEmail", newEmail);

showToast("Profile Updated ✅");

closeAuth();

}

async function uploadProfilePic(){

let file = document.getElementById("profilePicInput").files[0];

if(!file){
showToast("Select image first ❌");
return;
}

let formData = new FormData();
formData.append("profilePic", file); // 🔥 IMPORTANT name match
formData.append("email", localStorage.getItem("userEmail"));

let res = await fetch(API + "/upload-profile",{
method:"POST",
body: formData
});

let data = await res.json();
let imgUrl = API + "/uploads/" + data.image;
// ✅ preview + header update
document.getElementById("profilePicPreview").src = imgUrl;
document.getElementById("headerProfilePic").src = imgUrl;

showToast("Profile updated ✅");

}
// ================= RESEND OTP =================

let resendTimer = 30;
let timerInterval;

function startTimer(){

let btn = document.getElementById("resendBtn");

btn.disabled = true;

resendTimer = 30;

timerInterval = setInterval(()=>{

resendTimer--;

btn.innerText = "Resend OTP (" + resendTimer + "s)";

if(resendTimer <= 0){
clearInterval(timerInterval);
btn.disabled = false;
btn.innerText = "Resend OTP";
}

},1000);

}

// 🔥 MODIFY sendOTP
async function sendOTP(){

let email = document.getElementById("liEmail").value;

if(!email){
alert("Enter email");
return;
}

await fetch(API+"/send-otp",{
method:"POST",
headers:{"Content-Type":"application/json"},
body: JSON.stringify({email})
});

showToast("OTP sent 📩");

startTimer(); // 👈 add this
}

// 🔥 RESEND OTP
async function resendOTP(){

let email = document.getElementById("liEmail").value;

await fetch(API+"/send-otp",{
method:"POST",
headers:{"Content-Type":"application/json"},
body: JSON.stringify({email})
});

showToast("OTP resent 🔁");

startTimer();
}
//Verify OTP
async function verifyOTP(){
let name = document.getElementById("liName").value;
let email = document.getElementById("liEmail").value;
let otp = document.getElementById("otpInput").value;


if(!name || !email || !otp){
showToast("Fill all fields");
return;
}
let res = await fetch(API+"/verify-otp",{
method:"POST",
headers:{"Content-Type":"application/json"},
body: JSON.stringify({email, otp})
});

let data = await res.json();

if(data.status=="success"){

localStorage.setItem("isLoggedIn","true");
localStorage.setItem("userEmail",email);

await fetch(API+"/save-name",{
method:"PUT",
headers:{"Content-Type":"application/json"},
body: JSON.stringify({
name:name,
email:email
})
});

document.getElementById("welcomeUser").innerText="Hi "+data.user.name+" 👋";
document.getElementById("loginBtn").style.display="none";
document.getElementById("headerProfilePic").style.display="block";

closeAuth();

}else{

if(data.status=="fail"){
showToast(data.msg || "Wrong OTP ❌");
}
}
}
// ================= PAYMENT =================

async function payNow(){

try{

let name = document.getElementById("name").value;
let address = document.getElementById("address").value;
let amount = parseInt(document.getElementById("finalAmount").innerText);

let email = localStorage.getItem("userEmail");

if(!name || !address){
  showToast("Fill delivery details ❌");
  return;
}

if(amount <= 0){
  showToast("Cart empty ❌");
  return;
}

// 🔥 TEMP TEST ORDER (remove later)
let res = await fetch(API+"/create-order",{
  method:"POST",
  headers:{"Content-Type":"application/json"},
  body: JSON.stringify({amount})
});

let order = await res.json();

var options={
  key:"rzp_test_xxxxx",
  amount:order.amount,
  currency:"INR",
  order_id:order.id,

  handler: async function(response){

    let orderId = Date.now();

    showSuccessPage(orderId);

    cart = {};
    localStorage.removeItem("cart");
    updateCart();
  }
};

new Razorpay(options).open();

}catch(err){
  console.error(err);
  showToast("Payment error ❌");
}

}
function showSuccessPage(orderId){

  let page = document.getElementById("successPage");
  let text = document.getElementById("orderIdText");

  if(page){
    page.style.display = "block";
  }

  if(text){
    text.innerText = "Order ID: #" + orderId;
  }
}

function closeSuccessPage(){

  let page = document.getElementById("successPage");

  if(page){
    page.style.display = "none";
  }
}
// ================= LOAD =================

async function loadProducts(){
let res=await fetch(API+"/products");
let data=await res.json();
renderProducts(data);
}

document.addEventListener("DOMContentLoaded", function(){

  if(localStorage.getItem("isLoggedIn") == "true"){

    let email = localStorage.getItem("userEmail");

    fetch(API + "/get-user/" + email)
    .then(res => res.json())
    .then(user => {

      let welcome = document.getElementById("welcomeUser");
      if(welcome){
        welcome.innerText = "Hi " + user.name + " 👋";
      }

      let imgUrl = user.profile_pic
        ? API + "/uploads/" + user.profile_pic
        : "images/user.jpg";

      let headerImg = document.getElementById("headerProfilePic");
      if(headerImg){
        headerImg.src = imgUrl;
      }

      let profileImg = document.getElementById("profilePicPreview");
      if(profileImg){
        profileImg.src = imgUrl;
      }

    });

    // UI changes (SAFE)
    let loginBtn = document.getElementById("loginBtn");
    if(loginBtn){
      loginBtn.style.display = "none";
    }

    let headerImg = document.getElementById("headerProfilePic");
    if(headerImg){
      headerImg.style.display = "block";
    }
  }

  // 🔥 LOAD CART FIRST
  let savedCart = localStorage.getItem("cart");

  if(savedCart){
    cart = JSON.parse(savedCart);
  }

  updateCart();

  // ✅ ONLY PRODUCTS PAGE
  if(document.getElementById("products")){
    loadProducts();
  }

});
function showToast(msg){
let toast = document.getElementById("successToast");
toast.innerText = msg;
toast.style.display = "block";

setTimeout(()=>{
toast.style.display = "none";
},2000);
}
function toggleChat(){
  let chat = document.getElementById("chatContainer");

  if(!chat) return; // 🔥 prevent error

  chat.style.display =
    (chat.style.display === "block") ? "none" : "block";
}
function animateCart(){
  let cart = document.querySelector(".cart");

  cart.classList.add("bounce");

  setTimeout(()=>{
    cart.classList.remove("bounce");
  }, 500);
}
function animateBadge(){
  let badge = document.getElementById("cartCount");

  badge.classList.add("pop");

  setTimeout(()=>{
    badge.classList.remove("pop");
  }, 300);
}

function goToProducts(){
  window.location.href = "products.html";
}
function openCategory(cat){
  localStorage.setItem("selectedCategory", cat);
  window.location.href = "products.html";
}
function goToCheckout(){
  window.location.href = "checkout.html";
}
function proceedToBuy(){
  window.location.href = "index.html#cart";
}
function goBack(){
  window.history.back();
}
