// Scarica le foto degli esercizi dal dataset libero free-exercise-db (Unlicense)
// e le salva ridimensionate in public/exercises/<id-seed>.jpg:  node scripts/photos.mjs
import sharp from 'sharp';
const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const MAP = {
  'croci-alto': 'Incline_Dumbbell_Flyes',
  'croci-centro': 'Dumbbell_Flyes',
  'croci-basso': 'Decline_Dumbbell_Flyes',
  'dorsali-larga': 'Wide-Grip_Lat_Pulldown',
  'dorsali-media': 'Full_Range-Of-Motion_Lat_Pulldown',
  'dorsali-stretta': 'Close-Grip_Front_Lat_Pulldown',
  'lento-avanti': 'Dumbbell_Shoulder_Press',
  'alzate-laterali': 'Side_Lateral_Raise',
  'croci-posteriori': 'Reverse_Flyes',
  'alzate-frontali': 'Front_Dumbbell_Raise',
  'bicipiti': 'Dumbbell_Bicep_Curl',
  'tricipiti': 'Triceps_Pushdown',
  'addominali': 'Crunches',
  'rotazioni-bastone': 'Seated_Barbell_Twist',
  'flessioni-bastone': 'Barbell_Side_Bend',
};
for (const [id, src] of Object.entries(MAP)) {
  const res = await fetch(`${BASE}${src}/0.jpg`);
  if (!res.ok) { console.error('KO', id, src, res.status); continue; }
  await sharp(Buffer.from(await res.arrayBuffer())).resize({ width: 640, withoutEnlargement: true })
    .jpeg({ quality: 78 }).toFile(`public/exercises/${id}.jpg`);
  console.log('ok', id);
}
