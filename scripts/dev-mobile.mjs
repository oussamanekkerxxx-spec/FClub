import { networkInterfaces } from "os";
import { spawn } from "child_process";

function getWifiIp() {
  const interfaces = networkInterfaces();
  for (const [name, addrs] of Object.entries(interfaces)) {
    const lower = name.toLowerCase();
    // Match common Wi-Fi adapter names (English + localized Windows names)
    if (
      lower.includes("wlan") ||
      lower.includes("wi-fi") ||
      lower.includes("wireless") ||
      lower.includes("wifi")
    ) {
      for (const addr of addrs) {
        if (addr.family === "IPv4" && !addr.internal) {
          return addr.address;
        }
      }
    }
  }
  return null;
}

const ip = getWifiIp();
if (ip) {
  console.log(`📱 Wi-Fi IP detected: ${ip}`);
  console.log(`🚀 Starting Vite on https://${ip}:5173/\n`);
  const child = spawn("npx", ["vite", "--host", ip], {
    stdio: "inherit",
    shell: true,
    cwd: process.cwd(),
  });
  child.on("exit", (code) => process.exit(code));
} else {
  console.log(
    "⚠️  Could not detect Wi-Fi IP. Falling back to --host (all interfaces)."
  );
  const child = spawn("npx", ["vite", "--host"], {
    stdio: "inherit",
    shell: true,
    cwd: process.cwd(),
  });
  child.on("exit", (code) => process.exit(code));
}
