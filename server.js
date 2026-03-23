const mysql = require("mysql2");
const cors = require("cors");
const Razorpay = require("razorpay");

const express = require("express");
const app = express();

const fs = require("fs");
const path = require("path"); // 👈 ADD

// 🔥 ADD HERE
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🔥 correct uploads path
const uploadDir = path.join(__dirname, "uploads");

// 🔥 ensure folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multer = require("multer");

const storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function(req, file, cb){
     let ext = file.originalname.split(".").pop();

    let cleanName = file.originalname.replace(/\s+/g, "-");

    cb(null, Date.now() + "-" + cleanName);
  }
});

const upload = multer({ storage: storage });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 🔥 FIX (important for image upload)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(cors());

const razorpay = new Razorpay({
  key_id: "rzp_test_ABC123",       // 👈 paste yours
  key_secret: "xxxxxxxxxxxxxx"     // 👈 paste yours
});
// ✅ MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.connect(err => {
  if (err) {
    console.log("DB Error ❌", err);
  } else {
    console.log("MySQL Connected ✅");
  }
});
// 🔥 TEST
app.get("/", (req,res)=>{
  res.send("Server Working ✅");
});
//ProfilePic
app.post("/upload-profile", upload.single("profilePic"), (req,res)=>{

console.log("FILE 👉", req.file); // DEBUG

if(!req.file){
return res.send("File not received ❌");
}

const email = req.body.email;
const imagePath = req.file.filename;

db.query(
"UPDATE users SET profile_pic=? WHERE email=?",
[imagePath,email],
(err)=>{
if(err) return res.send(err);
res.json({image:imagePath});
}
);

});
app.get("/get-user/:email",(req,res)=>{

const email = req.params.email;

db.query(
"SELECT * FROM users WHERE email=?",
[email],
(err,result)=>{
if(err) return res.send(err);
res.json(result[0]);
}
);

});
app.put("/update-user", (req,res)=>{

  const {name,email} = req.body;

  db.query(
    "UPDATE users SET name=? WHERE email=?",
    [name,email],
    (err,result)=>{
      if(err) return res.send(err);
      res.send("Updated");
    }
  );

});
app.put("/update-profile", (req,res)=>{
const {name,email,newEmail,phone,profile_pic} = req.body;

db.query(
"UPDATE users SET name=?, email=?, phone=?, profile_pic=? WHERE email=?",
[name,newEmail,phone,profile_pic,email],
(err,result)=>{
if(err) return res.send(err);
res.send("Profile Updated");
}
);

});
// 🔥 GET PRODUCTS
app.get("/products", (req,res)=>{
  db.query("SELECT * FROM products", (err,result)=>{
    if(err) return res.send(err);
    res.json(result);
  });
});

app.put("/change-password", (req,res)=>{

const {email,oldPass,newPass} = req.body;

db.query(
"SELECT * FROM users WHERE email=? AND password=?",
[email,oldPass],
(err,result)=>{

if(result.length==0){
return res.send("Wrong old password ❌");
}

db.query(
"UPDATE users SET password=? WHERE email=?",
[newPass,email],
(err2)=>{
if(err2) return res.send(err2);
res.send("Password Updated ✅");
}
);

}
);

});
// 🔥 ADD PRODUCT
app.post("/add-product", upload.single("image"), (req, res) => {
 
 const name = req.body.name;
const price = req.body.price;
const stock = req.body.stock;
const category = req.body.category;
const type = req.body.type;
 const image = req.file ? req.file.filename : "";
  if(!name || !price || !stock || !category || !image || !type){
    return res.json({ error: "All fields required" });
  }

  let sql = "INSERT INTO products (name, price, stock, category, image, type) VALUES (?,?,?,?,?,?)";

  db.query(sql, [name, price, stock, category, image, type], (err) => {
    if(err){
      console.log(err);
      return res.json({ error: "DB error" });
    }

    res.json({ success: true });
  });

});

