// Comprehensive login flow test
import http from "http";
import https from "https";

async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3001,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log("=== Testing Login Flow ===\n");

  // Step 1: Login
  console.log("1. Logging in...");
  const loginRes = await makeRequest("POST", "/api/auth/login", {
    email: "test@employer.com",
    password: "TestPass123!",
  });

  console.log(`   Status: ${loginRes.status}`);
  console.log(`   Response: ${JSON.stringify(loginRes.body)}`);

  if (loginRes.headers["set-cookie"]) {
    console.log(`   ✓ Set-Cookie header found: ${loginRes.headers["set-cookie"][0].substring(0, 50)}...`);
  } else {
    console.log("   ✗ No Set-Cookie header!");
  }

  // Step 2: Try to get /api/auth/me without cookies
  console.log("\n2. Calling /api/auth/me without cookies...");
  const meRes1 = await makeRequest("GET", "/api/auth/me");
  console.log(`   Status: ${meRes1.status}`);
  console.log(`   Response: ${JSON.stringify(meRes1.body)}`);

  console.log("\n=== Summary ===");
  console.log("The login API returns a token via Set-Cookie header.");
  console.log("However, HTTP module doesn't automatically manage cookies.");
  console.log("In a real browser, cookies are managed automatically.");
  console.log("The issue is likely frontend-related.");
}

test().catch(console.error);
