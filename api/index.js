const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const FB_APP_ID = process.env.FB_APP_ID;
const FB_APP_SECRET = process.env.FB_APP_SECRET;

const REDIRECT_URI =
  process.env.REDIRECT_URI ||
  "https://version-freefiremobile.vercel.app/auth/facebook/callback";

/* =========================
   REQUEST LOGGER
========================= */

app.use((req, res, next) => {
  console.log("========== REQUEST ==========");
  console.log("METHOD:", req.method);
  console.log("PATH:", req.path);
  console.log("QUERY:", req.query);
  console.log("USER-AGENT:", req.headers["user-agent"]);
  console.log("=============================");

  next();
});

/* =========================
   BASIC ROUTES
========================= */

app.get("/", (req, res) => {
  res.status(200).json({
    status: "online",
    message: "Configuration Server is active"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

/* =========================
   PRIVACY
========================= */

app.get("/privacy", (req, res) => {
  res.type("html").send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Privacy Policy</title>
</head>
<body>
<h1>Privacy Policy</h1>
<p>This service uses Facebook authentication.</p>
<a href="/">Back</a>
</body>
</html>
`);
});

/* =========================
   TERMS
========================= */

app.get("/terms", (req, res) => {
  res.type("html").send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Terms of Service</title>
</head>
<body>
<h1>Terms of Service</h1>
<p>This service is provided as-is.</p>
<a href="/">Back</a>
</body>
</html>
`);
});

/* =========================
   FACEBOOK LOGIN
========================= */

app.get("/auth/facebook", (req, res) => {
  if (!FB_APP_ID) {
    return res.status(500).send("FB_APP_ID is not configured.");
  }

  const params = new URLSearchParams({
    client_id: FB_APP_ID,
    redirect_uri: REDIRECT_URI,
    scope: "email,public_profile"
  });

  res.redirect(
    `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`
  );
});

/* =========================
   FACEBOOK CALLBACK
========================= */

app.get("/auth/facebook/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({
      status: "error",
      message: "No Facebook authorization code."
    });
  }

  if (!FB_APP_ID || !FB_APP_SECRET) {
    return res.status(500).json({
      status: "error",
      message: "Facebook environment variables are missing."
    });
  }

  try {
    const tokenRes = await axios.get(
      "https://graph.facebook.com/v18.0/oauth/access_token",
      {
        params: {
          client_id: FB_APP_ID,
          client_secret: FB_APP_SECRET,
          redirect_uri: REDIRECT_URI,
          code
        },
        timeout: 10000
      }
    );

    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get(
      "https://graph.facebook.com/v18.0/me",
      {
        params: {
          fields: "id,name,email",
          access_token: accessToken
        },
        timeout: 10000
      }
    );

    res.status(200).json({
      status: "success",
      user: userRes.data
    });
  } catch (err) {
    console.error(
      "FACEBOOK ERROR:",
      err.response?.data || err.message
    );

    res.status(500).json({
      status: "error",
      message: "Facebook authentication failed."
    });
  }
});

/* =========================
   LIVE
========================= */

app.get("/live", (req, res) => {
  res.status(200).json({
    status: "online",
    endpoint: "/live",
    timestamp: new Date().toISOString()
  });
});

/* =========================
   VERSION CHECK
========================= */

app.get("/live/ver.php", (req, res) => {
  console.log("VERSION CHECK:", req.query);

  res.status(200).json({
    status: "ok",
    code: 0,

    version: req.query.version || null,
    lang: req.query.lang || null,
    device: req.query.device || null,
    channel: req.query.channel || null,
    appstore: req.query.appstore || null,
    region: req.query.region || null,

    server_open: true,
    maintenance: false,

    timestamp: new Date().toISOString()
  });
});

/* =========================
   404
========================= */

app.use((req, res) => {
  res.status(404).json({
    status: "not_found",
    path: req.path
  });
});

/* =========================
   VERCEL EXPORT
========================= */

module.exports = app;
