module.exports = (req, res) => {
    const path = req.url.split('?')[0];

    // مسار تسجيل الدخول عبر فيسبوك
    if (path === '/auth/facebook' || path === '/dialog/oauth') {
        const appId = '100223126694380';
        const redirectUri = `https://${req.headers.host}/auth/facebook/callback`;
        const fbAuthUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email,public_profile`;
        
        res.writeHead(302, { 'Location': fbAuthUrl });
        return res.end();
    }

    // استجابة الـ Callback بعد موافقة المستخدم على تسجيل الدخول فيسبوك
    if (path === '/auth/facebook/callback') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head><title>Authentication Success</title></head>
            <body style="background:#121212; color:#fff; font-family:sans-serif; text-align:center; padding-top:50px;">
                <h3>Facebook Authentication Successful!</h3>
                <p>You can now return to the game.</p>
            </body>
            </html>
        `);
    }

    // صفحة شروط الاستخدام (/terms)
    if (path === '/terms') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Terms of Service</title>
                <style>
                    body { background-color: #121212; color: #e0e0e0; font-family: sans-serif; padding: 20px; line-height: 1.6; }
                    h2 { color: #ff5722; font-size: 16px; margin-top: 20px; }
                    p { font-size: 13px; color: #b0b0b0; }
                    a { color: #ff5722; text-decoration: none; display: inline-block; margin-top: 20px; }
                </style>
            </head>
            <body>
                <h2>1. ACCEPTANCE</h2>
                <p>By using this service you agree to these terms.</p>
                <h2>2. FACEBOOK AUTHENTICATION</h2>
                <p>Sign-in relies on Facebook OAuth integration.</p>
                <a href="/">&larr; Back</a>
            </body>
            </html>
        `);
    }

    // صفحة سياسة الخصوصية (/privacy)
    if (path === '/privacy') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Privacy Policy</title>
                <style>
                    body { background-color: #121212; color: #e0e0e0; font-family: sans-serif; padding: 20px; line-height: 1.5; }
                    h2 { color: #ff5722; font-size: 15px; margin-top: 20px; }
                    p { font-size: 13px; color: #b0b0b0; }
                    a { color: #ff5722; text-decoration: none; display: inline-block; margin-top: 20px; }
                </style>
            </head>
            <body>
                <h2>WHAT WE COLLECT</h2>
                <p>We collect your basic Facebook profile data authorized during login.</p>
                <a href="/">&larr; Back</a>
            </body>
            </html>
        `);
    }

    // الصفحة الرئيسية
    if (req.method === 'GET' && !req.headers['x-unity-version'] && !req.headers['user-agent']?.includes('Garena')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Authentication Endpoint</title>
                <style>
                    body { background-color: #121212; color: #e0e0e0; font-family: sans-serif; padding: 20px; }
                    p { font-size: 14px; color: #a0a0a0; }
                    a { color: #ff5722; text-decoration: none; margin-right: 15px; font-size: 12px; }
                </style>
            </head>
            <body>
                <p>This is the authentication endpoint. It is reached by the game client, not by browsers directly.</p>
                <div>
                    <a href="/terms">Terms</a>
                    <a href="/privacy">Privacy</a>
                </div>
            </body>
            </html>
        `);
    }

    // الاستجابة العامة لطلبات اللعبة
    res.status(200).json({ status: "online", message: "Auth server active" });
};
