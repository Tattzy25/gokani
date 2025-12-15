const fs = require('fs');
const path = require('path');
const Replicate = require('replicate');

// Try to find .env in current dir or parent
let envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
    envPath = path.join(process.cwd(), '..', '.env');
}

console.log("Looking for .env at:", envPath);

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const tokenMatch = envContent.match(/REPLICATE_API_TOKEN=(.*)/);
    if (tokenMatch) {
        process.env.REPLICATE_API_TOKEN = tokenMatch[1].trim();
    }
}

if (!process.env.REPLICATE_API_TOKEN) {
  console.error("No token found in .env");
  process.exit(1);
}

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

async function run() {
  try {
    console.log("Running with token:", process.env.REPLICATE_API_TOKEN.substring(0, 5) + "...");
    const version = "tattzy25/famous-flux:9d51097c0ad12337cd012d7796e61fe20fdcfe42f03fcca4546eb36b62636962";
    console.log("Using version:", version);
    
    const output = await replicate.run(
      version,
      {
        input: {
          prompt: "a stunning 4k portrait of a futuristic city",
          model: "dev",
          aspect_ratio: "1:1",
          output_format: "webp",
          num_outputs: 1
        }
      }
    );
    console.log("Success output type:", typeof output);
    console.log("Is array:", Array.isArray(output));
    if (Array.isArray(output) && output.length > 0) {
        console.log("First item type:", typeof output[0]);
        console.log("First item constructor:", output[0].constructor.name);
        console.log("First item keys:", Object.keys(output[0]));
        if (output[0].url) {
             console.log("Has .url():", output[0].url().toString());
        } else {
             console.log("No .url() method");
        }
    }
    console.log("Full output:", output);
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
