import { google } from "googleapis";
import * as readline from "readline";
import "dotenv/config";

 const client = new google.auth.OAuth2(

    process.env.GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID",
    process.env.GOOGLE_CLIENT_SECRET || "YOUR_CLIENT_SECRET",
    "urn:ietf:wg:oauth:2.0:oob"

)

const url = client.generateAuthUrl({
    access_type: "offline",
    scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
    ],
});

console.log("Authorize this app by visiting this url:", url);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("\n📋 Paste the code here: ", async (code) => {
    const { tokens } = await client.getToken(code);
    console.log("\n✅ Your refresh token:\n", tokens.refresh_token);
    console.log("\n📝 Add this to your .env:");
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    rl.close();
});