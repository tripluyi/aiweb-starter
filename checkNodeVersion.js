const { versions } = require('process');

const requiredMajorVersion = 18;

const currentMajorVersion = parseInt(versions.node.split('.')[0], 10);

if (currentMajorVersion < requiredMajorVersion) {
  console.error(`Node.js version ${requiredMajorVersion} or higher is required.`);
  process.exit(1);
}