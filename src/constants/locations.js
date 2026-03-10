// Location presets per school and category
export const LocationPresets = {
  Columbia: {
    gym: [
      { name: 'Rec Center', address: '600 S Michigan Ave, Chicago, IL', lat: 41.8756, lng: -87.6238 },
      { name: 'LA Fitness - Michigan Ave', address: '1 S Wacker Dr, Chicago, IL', lat: 41.8828, lng: -87.6361 },
      { name: 'Planet Fitness - Loop', address: '30 W Monroe St, Chicago, IL', lat: 41.8808, lng: -87.6302 },
      { name: 'Equinox Gold Coast', address: '900 N Michigan Ave, Chicago, IL', lat: 41.8984, lng: -87.6240 },
    ],
    coffee: [
      { name: 'Starbucks - Wabash', address: '111 E Wacker Dr, Chicago, IL', lat: 41.8863, lng: -87.6240 },
      { name: 'Dollop Coffee', address: '345 E Ohio St, Chicago, IL', lat: 41.8923, lng: -87.6213 },
      { name: 'Intelligentsia', address: '53 W Jackson Blvd, Chicago, IL', lat: 41.8779, lng: -87.6329 },
      { name: 'Cafecito', address: '26 E Congress Pkwy, Chicago, IL', lat: 41.8768, lng: -87.6278 },
    ],
    study: [
      { name: 'Library - Main Floor', address: '624 S Michigan Ave, Chicago, IL', lat: 41.8751, lng: -87.6239 },
      { name: 'Library - Silent Study', address: '624 S Michigan Ave, Chicago, IL', lat: 41.8751, lng: -87.6239 },
      { name: 'Student Center', address: '916 S Wabash Ave, Chicago, IL', lat: 41.8715, lng: -87.6250 },
      { name: 'Burnham Plan Room', address: '623 S Wabash Ave, Chicago, IL', lat: 41.8757, lng: -87.6254 },
    ],
  },
  Northwestern: {
    gym: [
      { name: 'SPAC', address: '2311 Campus Dr, Evanston, IL', lat: 42.0541, lng: -87.6747 },
      { name: 'Henry Crown Complex', address: '2311 Campus Dr, Evanston, IL', lat: 42.0538, lng: -87.6748 },
    ],
    coffee: [
      { name: 'Einstein Bros - Norris', address: '1999 Campus Dr, Evanston, IL', lat: 42.0533, lng: -87.6745 },
      { name: 'Colectivo Coffee', address: '1000 Davis St, Evanston, IL', lat: 42.0451, lng: -87.6877 },
    ],
    study: [
      { name: 'Main Library', address: '1970 Campus Dr, Evanston, IL', lat: 42.0525, lng: -87.6739 },
      { name: 'Norris Student Center', address: '1999 Campus Dr, Evanston, IL', lat: 42.0533, lng: -87.6745 },
    ],
  },
  UChicago: {
    gym: [
      { name: 'Ratner Athletics', address: '5530 S Ellis Ave, Chicago, IL', lat: 41.7949, lng: -87.5989 },
      { name: 'Bartlett Gym', address: '5640 S University Ave, Chicago, IL', lat: 41.7936, lng: -87.5975 },
    ],
    coffee: [
      { name: 'Cosi - Regenstein', address: '1100 E 57th St, Chicago, IL', lat: 41.7925, lng: -87.5990 },
      { name: 'Ex Libris Cafe', address: '1100 E 57th St, Chicago, IL', lat: 41.7925, lng: -87.5992 },
    ],
    study: [
      { name: 'Regenstein Library', address: '1100 E 57th St, Chicago, IL', lat: 41.7925, lng: -87.5990 },
      { name: 'Crerar Library', address: '5730 S Ellis Ave, Chicago, IL', lat: 41.7931, lng: -87.5989 },
    ],
  },
  DePaul: {
    gym: [
      { name: 'Ray Meyer Fitness Center', address: '2235 N Sheffield Ave, Chicago, IL', lat: 41.9229, lng: -87.6524 },
    ],
    coffee: [
      { name: 'Starbucks - Sheffield', address: '2161 N Clark St, Chicago, IL', lat: 41.9214, lng: -87.6428 },
    ],
    study: [
      { name: 'John T. Richardson Library', address: '2350 N Kenmore Ave, Chicago, IL', lat: 41.9244, lng: -87.6515 },
    ],
  },
  Loyola: {
    gym: [
      { name: 'Halas Recreation Center', address: '6433 N Sheridan Rd, Chicago, IL', lat: 41.9997, lng: -87.6579 },
    ],
    coffee: [
      { name: 'Starbucks - Sheridan', address: '6420 N Sheridan Rd, Chicago, IL', lat: 41.9993, lng: -87.6578 },
    ],
    study: [
      { name: 'Cudahy Library', address: '1032 W Sheridan Rd, Chicago, IL', lat: 42.0024, lng: -87.6620 },
    ],
  },
  UIC: {
    gym: [
      { name: 'UIC ARC', address: '725 W Roosevelt Rd, Chicago, IL', lat: 41.8672, lng: -87.6486 },
    ],
    coffee: [
      { name: 'Starbucks - Halsted', address: '707 S Halsted St, Chicago, IL', lat: 41.8747, lng: -87.6471 },
    ],
    study: [
      { name: 'Richard J. Daley Library', address: '801 S Morgan St, Chicago, IL', lat: 41.8716, lng: -87.6499 },
    ],
  },
};

export const SchoolDomains = {
  'colum.edu': 'Columbia',
  'uchicago.edu': 'UChicago',
  'northwestern.edu': 'Northwestern',
  'depaul.edu': 'DePaul',
  'luc.edu': 'Loyola',
  'uic.edu': 'UIC',
};

export const Schools = ['Columbia', 'UChicago', 'Northwestern', 'DePaul', 'Loyola', 'UIC'];

export const GraduationYears = [2024, 2025, 2026, 2027, 2028, 2029];
