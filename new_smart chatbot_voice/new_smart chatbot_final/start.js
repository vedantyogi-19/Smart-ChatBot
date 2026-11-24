const { spawn } = require('child_process');
const path = require('path');

const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'frontend');

console.log('===========================================================');
console.log('Starting SMART Chatbot Voice application components...');
console.log('Backend directory: ' + backendDir);
console.log('Frontend directory: ' + frontendDir);
console.log('===========================================================');

// Start Backend
const backend = spawn('dotnet', ['run'], {    
  cwd: backendDir,
  shell: true,
  stdio: 'pipe'
});
 
// Start Frontend
const frontend = spawn('npm', ['start'], {
  cwd: frontendDir,
  shell: true,
  stdio: 'pipe'
});

function logData(prefix, data) {
  const lines = data.toString().split('\n');
  for (const line of lines) {               
    if (line.trim()) {
      console.log(`${prefix} ${line.trim()}`);
    }
  }
}

backend.stdout.on('data', (data) => logData('\x1b[36m[Backend]\x1b[0m', data));
backend.stderr.on('data', (data) => logData('\x1b[31m[Backend ERROR]\x1b[0m', data));

frontend.stdout.on('data', (data) => logData('\x1b[32m[Frontend]\x1b[0m', data));
frontend.stderr.on('data', (data) => logData('\x1b[31m[Frontend ERROR]\x1b[0m', data));

backend.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
  frontend.kill();
  process.exit(code);
});b

frontend.on('close', (code) => {
  console.log(`Frontend process exited with code ${code}`);
  backend.kill();
  process.exit(code); mbbmm
});
   
// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down components...');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  setTimeout(() => process.exit(0), 1000);
});
process.on('SIGTERM', () => {
  backend.kill();
  frontend.kill();
  process.exit(0);
}); 