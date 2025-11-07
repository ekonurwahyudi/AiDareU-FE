/**
 * Script to automatically fix hardcoded localhost URLs in frontend code
 * Replaces localhost:8000 and localhost:8080 with environment variables
 */

const fs = require('fs');
const path = require('path');

// Get all TypeScript files in src directory
function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
        getAllTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Fix localhost URLs in file content
function fixLocalhostUrls(content) {
  let modified = false;
  let newContent = content;

  // Pattern 1: const backendUrl = 'http://localhost:8000'
  if (newContent.includes("'http://localhost:8000'") || newContent.includes('"http://localhost:8000"')) {
    newContent = newContent.replace(
      /const\s+backendUrl\s*=\s*['"]http:\/\/localhost:8000['"]/g,
      "const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'"
    );
    modified = true;
  }

  // Pattern 2: const apiUrl = 'http://localhost:8080/api'
  if (newContent.includes("'http://localhost:8080/api'") || newContent.includes('"http://localhost:8080/api"')) {
    newContent = newContent.replace(
      /const\s+apiUrl\s*=\s*['"]http:\/\/localhost:8080\/api['"]/g,
      "const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'"
    );
    modified = true;
  }

  // Pattern 3: Direct URL in template literals ${...}/storage/
  if (newContent.includes('http://localhost:8000/storage/')) {
    newContent = newContent.replace(
      /http:\/\/localhost:8000\/storage\//g,
      '${process.env.NEXT_PUBLIC_BACKEND_URL || \'http://localhost:8000\'}/storage/'
    );
    modified = true;
  }

  // Pattern 4: Direct fetch to localhost:8000
  if (newContent.includes('localhost:8000') && newContent.includes('fetch(')) {
    // Only replace if not already using env var
    if (!newContent.includes('process.env.NEXT_PUBLIC_BACKEND_URL')) {
      newContent = newContent.replace(
        /fetch\(\s*['"]http:\/\/localhost:8000/g,
        "fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}"
      );
      // Fix closing quote to backtick
      newContent = newContent.replace(
        /BACKEND_URL \|\| 'http:\/\/localhost:8000'}['"]\/api/g,
        "BACKEND_URL || 'http://localhost:8000'}/api`"
      );
      modified = true;
    }
  }

  // Pattern 5: Direct fetch to localhost:8080
  if (newContent.includes('localhost:8080') && newContent.includes('fetch(')) {
    if (!newContent.includes('process.env.NEXT_PUBLIC_API_URL')) {
      newContent = newContent.replace(
        /fetch\(\s*['"]http:\/\/localhost:8080/g,
        "fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}"
      );
      modified = true;
    }
  }

  return { content: newContent, modified };
}

// Main execution
console.log('🔍 Scanning for hardcoded localhost URLs...\n');

const srcDir = path.join(__dirname, 'src');
const files = getAllTsFiles(srcDir);

console.log(`📁 Found ${files.length} TypeScript files\n`);

let fixedCount = 0;
const fixedFiles = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');

  // Skip if no localhost references
  if (!content.includes('localhost:8000') && !content.includes('localhost:8080')) {
    return;
  }

  const { content: newContent, modified } = fixLocalhostUrls(content);

  if (modified) {
    fs.writeFileSync(file, newContent, 'utf8');
    fixedCount++;
    const relativePath = path.relative(process.cwd(), file);
    fixedFiles.push(relativePath);
    console.log(`✅ Fixed: ${relativePath}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Total files scanned: ${files.length}`);
console.log(`   Files fixed: ${fixedCount}`);

if (fixedCount > 0) {
  console.log(`\n✅ Successfully fixed ${fixedCount} files!`);
  console.log('\n📝 Fixed files:');
  fixedFiles.forEach(file => console.log(`   - ${file}`));
  console.log('\n⚠️  Please review changes and test thoroughly before committing!');
} else {
  console.log('\n✨ No files needed fixing. All URLs are already using environment variables!');
}
