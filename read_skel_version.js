import fs from 'fs';

function readSpineVersion(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    
    // In Spine binary formats, the version string is usually one of the first strings.
    // Let's print the first 50 characters as ASCII, replacing non-printable characters.
    let ascii = '';
    for (let i = 0; i < Math.min(buffer.length, 100); i++) {
      const charCode = buffer[i];
      if (charCode >= 32 && charCode <= 126) {
        ascii += String.fromCharCode(charCode);
      } else {
        ascii += `[${charCode}]`;
      }
    }
    console.log(`${filePath}:`);
    console.log(`Raw start: ${ascii.slice(0, 150)}`);
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
  }
}

readSpineVersion('public/sprite/100111/100111.skel');
readSpineVersion('public/sprite/spineboy/spineboy-pro.skel');
readSpineVersion('public/sprite/hero_princess_knight/hero_princess_knight.skel.txt');
