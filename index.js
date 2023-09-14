const express = require('express');
// const fetch = require('node-fetch');
const app = express();
require("dotenv").config()

// Replace with your GitHub OAuth App credentials
const clientId = process.env.clientId
const clientSecret = process.env.clientsecret
const redirectUri = 'http://localhost:3000/auth/github/callback';

const userAccessTokens = new Map();

// OAuth Step 1: Redirect users to GitHub for authentication
app.get('/auth/github', (req, res) => {
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}`;
    res.redirect(authUrl);
});

// OAuth Step 2: Handle GitHub's callback
app.get('/auth/github/callback', async (req, res) => {
    const code = req.query.code;

    try {
        // Exchange the code for an access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                redirect_uri: redirectUri,
            }),
        });

        const tokenText = await tokenResponse.text();

        // Check if the response contains an error message
        if (tokenText.includes('error=')) {
            // Handle the error here
            const errorDescription = new URLSearchParams(tokenText).get('error_description');
            console.error('GitHub OAuth Error:', errorDescription);
            return res.status(500).json({ error: 'GitHub OAuth Error' });
        }

        // Parse the access token from the response
        const tokenData = new URLSearchParams(tokenText);
        const accessToken = tokenData.get('access_token');

        // Store the access token securely (e.g., in a database) for future use
        userAccessTokens.set(accessToken, true);

        // Redirect the user to the desired page after successful authentication
        res.redirect(`https://codeeditor-debuger.netlify.app/index.html`);
        res.json({ message: 'Authentication successful' });
    } catch (error) {
        // Handle any unexpected errors
        console.error('Error during OAuth callback:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/auth/github/callback', async (req, res) => {
    const code = req.query.code;

    try {
        // Exchange the code for an access token (same code as in the previous example)
        // ...

        // Push code to a GitHub repository
        const repositoryName = 'your-repo-name'; // Replace with your repository name
        const codeFileName = 'example.js'; // Replace with the desired file name
        const codeContent = 'console.log("Hello, GitHub!");'; 

        const username = 'your-github-username'; // Replace with your GitHub username

        const createFileResponse = await fetch(`https://api.github.com/repos/${username}/${repositoryName}/contents/${codeFileName}`, {
            method: 'PUT',
            headers: {
                Authorization: `token ${accessToken}`,
                'User-Agent': 'Your-App-Name', // Replace with your app name
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Add a new code file',
                content: Buffer.from(codeContent).toString('base64'), // Encode code content in base64
            }),
        });

        if (createFileResponse.status !== 201) {
            return res.status(createFileResponse.status).json({ error: 'Failed to create a new file in the repository' });
        }

        res.json({ message: 'Code pushed to GitHub successfully' });
    } catch (error) {
        console.error('Error pushing code to GitHub:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
