const express = require('express');
const axios = require('axios');
const app = express();

const FB_APP_ID = process.env.FB_APP_ID;
const FB_APP_SECRET = process.env.FB_APP_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://your-domain.vercel.app/auth/facebook/callback';

// 1. الصفحة الرئيسية
app.get('/', (req, res) => {
  res.send('This is the authentication endpoint. It is reached by the game client, not by browsers directly.');
});

// 2. صفحة سياسة الخصوصية (/privacy)
app.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Privacy Policy</title>
      <style>
        body { background-color: #0f0f0f; color: #cccccc; font-family: sans-serif; padding: 24px; max-width: 600px; margin: auto; }
        h1 { color: #ffffff; font-size: 28px; }
        h2 { color: #d9531e; font-size: 14px; letter-spacing: 1px; margin-top: 24px; text-transform: uppercase; }
        p, li { font-size: 14px; line-height: 1.5; color: #a0a0a0; }
        ul { padding-left: 20px; }
        a { color: #a0a0a0; text-decoration: none; }
      </style>
    </head>
    <body>
      <h1>Privacy Policy</h1>
      
      <h2>WHAT WE COLLECT</h2>
      <p>When you sign in with Facebook we receive and store:</p>
      <ul>
        <li>Your Facebook user id.</li>
        <li>Your Facebook name.</li>
        <li>Your Facebook email address, if you have granted the email scope.</li>
        <li>The IP address that initiated the sign-in.</li>
      </ul>

      <h2>HOW WE USE IT</h2>
      <p>Your data is used to identify your account, to authenticate you when you return, and to protect the service from abuse.</p>

      <h2>FACEBOOK TOKENS</h2>
      <p>The service does not persist Facebook access tokens. Facebook tokens are used once during sign-in to fetch your profile and are then discarded.</p>

      <h2>COOKIES</h2>
      <p>The sign-in flow does not set any authentication cookies. The game client uses a bearer token returned in the redirect fragment.</p>

      <h2>RETENTION</h2>
      <p>Account records are retained for as long as your account exists.</p>

      <h2>CONTACT</h2>
      <p>For privacy questions, contact the service operator.</p>

      <br><p><a href="/">← Back</a></p>
    </body>
    </html>
  `);
});

// 3. صفحة شروط الخدمة (/terms)
app.get('/terms', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Terms of Service</title>
      <style>
        body { background-color: #0f0f0f; color: #cccccc; font-family: sans-serif; padding: 24px; max-width: 600px; margin: auto; }
        h1 { color: #ffffff; font-size: 28px; }
        h2 { color: #d9531e; font-size: 14px; letter-spacing: 1px; margin-top: 24px; text-transform: uppercase; }
        p { font-size: 14px; line-height: 1.5; color: #a0a0a0; }
        a { color: #a0a0a0; text-decoration: none; }
      </style>
    </head>
    <body>
      <h1>Terms of Service</h1>

      <h2>1. ACCEPTANCE</h2>
      <p>By using this service you agree to these terms. If you do not agree, do not use the service.</p>

      <h2>2. NATURE OF THE SERVICE</h2>
      <p>The service is provided as-is for educational and community purposes. Availability, features, and data are not guaranteed and may change at any time.</p>

      <h2>3. FACEBOOK AUTHENTICATION</h2>
      <p>Sign-in relies on Facebook OAuth. By signing in you allow this service to store your Facebook user id, name, and email so an account can be provisioned.</p>

      <h2>4. PROHIBITED USE</h2>
      <p>Do not attempt to bypass authentication, abuse the service, or use it for any illegal purpose.</p>

      <br><p><a href="/">← Back</a></p>
    </body>
    </html>
  `);
});

// 4. مسار توجيه تسجيل الدخول إلى فيسبوك
app.get('/auth/facebook', (req, res) => {
  const fbAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=email,public_profile`;
  res.redirect(fbAuthUrl);
});

// 5. استقبال الـ Callback واستبدال الـ Code بـ Token
app.get('/auth/facebook/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code provided.');

  try {
    const tokenRes = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: { client_id: FB_APP_ID, client_secret: FB_APP_SECRET, redirect_uri: REDIRECT_URI, code }
    });

    const userRes = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: { fields: 'id,name,email', access_token: tokenRes.data.access_token }
    });

    res.json({ status: 'success', user: userRes.data });
  } catch (err) {
    res.status(500).json({ error: 'Auth failed', details: err.response?.data || err.message });
  }
});

module.exports = app;
