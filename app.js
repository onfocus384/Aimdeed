// ================= ENV SETUP =================
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const fs =require("fs")
const ejsMate = require("ejs-mate");
const nodemailer = require("nodemailer");
const session = require("express-session");
const MongoStore = require("connect-mongo"); // Missing import
const passport = require("passport");
const LocalStrategy = require("passport-local");
const crypto = require('crypto');
const methodOverride = require("method-override");
const flash = require("connect-flash");
const ExpressError = require("./utils/expresserror.js"); // Make sure this exists
const cors=require("cors")
const bodyParser=require("body-parser")
const path=require("path")
const fileURLToPath=require("url")
const Together=require("together-ai")
const OpenAI=require("openai")
const fetch = require("node-fetch");
const { Configuration, OpenAIApi } = require("openai");
const marked = require("marked");
const QRCode=require("qrcode")
const Payment = require("./models/Payment.js");


const app = express();
const PORT = process.env.PORT || 3000;
const User = require("./models/user.js");
const dbUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/aimdeed";
const SESSION_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-this"; // Missing variable

// ======================
// VIEW ENGINE
// ======================
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ======================
// MIDDLEWARE
// ======================
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method")); // Add method override




// ======================
// SESSION STORE
// ======================
const store = MongoStore.create({
  mongoUrl: dbUrl,
  collectionName: "sessions",
  ttl: 7 * 24 * 60 * 60 // 7 days (seconds)
});

store.on("error", (err) => {
  console.error("Mongo Session Store Error:", err);
});

// ======================
// SESSION CONFIGURATION
// ======================
app.set("trust proxy", 1); // REQUIRED for Render

app.use(
  session({
    name: "aimdeed.sid",
    store: MongoStore.create({
      mongoUrl: dbUrl,
      collectionName: "sessions",
      ttl: 7 * 24 * 60 * 60,
    }),
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // IMPORTANT
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);


app.use(flash());

// ======================
// PASSPORT
// ======================

app.use(passport.initialize());
app.use(passport.session());

// Configure passport
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// ======================
// GLOBAL VARIABLES
// ======================
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user || null;
  next();
});


// ======================
// MONGODB CONNECTION
// ======================
mongoose
  .connect(dbUrl)
  .then(() => console.log(" MongoDB is Connected"))
  .catch((err) => console.log(" MongoDB Error:", err));

// ======================
// AUTH MIDDLEWARE
// ======================
function isLoggedIn(req, res, next) {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please login first!");
    req.session.returnTo = req.originalUrl;
    return res.redirect("/login");
  }
  next();
}

