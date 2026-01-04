import fs from 'fs';
import https from 'https';
import http from 'http';

// Leer .env.local manualmente
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

console.log('================================================');
console.log('  MIGRACIÓN: Funcionalidad Multisede');
console.log('================================================\n');
console.log(`✓ URL: ${SUPABASE_URL}`);

// Leer archivo SQL
const sql = fs.readFileSync('supabase/migration-add-locations.sql', 'utf8');

// Determinar si usar http o https
const protocol = SUPABASE_URL.startsWith('https') ? https : http;
const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec`);

const postData = JSON.stringify({ query: sql });

const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
  }
};

console.log('\n🔄 Ejecutando migración SQL...\n');

const req = protocol.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Migración aplicada exitosamente\n');
      console.log('================================================');
      console.log('  SIGUIENTES PASOS:');
      console.log('================================================\n');
      console.log('1. Crear sedes iniciales en la tabla locations');
      console.log('2. Asignar sedes a usuarios en tabla profiles');
      console.log('3. Verificar que el filtrado funcione correctamente\n');
    } else {
      console.error('❌ Error aplicando migración');
      console.error(`Status: ${res.statusCode}`);
      console.error(data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error de conexión:', error.message);
  process.exit(1);
});

req.write(postData);
req.end();
