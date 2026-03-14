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
const MongoStore = require("connect-mongo");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const crypto = require('crypto');
const methodOverride = require("method-override");
const flash = require("connect-flash");
const cors=require("cors")
const path=require("path")
const OpenAI=require("openai")
const QRCode=require("qrcode")
const Payment = require("./models/Payment.js");
const compression = require("compression");


const app = express();
const PORT = process.env.PORT || 3000;
const User = require("./models/user.js");
const dbUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/aimdeed";
const SESSION_SECRET = process.env.SESSION_SECRET;

// ======================
// VIEW ENGINE
// ======================
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ======================
// MIDDLEWARE
// ======================

// Redirect everything to primary domain (aimdeed.in)
app.use((req, res, next) => {
  const host = req.headers.host;
  
  if (host === "www.aimdeed.in" || host === "aimdeed.com" || host === "www.aimdeed.com") {
    console.log(`📡 Redirecting from ${host} to aimdeed.in`);
    return res.redirect(301, "https://aimdeed.in" + req.url);
  }
  
  next();
});

// Compress all HTTP responses for faster page load
app.use(compression());

// Cache static files (CSS, JS, images) aggressively for 1 year in production
const staticOptions = {
  maxAge: process.env.NODE_ENV === "production" ? "1y" : "0"
};
app.use(express.static(path.join(__dirname, "public"), staticOptions));
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
    secret: SESSION_SECRET || "change-this-in-production",
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

// Google Strategy Configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === "production" 
        ? "https://www.aimdeed.in/auth/google/callback" 
        : "http://localhost:3000/auth/google/callback",
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("📨 Google Auth Callback received for:", profile.emails[0].value);
        
        // Find user by googleId
        let user = await User.findOne({ googleId: profile.id });
        
        if (!user) {
          console.log("ℹ️ No user found with googleId, checking email...");
          // Check if user already exists with this email
          user = await User.findOne({ email: profile.emails[0].value });
          
          if (user) {
            console.log("🔗 Linking existing email account to Google ID");
            // Update existing user with googleId
            user.googleId = profile.id;
            user.displayName = profile.displayName;
            await user.save();
          } else {
            console.log("✨ Creating new user from Google profile");
            // Create a new user
            user = new User({
              googleId: profile.id,
              username: profile.emails[0].value.split("@")[0] + "_" + Math.floor(Math.random() * 1000),
              email: profile.emails[0].value,
              displayName: profile.displayName
            });
            await user.save();
          }
        }
        console.log("✅ Google Auth Successful for:", user.email);
        return done(null, user);
      } catch (err) {
        console.error("❌ Google Strategy Error:", err);
        return done(err, null);
      }
    }
  )
);

// Switch to ID-based serialization to support both social and local users
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});


// ======================
// GLOBAL VARIABLES
// ======================
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user || null;
  res.locals.currentHost = req.get('host') || 'www.aimdeed.in';
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
  console.log("🔍 Checking isLoggedIn. Authenticated:", req.isAuthenticated());
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

const fromAddress = process.env.EMAIL_FROM
  ? `"Aimdeed Support" <${process.env.EMAIL_FROM}>`
  : `"Aimdeed Support" <${process.env.EMAIL_USERNAME}>`;

// ======================
// ROUTES
// ======================

// Home
app.get("/", (req, res) => {
  res.render("index", {
    title: "Aimdeed | Best NEET & JEE Preparation Platform",
    description: "Aimdeed provides premium NEET & JEE preparation with expert mentorship, comprehensive study materials, and a proven success roadmap.",
  });
});

// Mentor (Public)
app.get("/mentor", (req, res) => {
  res.redirect("/listings/mentor");
});

// Health Check
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

// Privacy Policy
app.get("/privacy", (req, res) => {
  res.render("privacy", { title: "Privacy Policy | Aimdeed" });
});

// Terms of Service
app.get("/terms", (req, res) => {
  res.render("terms", { title: "Terms of Service | Aimdeed" });
});

// Cookies Policy
app.get("/cookies", (req, res) => {
  res.render("cookies", { title: "Cookies Policy | Aimdeed" });
});