function isLoggedOut(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

// ======================
// EMAIL TRANSPORTER
// ======================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ======================
// HELPER FUNCTIONS
// ======================
const sendResetEmail = async (email, resetToken, req) => {
  const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: `"Aimdeed Support" <${process.env.EMAIL_USERNAME}>`,
    to: email,
    subject: "Password Reset Request - Aimdeed",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>You requested to reset your password for your Aimdeed account.</p>
        <p>Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetURL}" style="background-color: #0d6efd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">
          ${resetURL}
        </p>
        <p>This link will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #6c757d; font-size: 12px;">
          This is an automated message from Aimdeed - NEET & JEE Preparation Platform
        </p>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

// ======================
// ROUTES
// ======================

// Home
app.get("/", (req, res) => {
  res.render("index", {
    title: "Aimdeed | Home",
    description: "NEET & JEE preparation platform by Aimdeed",
  });
});

// Mentor (Protected)
app.get("/mentor", (req, res) => {
  res.render("listings/mentor", { title: "Mentor Form" });
});


// payments page
// Payment page – show plans
app.get("/payment",(req, res) => {
  try {
    const allowedAmounts = [499, 799, 999];

    res.render("users/payment", {
      allowedAmounts
    });
  } catch (error) {
    console.error("Payment page error:", error);
    res.status(500).send("Server error");
  }
});


// Generate QR for selected amount
app.post("/payment/generate-qr", async (req, res) => {
  try {
    const { amount } = req.body;
    const allowedAmounts = [499, 799, 999];

    if (!allowedAmounts.includes(Number(amount))) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const upiId = process.env.UPI_ID ;
    const merchantName = "Samprit Saha";

    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
      merchantName
    )}&am=${amount}&cu=INR`;

    const qrImage = await QRCode.toDataURL(upiLink);

    res.json({
      success: true,
      qrImage
    });

  } catch (error) {
    console.error("QR generation error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Confirm payment after user submits UTR
app.post("/payment/confirm", async (req, res) => {
  try {
    const { amount, utr, payerName } = req.body;

    if (!req.session.user) {
      return res.redirect("/login");
    }

    const payment = new Payment({
      userId: req.session.user._id,
      payerName,
      amount,
      utrId: utr,
      transactionId: "AD" + Date.now(),
      status: "PENDING"
    });

    await payment.save();

    res.render("users/payment-success", {
      title: "Payment Submitted",
      amount,
      transactionId: utr
    });

  } catch (error) {
    // 🔴 Duplicate UTR
    if (error.code === 11000) {
      return res.status(400).render("users/payment-error", {
        message: "This Transaction ID has already been used."
      });
    }

    console.error("Payment confirm error:", error);
    res.status(500).send("Payment failed");
  }
});





// ======================
// AUTH ROUTES
// ======================

// Signup - GET
app.get("/signup", isLoggedOut, (req, res) => {
  res.render("users/signup", { title: "Sign Up" });
});

// Signup - POST (Redirects to login page after successful signup)
// Signup - POST (Updated with detailed logging)
app.post("/signup", isLoggedOut, async (req, res) => {
  console.log("=== SIGNUP PROCESS STARTED ===");
  console.log("Request body:", req.body);
  
  try {
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      console.log("Validation failed: Missing fields");
      req.flash("error", "All fields are required!");
      return res.redirect("/signup");
    }
    
    console.log("Checking for existing user...");
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { username: username.trim() }, 
        { email: email.toLowerCase().trim() }
      ] 
    });
    
    if (existingUser) {
      console.log("User already exists:", existingUser.username);
      const errorMsg = existingUser.username === username.trim() 
        ? "Username already taken!" 
        : "Email already registered!";
      req.flash("error", errorMsg);
      return res.redirect("/signup");
    }
    
    console.log("Creating new user object...");
    // Create new user object
    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase().trim()
    });
    
    console.log("Attempting User.register...");
    // Register user using callback
    User.register(newUser, password, (err, registeredUser) => {
      if (err) {
        console.error("❌ Registration error:", err);
        console.error("Error name:", err.name);
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
        
        let errorMessage = "Signup failed! ";
        if (err.name === 'UserExistsError') {
          errorMessage = "Username already exists!";
        } else if (err.message && err.message.includes('duplicate')) {
          errorMessage = "Username or email already registered!";
        } else {
          errorMessage += err.message;
        }
        
        req.flash("error", errorMessage);
        return res.redirect("/signup");
      }
      
      console.log(" User registered successfully:", registeredUser._id);
      console.log("Username:", registeredUser.username);
      console.log("Email:", registeredUser.email);
      
      // SUCCESS: Redirect to login page with success message
      req.flash("success", "Account created successfully! Please login.");
      console.log("Redirecting to /login...");
      return res.redirect("/login");
    });
    
  } catch (err) {
    console.error(" Unexpected signup error:", err);
    console.error("Error stack:", err.stack);
    req.flash("error", "An unexpected error occurred. Please try again.");
    res.redirect("/signup");
  }
});





// Login - GET
app.get("/login", isLoggedOut, (req, res) => {
  res.render("users/login", { title: "Login" });
});

// Login - POST
// Login - POST with debugging
app.post(
  "/login",
  isLoggedOut,
  (req, res, next) => {
    console.log("🔐 Login attempt for:", req.body.username);
    next();
  },
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true // This will pass the error message from passport
  }),
  (req, res) => {
    console.log("✅ Login successful!");
    console.log("User:", req.user.username);
    console.log("User ID:", req.user._id);
    
    // Set success message
    req.flash("success", `Welcome back, ${req.user.username}!`);
    
    // Redirect to homepage
    res.redirect("/");
  }
);






// Forgot Password - GET
app.get("/forgot-password", isLoggedOut, (req, res) => {
  res.render("users/forgot", { title: "Forgot Password" });
});

// Forgot Password - POST (Add this right after the GET route)
app.post("/forgot-password", isLoggedOut, async (req, res) => {
  console.log("🔐 Forgot password form submitted");
  console.log("Email:", req.body.email);
  
  try {
    const { email } = req.body;
    
    if (!email) {
      req.flash("error", "Please enter your email address.");
      return res.redirect("/forgot-password");
    }
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    // Show same message whether user exists or not (for security)
    if (!user) {
      console.log("No user found with email:", email);
      req.flash("success", "If an account exists with this email, a reset link will be sent.");
      return res.redirect("/login");
    }
    
    console.log("User found:", user.username);
    
    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    
    // Create reset URL
    const resetURL = `http://localhost:3000/reset-password/${resetToken}`;
    console.log("Reset URL:", resetURL);
    
    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    
    const mailOptions = {
      from: `"Aimdeed Support" <${process.env.EMAIL_USERNAME}>`,
      to: user.email,
      subject: "Password Reset Link - Aimdeed",
      text: `Click this link to reset your password: ${resetURL}`,
      html: `
        <h3>Password Reset Request</h3>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetURL}">${resetURL}</a></p>
        <p>This link expires in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log("✅ Reset email sent to:", user.email);
    
    req.flash("success", "Password reset link sent to your email!");
    res.redirect("/login");
    
  } catch (error) {
    console.error("❌ Error sending reset email:", error);
    req.flash("error", "Could not send reset email. Please try again.");
    res.redirect("/forgot-password");
  }
});



// Reset Password - GET (show reset form)
app.get("/reset-password/:token", isLoggedOut, async (req, res) => {
  console.log("Reset password token received:", req.params.token);
  
  try {
    const { token } = req.params;
    
    if (!token) {
      req.flash("error", "Invalid reset link.");
      return res.redirect("/forgot-password");
    }
    
    // For now, just show the form with the token
    // We'll validate the token when the form is submitted
    res.render("users/reset-password", { 
      title: "Reset Password",
      token: token 
    });
    
  } catch (error) {
    console.error("Reset password error:", error);
    req.flash("error", "Invalid or expired reset link.");
    res.redirect("/forgot-password");
  }
});

// Reset Password - POST (process reset)
// Reset Password - POST (WORKING VERSION)
app.post("/reset-password/:token", isLoggedOut, async (req, res) => {
  console.log(" RESET PASSWORD PROCESS STARTED");
  console.log("Token from URL:", req.params.token);
  
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    
    // 1. Validate passwords
    if (!password || !confirmPassword) {
      req.flash("error", "Please fill in all fields.");
      return res.redirect(`/reset-password/${token}`);
    }
    
    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match.");
      return res.redirect(`/reset-password/${token}`);
    }
    
    if (password.length < 6) {
      req.flash("error", "Password must be at least 6 characters.");
      return res.redirect(`/reset-password/${token}`);
    }
    
    console.log(" Password validation passed");
    
    // 2. Hash the token to compare with database
    const crypto = require('crypto');
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    console.log("Hashed token:", hashedToken);
    console.log("Looking for user with this token...");
    
    // 3. Find user with valid, non-expired token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() } // Check if not expired
    });
    
    if (!user) {
      console.log(" No user found with valid token");
      console.log("Current time:", new Date());
      console.log("Token in DB:", hashedToken);
      req.flash("error", "Password reset link is invalid or has expired.");
      return res.redirect("/forgot-password");
    }
    
    console.log(" User found:", user.username);
    console.log("User email:", user.email);
    console.log("Token expires:", new Date(user.resetPasswordExpires));
    
    // 4. UPDATE THE PASSWORD - CORRECT WAY
    console.log("Updating password for user:", user.username);
    
    // Method 1: Using setPassword (passport-local-mongoose method)
    return new Promise((resolve, reject) => {
      user.setPassword(password, async (err) => {
        if (err) {
          console.error("❌ Error in setPassword:", err);
          req.flash("error", "Error updating password.");
          return res.redirect(`/reset-password/${token}`);
        }
        
        console.log("✅ Password set successfully");
        
        // 5. CLEAR THE RESET TOKEN (IMPORTANT!)
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        
        console.log("Reset token cleared");
        
        // 6. Save the user
        try {
          await user.save();
          console.log("✅ User saved successfully with new password");
          console.log("User ID:", user._id);
          
          // 7. Success - redirect to login
          req.flash("success", "Password updated successfully! You can now login with your new password.");
          return res.redirect("/login");
          
        } catch (saveError) {
          console.error("❌ Error saving user:", saveError);
          req.flash("error", "Error saving new password.");
          return res.redirect(`/reset-password/${token}`);
        }
      });
    });
    
  } catch (error) {
    console.error("❌ RESET PASSWORD ERROR:", error);
    console.error("Error stack:", error.stack);
    req.flash("error", "Something went wrong. Please try again.");
    res.redirect(`/reset-password/${req.params.token}`);
  }
});



// Debug route to check user state
app.get("/debug-user/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    
    if (!user) {
      return res.json({ error: "User not found" });
    }
    
    res.json({
      username: user.username,
      email: user.email,
      hasPassword: !!user.hash,
      hasSalt: !!user.salt,
      resetTokenExists: !!user.resetPasswordToken,
      resetToken: user.resetPasswordToken,
      resetExpires: user.resetPasswordExpires,
      isTokenExpired: user.resetPasswordExpires < Date.now(),
      currentTime: new Date(),
      tokenExpiryTime: new Date(user.resetPasswordExpires)
    });
    
  } catch (error) {
    res.json({ error: error.message });
  }
});

// In your app.js or routes file
app.get("/studies", (req, res) => {
    // This redirects to /listings/index2
    return res.redirect("/listings/index2");
});

// Make sure you have this route too
app.get("/listings/index2", (req, res) => {
    // Render the actual EJS file
    res.render("listings/index2", { 
        currentUser: req.user,
        pageTitle: "AimDeed Studies"
    });
});





// for rank predictor 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Redirect predictor route
app.get("/predictor", (req, res) => {
  res.redirect("/listings/college");
});

// Render college predictor page
app.get("/listings/college", (req, res) => {
  res.render("listings/college", {
    currentUser: req.user,
    pageTitle: "Predict your rank",
  });
});

/* ===========================
   JOSAA DATA API
=========================== */

const dataPath = path.join(__dirname, "josaa_data.json");

/**
 * GET: Fetch JOSAA college data
 * URL: /api/josaa
 */
app.get("/api/josaa", (req, res) => {
  try {
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: "JOSAA data file not found" });
    }

    const rawData = fs.readFileSync(dataPath, "utf-8");
    const jsonData = JSON.parse(rawData);

    res.status(200).json(jsonData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load JOSAA data" });
  }
});

/**
 * PUT: Update JOSAA data (ADMIN ONLY – recommended)
 * URL: /api/josaa
 */
app.put("/api/josaa", async (req, res) => {
  try {
    const newData = req.body;

    if (!Array.isArray(newData)) {
      return res.status(400).json({
        error: "Invalid data format. Expected an array.",
      });
    }

    fs.writeFileSync(dataPath, JSON.stringify(newData, null, 2));
    res.status(200).json({
      message: "JOSAA data updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to update JOSAA data",
    });
  }
});





// for mentor form 
// Redirect /mentor → mentor form page
app.get("/mentor", (req, res) => {
  return res.redirect("/listings/mentor");
});

// Render mentor form page
app.get("/listings/mentor", (req, res) => {
  res.render("listings/mentor", {
    currentUser: req.user,
    pageTitle: "Mentor Form",
  });
});







// chatbot 
app.use(
  cors({
    origin: [
      "https://www.aimdeed.in",
      "http://localhost:3000",
      "http://localhost:5000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// serve ONLY public assets (safe)
app.use(express.static(path.join(__dirname, "public")));

// ================= AUTH ROUTES =================
app.get("/chatbot", (req, res) => {
  res.redirect("/listings/chatbot");
});

app.get("/listings/chatbot", (req, res) => {
  res.render("listings/chatbot", {
    currentUser: req.user,
    pageTitle: "Chatbot",
  });
});


// ================== CHAT API ==================
 // Using OpenAI v4+
   const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://www.aimdeed.in", // required by OpenRouter
    "X-Title": "Aimdeed Chatbot",             // any name
  },
});
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // OR mistralai, llama, etc
      messages: [{ role: "user", content: userMessage }],
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("Chat Error:", err.message);
    res.status(500).json({ reply: "AI error. Try again." });
  }
});



// class notes 
app.get("/student", (req, res) => {
  res.redirect("/listings/student");
});

app.get("/listings/student",(req, res) => {
  res.render("listings/student", {
    currentUser: req.user,
    pageTitle: "student notes",
  });
});




// Test email configuration
app.get("/test-email", async (req, res) => {
  console.log("Testing email configuration...");
  
  try {
    if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
      return res.send(`
        <h2>Email Configuration Missing</h2>
        <p>Please add to .env file:</p>
        <pre>
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
        </pre>
      `);
    }
    
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    
    await transporter.verify();
    console.log("Email server connected!");
    
    const info = await transporter.sendMail({
      from: `"Aimdeed Test" <${process.env.EMAIL_USERNAME}>`,
      to: process.env.EMAIL_USERNAME,
      subject: "Test Email from Aimdeed",
      text: "This is a test email. If you receive this, email is working!",
    });
    
    console.log(" Test email sent!");
    
    res.send(`
      <h2>Email Test Successful!</h2>
      <p>Check your email: <strong>${process.env.EMAIL_USERNAME}</strong></p>
      <p>Check spam folder if you don't see it.</p>
      <a href="/forgot-password">Test Forgot Password</a>
    `);
    
  } catch (error) {
    console.error(" Email test failed:", error.message);
    
    res.send(`
      <h2> Email Test Failed</h2>
      <p>Error: ${error.message}</p>
      <p><strong>Solution:</strong></p>
      <ol>
        <li>Go to <a href="https://myaccount.google.com/security" target="_blank">Google Account Security</a></li>
        <li>Enable 2-Step Verification</li>
        <li>Generate an "App Password" for Mail</li>
        <li>Use that 16-character password in .env file</li>
      </ol>
    `);
  }
});














// Logout
// Logout - Correct version
app.get("/logout", (req, res, next) => {
  console.log("=== LOGOUT PROCESS ===");
  
  // Store flash message BEFORE destroying session
  const flashMessage = "Logged out successfully!";
  
  // Store username for logging
  const username = req.user ? req.user.username : "User";
  
  // Logout from passport
  req.logout((err) => {
    if (err) {
      console.error("Passport logout error:", err);
      return next(err);
    }
    
    console.log(`User "${username}" logged out from passport`);
    
    // Set the flash message in session before destroying it
    req.session.flash = {
      success: [flashMessage]
    };
    
    // Save the session with flash message
    req.session.save((saveErr) => {
      if (saveErr) {
        console.error("Session save error:", saveErr);
        return next(saveErr);
      }
      
      // Now destroy the session
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Session destroy error:", destroyErr);
          // Continue anyway
        }
        
        // Clear the cookie
        res.clearCookie("connect.sid", { path: '/' });
        
        console.log(" Session destroyed and cookie cleared");
        
        // Redirect to home
        res.redirect("/");
      });
    });
  });
});


// ======================
// CONTACT FORM
// ======================
app.post("/contact", isLoggedIn, async (req, res) => {
  const { name, email, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "All fields are required."
    });
  }

  try {
    await transporter.sendMail({
      from: `"Aimdeed Contact" <${process.env.EMAIL_USERNAME}>`,
      to: "onfocus384@gmail.com",
      subject: "Contact Form Submission",
      html: `
        <h3>New Message from Aimdeed</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b> ${message}</p>
      `,
    });

    res.json({
      success: true,
      message: "Thank you! We have received your message.",
    });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({
      success: false,
      message: "Message received, but email failed to send.",
    });
  }
});

// ================= 404 HANDLER ===============
app.use((req, res, next) => {
  // Create an ExpressError instance or use a regular error
  const error = new Error("Page Not Found");
  error.statusCode = 404;
  next(error);
});

// ================= ERROR HANDLER ==============
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  const { statusCode = 500, message = "Something went wrong!" } = err;
  
  // If error view doesn't exist, use simple HTML
  try {
    res.status(statusCode).render("error", { 
      title: `${statusCode} - Error`,
      message 
    });
  } catch (renderErr) {
    // Fallback to simple HTML response
    res.status(statusCode).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${statusCode} - Error</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          body { padding-top: 5rem; background-color: #f8f9fa; }
          .error-container { max-width: 600px; margin: 0 auto; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error-container card shadow p-4">
            <div class="card-body">
              <h1 class="text-danger mb-4">${statusCode} - Error</h1>
              <p class="lead">${message}</p>
              <a href="/" class="btn btn-primary mt-3">Go Home</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
  }
});












// ======================
// SERVER START
// ======================
app.listen(PORT, () => {
  console.log(` Server is running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
});