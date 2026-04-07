const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/thrail_app/src/assets/map_data/trails.json', 'utf8'));

const targets = [
  { name: 'Tagapo', lat: 14.316825, lon: 121.229193 },
  { name: 'Daraitan', lat: 14.6067, lon: 121.4393 },
  { name: 'Batulao', lat: 14.0402, lon: 120.8016 },
  { name: 'Makiling', lat: 14.1332, lon: 121.1965 },
  { name: 'Maculot', lat: 13.9168, lon: 121.0336 }
];

function dist(lat1, lon1, lat2, lon2) {
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
}

targets.forEach(t => {
  let closest = null;
  let minDist = Infinity;
  
  data.geometries.forEach(geo => {
    if (geo.type === 'LineString') {
      geo.coordinates.forEach(coord => {
        const d = dist(t.lat, t.lon, coord[1], coord[0]);
        if (d < minDist) {
          minDist = d;
          closest = coord;
        }
      });
    } else if (geo.type === 'MultiLineString') {
       geo.coordinates.forEach(line => {
         line.forEach(coord => {
           const d = dist(t.lat, t.lon, coord[1], coord[0]);
           if (d < minDist) {
             minDist = d;
             closest = coord;
           }
         });
       });
    }
  });
  console.log(t.name + ': ' + closest[1] + ', ' + closest[0] + ' (dist ' + minDist + ')');
});
