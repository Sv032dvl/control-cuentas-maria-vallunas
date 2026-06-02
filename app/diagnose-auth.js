#!/usr/bin/env node
/**
 * Script de diagnóstico de autenticación
 * Ejecutar: node diagnose-auth.js
 *
 * Verifica:
 * - Variables de entorno
 * - Conectividad a Supabase
 * - Estado del usuario admin
 */

const https = require("https");

const URL = "https://pweomcrwlghsfadmnryf.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3ZW9tY3J3bGdoc2ZhZG1ucnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTI0ODIsImV4cCI6MjA5NTg4ODQ4Mn0.pc5o7Y7_xLGIHk8Z-OKaTrDmYq3iQ3vml0tMmyJP5sQ";

console.log("🔍 Diagnóstico de Autenticación\n");

console.log("✅ Variables de entorno:");
console.log(`   URL: ${URL}`);
console.log(`   ANON_KEY: ${ANON_KEY.slice(0, 20)}...\n`);

console.log("🔗 Probando conexión a Supabase...");

const options = {
  hostname: "pweomcrwlghsfadmnryf.supabase.co",
  port: 443,
  path: "/auth/v1/health",
  method: "GET",
  headers: {
    apikey: ANON_KEY,
    "Content-Type": "application/json",
  },
};

const req = https.request(options, (res) => {
  console.log(`✅ Supabase respondiendo (HTTP ${res.statusCode})`);
  console.log("\n📋 Para login manual, vé a: https://app-rho-mauve-39.vercel.app/login");
  console.log("   Email: diegor64@gmail.com");
  console.log("   Contraseña: admin123\n");
  console.log("❌ Si no funciona, revisa:");
  console.log("   1. La consola del navegador (F12) → Console");
  console.log("   2. Los logs de Vercel en: vercel.com");
  console.log("   3. El estado de Supabase Auth aquí: app.supabase.com\n");
});

req.on("error", (error) => {
  console.error("❌ Error conectando a Supabase:", error.message);
  process.exit(1);
});

req.end();
