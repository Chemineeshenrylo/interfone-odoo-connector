const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Installation requise: npm install canvas

function createIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fond transparent
  ctx.clearRect(0, 0, size, size);

  // Cercle de fond
  ctx.fillStyle = '#764ba2';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 2, 0, Math.PI * 2);
  ctx.fill();

  // Téléphone (icône simple)
  ctx.fillStyle = 'white';
  ctx.save();
  ctx.translate(size/2, size/2);
  ctx.scale(0.5, 0.5);

  // Dessin du téléphone
  ctx.beginPath();
  ctx.moveTo(-8, -10);
  ctx.quadraticCurveTo(-8, -12, -6, -12);
  ctx.lineTo(6, -12);
  ctx.quadraticCurveTo(8, -12, 8, -10);
  ctx.lineTo(8, 10);
  ctx.quadraticCurveTo(8, 12, 6, 12);
  ctx.lineTo(-6, 12);
  ctx.quadraticCurveTo(-8, 12, -8, 10);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // Sauvegarder
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Icon created: ${outputPath}`);
}

// Créer les icônes
createIcon(32, path.join(__dirname, 'assets', 'tray.png'));
createIcon(256, path.join(__dirname, 'assets', 'icon.png'));

console.log('Icons created successfully!');