const http = require('http');

// Generate test image buffers with distinct optical/pixel profiles
function createTestImage(type) {
  let content = '';
  if (type === 'pothole') {
    // Dark asphalt roadway with dark irregular cavity
    content = '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#2b2b2b"/><ellipse cx="100" cy="100" rx="50" ry="35" fill="#0d0d0d" stroke="#1f1f1f" stroke-width="4"/></svg>';
  } else if (type === 'garbage') {
    // High-entropy multicolored scattered refuse
    content = '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#e5e5e5"/><rect x="20" y="30" width="40" height="40" fill="#e63946"/><circle cx="140" cy="60" r="25" fill="#ffb703"/><polygon points="80,120 120,130 90,170" fill="#2a9d8f"/><rect x="130" y="140" width="50" height="30" fill="#8338ec"/></svg>';
  } else if (type === 'water_pipe_leak') {
    // Saturated blue liquid pooling and pipe discharge
    content = '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#1d3557"/><circle cx="100" cy="100" r="70" fill="#0077b6"/><circle cx="100" cy="100" r="40" fill="#90e0ef"/></svg>';
  } else if (type === 'broken_streetlight') {
    // Overhead light pole with bright luminaire hotspot
    content = '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#111827"/><rect x="95" y="60" width="10" height="140" fill="#6b7280"/><circle cx="100" cy="45" r="35" fill="#fef08a"/></svg>';
  } else if (type === 'normal_road') {
    // Uniform clean asphalt road surface with low contrast
    content = '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#374151"/><line x1="100" y1="0" x2="100" y2="200" stroke="#4b5563" stroke-width="2"/></svg>';
  } else {
    // Unclear / unrelated blank noise
    content = '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#888888"/></svg>';
  }

  const base64 = Buffer.from(content).toString('base64');
  return 'data:image/svg+xml;base64,' + base64;
}

const testCases = [
  { name: 'Pothole Image', type: 'pothole' },
  { name: 'Garbage Dump Image', type: 'garbage' },
  { name: 'Leaking Water Pipe Image', type: 'water_pipe_leak' },
  { name: 'Broken Streetlight Image', type: 'broken_streetlight' },
  { name: 'Normal Intact Road Image', type: 'normal_road' },
  { name: 'Unclear / Low Contrast Image', type: 'unclear' }
];

async function runTests() {
  console.log('=== SEVASNAP AI MULTIMODAL PIPELINE TEST SUITE ===\n');

  for (const tc of testCases) {
    const dataUrl = createTestImage(tc.type);
    const postData = JSON.stringify({ image: dataUrl });

    const result = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/ai/analyze',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'x-request-id': 'TEST-' + tc.type
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(JSON.parse(body)));
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    console.log(`[TEST CASE: ${tc.name}]`);
    console.log(`  Status:      ${result.data?.status}`);
    console.log(`  Category:    ${result.data?.category}`);
    console.log(`  Problem:     ${result.data?.problem}`);
    console.log(`  Severity:    ${result.data?.severity}`);
    console.log(`  Department:  ${result.data?.department}`);
    console.log(`  SHA-256:     ${result.data?.sha256?.slice(0, 16)}...`);
    console.log(`  Model:       ${result.data?.modelSource}`);
    console.log(`  Evidence:    ${result.data?.evidence}`);
    console.log('------------------------------------------------------------');
  }

  console.log('\nAll 6 test cases executed independently on their own image bytes.');
}

runTests().catch(console.error);
