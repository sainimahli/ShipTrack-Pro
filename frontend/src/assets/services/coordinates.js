export const locationCoords = {
  mumbai: { lat: 19.0760, lng: 72.8777 },
  delhi: { lat: 28.6139, lng: 77.2090 },
  "new delhi": { lat: 28.6139, lng: 77.2090 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  pune: { lat: 18.5204, lng: 73.8567 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  thambaram: { lat: 12.9249, lng: 80.1240 },
  tambaram: { lat: 12.9249, lng: 80.1240 },
  nagpur: { lat: 21.1466, lng: 79.0849 },
  kurnool: { lat: 15.8281, lng: 78.0373 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  kanpur: { lat: 26.4499, lng: 80.3319 },
  tiruvannamalai: { lat: 12.2272, lng: 79.0700 },
  vellore: { lat: 12.9165, lng: 79.1325 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  trichy: { lat: 10.7905, lng: 78.7047 },
  tirchy: { lat: 10.7905, lng: 78.7047 },
  salem: { lat: 11.6643, lng: 78.1460 },
  pondicherry: { lat: 11.9416, lng: 79.8083 },
  puducherry: { lat: 11.9416, lng: 79.8083 },
  tirupati: { lat: 13.6288, lng: 79.4192 },
  // Tamil Nadu additional major cities
  theni: { lat: 10.0104, lng: 77.4768 },
  erode: { lat: 11.3410, lng: 77.7172 },
  dindigul: { lat: 10.3673, lng: 77.9803 },
  tirunelveli: { lat: 8.7139, lng: 77.7567 },
  thoothukudi: { lat: 8.7642, lng: 78.1348 },
  tuticorin: { lat: 8.7642, lng: 78.1348 },
  kanyakumari: { lat: 8.0883, lng: 77.5385 },
  nagercoil: { lat: 8.1833, lng: 77.4119 },
  thanjavur: { lat: 10.7870, lng: 79.1378 },
  kumbakonam: { lat: 10.9602, lng: 79.3845 },
  namakkal: { lat: 11.2189, lng: 78.1674 },
  hosur: { lat: 12.7409, lng: 77.8253 },
  krishnagiri: { lat: 12.5186, lng: 78.2138 },
  dharmapuri: { lat: 12.1211, lng: 78.1582 },
  tirupur: { lat: 11.1085, lng: 77.3411 },
  tiruppur: { lat: 11.1085, lng: 77.3411 },
  ooty: { lat: 11.4102, lng: 76.6950 },
  cuddalore: { lat: 11.7480, lng: 79.7714 },
  chidambaram: { lat: 11.3980, lng: 79.6936 },
  nagapattinam: { lat: 10.7656, lng: 79.8424 },
  karaikal: { lat: 10.9254, lng: 79.8380 },
  sivakasi: { lat: 9.4532, lng: 77.7951 },
  virudhunagar: { lat: 9.5680, lng: 77.9624 },
  ramanathapuram: { lat: 9.3639, lng: 78.8395 },
  sivaganga: { lat: 9.8433, lng: 78.4809 },
  pudukkottai: { lat: 10.3796, lng: 78.8208 },
  karaikudi: { lat: 10.0747, lng: 78.7842 },
  perambalur: { lat: 11.2342, lng: 78.8756 },
  ariyalur: { lat: 11.1401, lng: 79.0786 },
  villupuram: { lat: 11.9401, lng: 79.4861 },
  viluppuram: { lat: 11.9401, lng: 79.4861 },
  kallakurichi: { lat: 11.7383, lng: 78.9639 },
  tiruvallur: { lat: 13.1394, lng: 79.9070 },
  kanchipuram: { lat: 12.8342, lng: 79.7036 },
  chengalpattu: { lat: 12.6932, lng: 79.9754 },
  ranipet: { lat: 12.9272, lng: 79.3331 },
  tirupattur: { lat: 12.4918, lng: 78.5636 },
  tenkasi: { lat: 8.9591, lng: 77.3146 },
  mayiladuthurai: { lat: 11.1018, lng: 79.6522 },
  karur: { lat: 10.9601, lng: 78.0766 },
  thiruvarur: { lat: 10.7661, lng: 79.6344 },
  tiruvarur: { lat: 10.7661, lng: 79.6344 },
  // Missing database cities
  perundurai: { lat: 11.2778, lng: 77.5833 },
  kundrathur: { lat: 12.9977, lng: 80.0972 },
  thudupathi: { lat: 11.4102, lng: 77.5856 },
  vinnavanur: { lat: 10.2742, lng: 77.3694 },
  chengam: { lat: 12.3003, lng: 78.8018 },
  malaysia: { lat: 3.1390, lng: 101.6869 },
};

export function getCoords(location) {
  if (!location) return { lat: 13.0827, lng: 80.2707 };
  const key = location.toLowerCase().trim();
  if (locationCoords[key]) {
    return locationCoords[key];
  }
  for (const [name, coords] of Object.entries(locationCoords)) {
    if (key.includes(name) || name.includes(key)) {
      return coords;
    }
  }

  // Stable hash offset fallback to prevent overlapping routes for unrecognized cities
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const baseLat = 13.0827;
  const baseLng = 80.2707;
  const latOffset = ((Math.abs(hash) % 200) - 100) / 100; // -1.0 to +1.0 degree
  const lngOffset = ((Math.abs(hash * 31) % 200) - 100) / 100; // -1.0 to +1.0 degree

  return {
    lat: baseLat + latOffset,
    lng: baseLng + lngOffset
  };
}
