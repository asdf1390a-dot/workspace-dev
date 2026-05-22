// Test JWT token decoding to extract user ID
const token = "eyJhbGciOiJFUzI1NiIsImtpZCI6ImRmYmYyM2M0LWE0MmEtNGRjNS04Yzc2LTVjN2M5MWUxZDI4YiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3B6a3Zob21oenRpa2hyZ3dncXpyLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI2YjEzNjA3Yi1hMGNhLTQ4YzYtYWQ1Zi0xZjYyODMzMWJmNzIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzc5MzQwNjg4LCJpYXQiOjE3NzkzMzcwODgsImVtYWlsIjoidGVzdGFwaUBkc2NpbmRpYS5sb2NhbCIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJUZXN0IEFQSSBVc2VyIiwicGxhbnQiOiJEU0MgTWFubnVyIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NzkzMzcwODh9XSwic2Vzc2lvbl9pZCI6IjFkZGU5M2EzLWVlNTEtNDhiMy1iNTFlLWMzNWJjZmJmN2U2YSIsImlzX2Fub255bW91cyI6ZmFsc2V9.PoUXjENIpvQCRQgECLEjyA41skSs-anMPtfRiYb18fmyE5NFW2OECj-zlNxA2r8Hd5_t2QKUWOJ7UIErO-Ok0w";

const parts = token.split('.');
if (parts.length !== 3) {
  console.error("Invalid JWT format");
  process.exit(1);
}

const decoded = Buffer.from(parts[1], 'base64').toString('utf-8');
const payload = JSON.parse(decoded);

console.log("Token payload:");
console.log(JSON.stringify(payload, null, 2));
console.log("\nUser ID (sub):", payload.sub);
console.log("Email:", payload.email);
console.log("Role:", payload.role);
console.log("Session ID:", payload.session_id);
console.log("Token expires at:", new Date(payload.exp * 1000).toISOString());
console.log("Current time:", new Date().toISOString());
console.log("Token still valid:", Date.now() < payload.exp * 1000);
