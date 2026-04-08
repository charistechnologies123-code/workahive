// Test the login API endpoint directly
async function testLogin() {
  try {
    console.log("Testing login endpoint...");
    const response = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@employer.com",
        password: "TestPass123!",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log(`❌ Login failed: ${data.error}`);
      return;
    }

    console.log("✅ Login successful!");
    console.log(`User ID: ${data.id}, Role: ${data.role}`);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testLogin();
