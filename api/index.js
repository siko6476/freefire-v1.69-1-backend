const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   CONFIG
========================= */

const BASE_URL = "https://gconectn10.vercel.app";

const FB_APP_ID = process.env.FB_APP_ID;
const FB_APP_SECRET = process.env.FB_APP_SECRET;

const REDIRECT_URI =
  process.env.REDIRECT_URI ||
  `${BASE_URL}/auth/facebook/callback`;

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
   HOME
========================= */

app.get("/", (req, res) => {
  res.status(200).json({
    status: "online",
    message: "Configuration Server is active"
  });
});

/* =========================
   HEALTH
========================= */

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

/* =========================
   PRIVACY POLICY
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

<p>
This is an independent community project.
It is not affiliated with Garena or Free Fire.
</p>

<h2>What we collect</h2>

<p>
When you sign in with Facebook, the service may receive:
</p>

<ul>
<li>Your Facebook user ID.</li>
<li>Your Facebook name.</li>
<li>Your Facebook email address, if permission is granted.</li>
</ul>

<h2>How we use it</h2>

<p>
Your information is used to authenticate your Facebook account
and provide access to the service.
</p>

<h2>Facebook tokens</h2>

<p>
Facebook access tokens are used during authentication.
The service does not permanently store Facebook access tokens.
</p>

<h2>Contact</h2>

<p>
For privacy questions, contact the service operator.
</p>

<p>
<a href="/">Back</a>
</p>

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

<p>
This is an independent community project.
It is not affiliated with Garena or Free Fire.
</p>

<p>
This service is provided as-is.
</p>

<p>
<a href="/">Back</a>
</p>

</body>
</html>
`);
});

/* =========================
   FACEBOOK LOGIN
========================= */

app.get("/auth/facebook", (req, res) => {

  if (!FB_APP_ID) {
    return res.status(500).json({
      status: "error",
      message: "FB_APP_ID is not configured"
    });
  }

  const params = new URLSearchParams({
    client_id: FB_APP_ID,
    redirect_uri: REDIRECT_URI,
    scope: "email,public_profile",
    response_type: "code"
  });

  const facebookUrl =
    "https://www.facebook.com/v18.0/dialog/oauth?" +
    params.toString();

  console.log("FACEBOOK REDIRECT:", facebookUrl.replace(
    /client_id=[^&]+/,
    "client_id=HIDDEN"
  ));

  return res.redirect(facebookUrl);
});

/* =========================
   FACEBOOK CALLBACK
========================= */

app.get("/auth/facebook/callback", async (req, res) => {

  const code = req.query.code;

  const fbError = req.query.error;
  const fbErrorDescription =
    req.query.error_description;

  /* Facebook returned an error */

  if (fbError) {

    console.error("FACEBOOK OAUTH ERROR:", {
      error: fbError,
      description: fbErrorDescription
    });

    return res.status(400).json({
      status: "error",
      message: "Facebook OAuth error",
      error: fbError,
      description: fbErrorDescription || null
    });
  }

  /* No authorization code */

  if (!code) {
    return res.status(400).json({
      status: "error",
      message: "No Facebook authorization code"
    });
  }

  /* Check environment variables */

  if (!FB_APP_ID || !FB_APP_SECRET) {
    return res.status(500).json({
      status: "error",
      message: "Facebook environment variables are missing"
    });
  }

  try {

    /* =========================
       GET ACCESS TOKEN
    ========================= */

    const tokenRes = await axios.get(
      "https://graph.facebook.com/v18.0/oauth/access_token",
      {
        params: {
          client_id: FB_APP_ID,
          client_secret: FB_APP_SECRET,
          redirect_uri: REDIRECT_URI,
          code: code
        },
        timeout: 10000
      }
    );

    const accessToken =
      tokenRes.data.access_token;

    if (!accessToken) {
      console.error(
        "FACEBOOK TOKEN RESPONSE:",
        tokenRes.data
      );

      return res.status(500).json({
        status: "error",
        message: "Facebook access token was not returned"
      });
    }

    /* =========================
       GET FACEBOOK USER
    ========================= */

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

    /* =========================
       SUCCESS
    ========================= */

    return res.status(200).json({
      status: "success",
      user: userRes.data
    });

  } catch (err) {

    console.error(
      "FACEBOOK ERROR:",
      err.response?.data || err.message
    );

    return res.status(500).json({
      status: "error",
      message: "Facebook authentication failed"
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
    server_open: true
  });
});

/* =========================
   VERSION / CONFIGURATION
========================= */

app.get("/live/ver.php", (req, res) => {

  console.log("VERSION CHECK:", req.query);

  return res.status(200).json({

    appstore_url: "",

    billboard_msg: "",

    cdn_url:
      `${BASE_URL}/cdn/`,

    code: 0,

    country_code:
      req.query.region || "DZ",

    force_to_restart_app: false,

    gdpr_version: 1,

    is_firewall_open: false,

    is_review_server: false,

    is_server_open: true,

    maintenance_announcement: "",

    maintenance_region: "",

    remote_option_version:
      "project-options:1",

    remote_version:
      req.query.version || "1.69.1",

    server_url:
      `${BASE_URL}/`,

    request: {
      version: req.query.version || null,
      lang: req.query.lang || null,
      device: req.query.device || null,
      channel: req.query.channel || null,
      appstore: req.query.appstore || null,
      region: req.query.region || null
    }

  });
});

/* =========================
   404
========================= */

app.use((req, res) => {

  console.log(
    "UNKNOWN ROUTE:",
    req.method,
    req.path
  );

  return res.status(404).json({
    status: "not_found",
    path: req.path
  });
});

/* =========================
   VERCEL
========================= */

module.exports = app;