//upadte order
app.put("/update-order/:id", (req,res)=>{

  const id = req.params.id;
  const {status} = req.body;

  db.query(
    "UPDATE orders SET status=? WHERE id=?",
    [status,id],
    (err,result)=>{
      if(err) return res.send(err);
      res.send("Updated");
    }
  );

});
// 🔥 DELETE PRODUCT
app.delete("/delete-product/:id", (req,res)=>{
  const id = req.params.id;

  db.query("DELETE FROM products WHERE id=?", [id], (err,result)=>{
    if(err) return res.send(err);
    res.send("Deleted");
  });
});
// Delete order
app.delete("/delete-order/:id", (req,res)=>{

  const id = req.params.id;

  db.query(
    "DELETE FROM orders WHERE id=?",
    [id],
    (err,result)=>{
      if(err) return res.send(err);
      res.send("Deleted");
    }
  );

});
// 🔥 SAVE ORDER
app.post("/order", (req,res)=>{
  const {name,email,address,amount,payment_id} = req.body;

  db.query(
    "INSERT INTO orders (name,email,address,amount,payment_id) VALUES (?,?,?,?,?)",
    [name,email,address,amount,payment_id],
    (err,result)=>{
      if(err) return res.send(err);
      res.send("Order Saved");
    }
  );
});
app.get("/orders", (req,res)=>{

  db.query("SELECT * FROM orders ORDER BY id DESC",(err,result)=>{
    if(err) return res.send(err);
    res.json(result);
  });

});
app.post("/create-order", async (req,res)=>{

  const {amount} = req.body;

  const options = {
    amount: amount * 100, // paisa
    currency: "INR"
  };

  try{
    const order = await razorpay.orders.create(options);
    res.json(order);
  }catch(err){
    res.send(err);
  }

});
// ✅ SIGNUP
app.post("/signup", (req,res)=>{
  const {name,email,password} = req.body;

  db.query(
    "INSERT INTO users (name,email,password) VALUES (?,?,?)",
    [name,email,password],
    (err,result)=>{
      if(err) return res.send(err);
      res.send("User created");
    }
  );
});

// ✅ LOGIN
app.post("/login", (req,res)=>{
  const {email,password} = req.body;

  db.query(
    "SELECT * FROM users WHERE email=? AND password=?",
    [email,password],
    (err,result)=>{
      if(result.length>0){
        res.json({status:"success", user:result[0]});
      }else{
        res.json({status:"fail"});
      }
    }
  );
});


// ================= OTP SYSTEM =================
const nodemailer = require("nodemailer");

let otpStore = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "frostybites0313@gmail.com",
    pass: "vwpkodpkdcxhejkw"
  }
});

// SEND OTP
app.post("/send-otp", (req,res)=>{

let email = req.body.email.trim().toLowerCase();

// 🔥 check existing record
let record = otpStore[email];

// ⏱ reset after 24 hrs
if(record && Date.now() > record.resetTime){
  delete otpStore[email];
  record = null;
}

const otp = Math.floor(1000 + Math.random()*9000);

otpStore[email] = {
  otp: otp,
  expires: Date.now() + 2 * 60 * 1000, // 2 mins
  attempts: 0,
  resendCount: (otpStore[email]?.resendCount || 0) + 1
};

// 🔥 LIMIT RESEND
if(otpStore[email].resendCount > 3){
  return res.send("Max OTP requests reached ❌ (Try after 24 hrs)");
}

transporter.sendMail({
from: "frostybites0313@gmail.com",
to: email,
subject: "Frosty Bites OTP",
text: "Your OTP is " + otp
});

res.send("OTP Sent");

});

// VERIFY OTP
app.post("/verify-otp", (req,res)=>{

let email = req.body.email.trim().toLowerCase();
let enteredOtp = req.body.otp;

let record = otpStore[email];
if(record && Date.now() > record.resetTime){
  delete otpStore[email];
  return res.json({status:"fail", msg:"OTP expired, try again"});
}

if(!record){
  return res.json({status:"fail", msg:"OTP not found"});
}

// ⏱ EXPIRE CHECK
if(Date.now() > record.expires){
  delete otpStore[email];
  return res.json({status:"fail", msg:"OTP expired"});
}

// ❌ ATTEMPTS LIMIT
if(record.attempts >= 3){
  delete otpStore[email];
  return res.json({status:"fail", msg:"Too many attempts"});
}

// MATCH CHECK
if(String(record.otp) === String(enteredOtp)){

  db.query("SELECT * FROM users WHERE email=?", [email], (err,result)=>{

    if(result.length>0){
      res.json({status:"success", user:result[0]});
    }else{
      db.query(
        "INSERT INTO users (name,email,password) VALUES (?,?,?)",
        ["User", email, ""],
        ()=>{
          res.json({
            status:"success",
            user:{name:"User", email}
          });
        }
      );
    }

  });

  delete otpStore[email];

}else{

  record.attempts++;

  res.json({status:"fail", msg:"Wrong OTP"});
}

});
app.get("/my-orders/:email",(req,res)=>{

  const email = req.params.email;

  db.query(
    "SELECT * FROM orders WHERE email=? ORDER BY id DESC",
    [email],
    (err,result)=>{
      if(err) return res.send(err);
      res.json(result);
    }
  );

});

app.put("/save-name", (req,res)=>{

const {name,email} = req.body;

db.query(
"UPDATE users SET name=? WHERE email=?",
[name,email],
(err)=>{
if(err) return res.send(err);
res.send("Saved");
}
);

});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running 🚀"));
