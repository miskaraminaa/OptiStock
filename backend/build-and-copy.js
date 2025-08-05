const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const frontendDir = path.join(__dirname, '../frontend');
const backendBuildDir = path.join(__dirname, 'build');

try {
    console.log('Building React frontend...');
    execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

    console.log('Copying build to backend...');
    fs.removeSync(backendBuildDir); // Remove old build
    fs.copySync(path.join(frontendDir, 'build'), backendBuildDir);

    console.log('Build and copy completed successfully.');
} catch (err) {
    console.error('Error during build and copy:', err.message);
    process.exit(1);
}