// payments page
// Payment page – show plans
app.get("/payment", isLoggedIn, (req, res) => {
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
app.post("/payment/generate-qr", isLoggedIn, async (req, res) => {
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
app.post("/payment/confirm", isLoggedIn, async (req, res) => {
  try {
    const { amount, utr, payerName } = req.body;

    const payment = new Payment({
      userId: req.user._id,
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
    
    // Redirect to homepage or returnTo URL
    const redirectUrl = req.session.returnTo || "/";
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  }
);






// ======================
// GOOGLE AUTH ROUTES
// ======================
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", failureFlash: true }),
  (req, res) => {
    req.flash("success", `Welcome, ${req.user.displayName || req.user.username}!`);
    const redirectUrl = req.session.returnTo || "/";
    delete req.session.returnTo;
    res.redirect(redirectUrl);
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
    const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    console.log("Reset URL:", resetURL);
    
    const mailOptions = {
      from: fromAddress,
      to: user.email,
      subject: "🔒 Password Reset Request — Aimdeed",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e2a4a,#0f172a);border-radius:16px;border:1px solid rgba(99,102,241,0.3);overflow:hidden;max-width:600px;">
                  <tr>
                    <td style="background:linear-gradient(135deg,#4f46e5,#0ea5e9);padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;">Aimdeed</h1>
                      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Security Center</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px;">
                      <p style="color:#94a3b8;font-size:15px;">Hello <strong style="color:#e2e8f0;">${user.username}</strong>,</p>
                      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;">
                        We received a request to reset the password for your account. Click the button below to choose a new password.
                      </p>
                      <div style="text-align:center;margin:32px 0;">
                        <a href="${resetURL}" style="background:#4f46e5;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:12px;font-weight:bold;display:inline-block;box-shadow:0 10px 15px -3px rgba(79,70,229,0.3);">
                          Reset My Password
                        </a>
                      </div>
                      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin-bottom:32px;">
                        This link will expire in <strong style="color:#cbd5e1;">10 minutes</strong>. If you did not request this, you can safely ignore this email.
                      </p>
                      <hr style="border:none;border-top:1px solid rgba(99,102,241,0.25);margin:0 0 24px;">
                      <p style="color:#64748b;font-size:12px;word-break:break-all;">
                        Trouble clicking the button? Paste this into your browser:<br>
                        <a href="${resetURL}" style="color:#38bdf8;">${resetURL}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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
app.get("/studies", isLoggedIn, (req, res) => {
    // This redirects to /listings/index2
    return res.redirect("/listings/index2");
});

// Make sure you have this route too
app.get("/listings/index2", isLoggedIn, (req, res) => {
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
app.get("/predictor", isLoggedIn, (req, res) => {
  res.redirect("/listings/college");
});

// Render college predictor page
app.get("/listings/college", isLoggedIn, (req, res) => {
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
// (Simplified duplicate)
// app.get("/mentor", isLoggedIn, (req, res) => {
//   return res.redirect("/listings/mentor");
// });

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

// ================= AUTH ROUTES =================
app.get("/chatbot", isLoggedIn, (req, res) => {
  res.redirect("/listings/chatbot");
});

app.get("/listings/chatbot", isLoggedIn, (req, res) => {
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
app.post("/chat", isLoggedIn, async (req, res) => {
  try {
    const userMessage = req.body.message;

    const completion = await openai.chat.completions.create({
      model: process.env.MODEL || "gpt-4o-mini", // Use env var or dynamic fallback
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
app.get("/student", isLoggedIn, (req, res) => {
  res.redirect("/listings/student");
});

app.get("/listings/student", isLoggedIn, (req, res) => {
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
        res.clearCookie("aimdeed.sid", { path: '/' });
        
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
app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "All fields are required."
    });
  }

  try {
    // 1. INTERNAL NOTIFICATION — sent to Aimdeed team
    await transporter.sendMail({
      from: fromAddress,
      to: "onfocus384@gmail.com",
      subject: `📩 New Contact: ${name}`,
      html: `
        <h3>New Contact Form Submission — Aimdeed</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b><br>${message}</p>
      `,
    });

    // 2. CONFIRMATION EMAIL — sent back to the user
    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: "We've Received Your Message — Aimdeed Support",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e2a4a,#0f172a);border-radius:16px;border:1px solid rgba(99,102,241,0.3);overflow:hidden;max-width:600px;">

                  <!-- HEADER -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#4f46e5,#0ea5e9);padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Aimdeed</h1>
                      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">NEET &amp; JEE Preparation Platform</p>
                    </td>
                  </tr>

                  <!-- BODY -->
                  <tr>
                    <td style="padding:40px;">
                      <p style="color:#94a3b8;font-size:15px;margin:0 0 8px;">Hello <strong style="color:#e2e8f0;">${name}</strong>,</p>
                      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 20px;">
                        Thank you for contacting <strong style="color:#818cf8;">Aimdeed</strong>.
                      </p>
                      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 20px;">
                        We have successfully received your message and our team will review it shortly. Whether you reached out to report a problem, ask a question, or share feedback, we appreciate you taking the time to contact us.
                      </p>
                      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 20px;">
                        Our support team will get back to you as soon as possible. Most queries are usually responded to within <strong style="color:#38bdf8;">24–48 hours</strong>.
                      </p>
                      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 32px;">
                        If your issue is urgent or you need to provide additional details, you can reply directly to this email.
                      </p>

                      <!-- DIVIDER -->
                      <hr style="border:none;border-top:1px solid rgba(99,102,241,0.25);margin:0 0 32px;">

                      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 4px;">
                        Thank you for being part of the <strong style="color:#818cf8;">AIMDEED</strong> community.
                      </p>
                    </td>
                  </tr>

                  <!-- FOOTER -->
                  <tr>
                    <td style="background:rgba(0,0,0,0.3);padding:24px 40px;text-align:center;border-top:1px solid rgba(99,102,241,0.2);">
                      <p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;">
                        Best regards,<br>
                        <strong style="color:#94a3b8;">Aimdeed Support Team</strong><br>
                        🌐 <a href="https://aimdeed.in" style="color:#38bdf8;text-decoration:none;">aimdeed.in</a>
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    res.json({
      success: true,
      message: "Thank you! We have received your message. A confirmation email has been sent to you.",
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