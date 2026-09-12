const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.all('*', (req, res) => {
    console.log('Received request method:', req.method);
    res.status(200).json({
        status: "success",
        message: "Auth server is active",
        data: {
            server_time: Math.floor(Date.now() / 1000)
        }
    });
});

module.exports = app;
