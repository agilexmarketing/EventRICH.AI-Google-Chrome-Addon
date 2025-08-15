const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// Eye icon SVG content (Lucide React Eye icon)
function createSVG(size, color = '#3B82F6') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
  <circle cx="12" cy="12" r="3"></circle>
</svg>`;
}

// Function to create PNG with eye icon design
function createEyeIconPNG(size, color = '#3B82F6') {
  const png = new PNG({
    width: size,
    height: size,
    filterType: -1
  });

  // Convert color to RGB
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  // Create the eye icon design
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      
      // Calculate distance from center
      const centerX = size / 2;
      const centerY = size / 2;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      
      // Create eye shape
      let alpha = 0;
      
      // Main eye shape (ellipse)
      const eyeRadiusX = size * 0.4;
      const eyeRadiusY = size * 0.3;
      const eyeDistance = Math.sqrt(((x - centerX) / eyeRadiusX) ** 2 + ((y - centerY) / eyeRadiusY) ** 2);
      
      if (eyeDistance <= 1) {
        alpha = 255;
      } else {
        // Create a soft edge
        const edgeDistance = Math.max(0, 1 - eyeDistance);
        alpha = Math.floor(255 * edgeDistance);
      }
      
      // Add pupil (smaller circle)
      const pupilRadius = size * 0.15;
      const pupilDistance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      
      if (pupilDistance <= pupilRadius) {
        // Darker color for pupil
        png.data[idx] = Math.floor(r * 0.6);     // R
        png.data[idx + 1] = Math.floor(g * 0.6); // G
        png.data[idx + 2] = Math.floor(b * 0.6); // B
        png.data[idx + 3] = 255;                 // A
      } else if (alpha > 0) {
        png.data[idx] = r;     // R
        png.data[idx + 1] = g; // G
        png.data[idx + 2] = b; // B
        png.data[idx + 3] = alpha; // A
      } else {
        png.data[idx] = 0;     // R
        png.data[idx + 1] = 0; // G
        png.data[idx + 2] = 0; // B
        png.data[idx + 3] = 0; // A (transparent)
      }
    }
  }

  return png;
}

function generateFaviconFiles() {
  console.log('🎯 Generating EventRICH.AI favicon files...');
  
  // Create the SVG files
  const svg16 = createSVG(16);
  const svg32 = createSVG(32);
  
  // Write SVG files
  fs.writeFileSync(path.join(__dirname, 'public', 'favicon-16x16.svg'), svg16);
  fs.writeFileSync(path.join(__dirname, 'public', 'favicon-32x32.svg'), svg32);
  
  console.log('✅ SVG favicon files created successfully!');
  
  // Create PNG files
  console.log('🔄 Creating PNG files...');
  
  try {
    // Create 16x16 PNG
    const png16 = createEyeIconPNG(16);
    const png16Buffer = PNG.sync.write(png16);
    fs.writeFileSync(path.join(__dirname, 'public', 'favicon-16x16.png'), png16Buffer);
    
    // Create 32x32 PNG
    const png32 = createEyeIconPNG(32);
    const png32Buffer = PNG.sync.write(png32);
    fs.writeFileSync(path.join(__dirname, 'public', 'favicon-32x32.png'), png32Buffer);
    
    // Create 150x150 PNG (mstile)
    const png150 = createEyeIconPNG(150);
    const png150Buffer = PNG.sync.write(png150);
    fs.writeFileSync(path.join(__dirname, 'public', 'mstile-150x150.png'), png150Buffer);
    
    console.log('✅ PNG favicon files created successfully!');
  } catch (error) {
    console.error('❌ Error creating PNG files:', error.message);
    console.log('💡 You can still use the SVG files with an online converter:');
    console.log('   - https://convertio.co/svg-png/');
    console.log('   - https://cloudconvert.com/svg-to-png');
  }
  
  console.log('');
  console.log('📁 Files created:');
  console.log('  - public/favicon-16x16.svg');
  console.log('  - public/favicon-32x32.svg');
  console.log('  - public/favicon-16x16.png');
  console.log('  - public/favicon-32x32.png');
  console.log('  - public/mstile-150x150.png');
  console.log('');
  console.log('🎨 Design Specifications:');
  console.log('  - Color: #3B82F6 (EventRICH.AI blue)');
  console.log('  - Size: 16x16, 32x32, and 150x150 pixels');
  console.log('  - Format: PNG with transparent background');
  console.log('  - Icon: Lucide React Eye icon design');
}

generateFaviconFiles();
