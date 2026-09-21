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
  <li>Your Facebook email address, if you have granted the email permission.</li>
</ul>

<h2>How we use it</h2>

<p>
Your information is used to authenticate your Facebook account
and provide access to the service.
</p>

<p>
We do not sell, share, or trade your personal information with third parties.
</p>

<h2>Facebook tokens</h2>

<p>
Facebook access tokens are used during the authentication process
to retrieve the information required for sign-in.
The service does not permanently store Facebook access tokens.
</p>

<h2>Cookies</h2>

<p>
The Facebook sign-in flow does not use authentication cookies.
</p>

<h2>Retention</h2>

<p>
Information received during authentication is used only for the purposes
described in this Privacy Policy.
Contact the service operator if you wish to request deletion of your information.
</p>

<h2>Contact</h2>

<p>
For privacy questions, contact the service operator.
</p>

<p>
<a href="/">← Back</a>
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
<a href="/">← Back</a>
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
    server_open: true
  });
});

/* =========================
   VERSION / CONFIGURATION
========================= */

app.get("/live/ver.php", (req, res) => {

  console.log("VERSION CHECK:", req.query);

  res.status(200).json({

    appstore_url:
      "https://example.com/app",

    billboard_msg: "",

    cdn_url:
      "https://version-freefiremobile.vercel.app/cdn/",

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
      "https://version-freefiremobile.vercel.app/",

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

  res.status(404).json({
    status: "not_found",
    path: req.path
  });

});

/* =========================
   VERCEL
========================= */

module.exports = app;
