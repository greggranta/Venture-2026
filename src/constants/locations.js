// Location presets per school and category
export const LocationPresets = {
  Columbia: {
    gym: [
      { name: 'Columbia Student Center Gym', address: '754 S Wabash Ave, Chicago, IL', lat: 41.8735, lng: -87.6258 },
      { name: 'Planet Fitness South Loop', address: '521 S State St, Chicago, IL', lat: 41.8768, lng: -87.6278 },
      { name: 'FFC South Loop', address: '1151 S State St, Chicago, IL', lat: 41.8685, lng: -87.6278 },
      { name: 'South Loop Strength & Conditioning', address: '645 S Clark St, Chicago, IL', lat: 41.8755, lng: -87.6310 },
      { name: 'Fit Results', address: '731 S Plymouth Ct, Chicago, IL', lat: 41.8740, lng: -87.6300 },
    ],
    coffee: [
      { name: 'Cafe Deko', address: '715 S Dearborn St, Chicago, IL', lat: 41.8740, lng: -87.6290 },
      { name: 'Sweet Bean', address: '1152 S Wabash Ave, Chicago, IL', lat: 41.8685, lng: -87.6258 },
      { name: 'Chicago French Press', address: '1021 S Delano Ct, Chicago, IL', lat: 41.8705, lng: -87.6290 },
      { name: 'Intelligentsia Monadnock', address: '53 W Jackson Blvd, Chicago, IL', lat: 41.8779, lng: -87.6329 },
    ],
    study: [
      { name: 'Columbia College Library', address: '624 S Michigan Ave, Chicago, IL', lat: 41.8751, lng: -87.6239 },
      { name: 'Columbia Main Building', address: '600 S Michigan Ave, Chicago, IL', lat: 41.8756, lng: -87.6238 },
      { name: 'Art & Design Building', address: '623 S Wabash Ave, Chicago, IL', lat: 41.8757, lng: -87.6254 },
      { name: 'Academic Building', address: '33 W Ida B. Wells Dr, Chicago, IL', lat: 41.8780, lng: -87.6278 },
      { name: 'South Academic Building', address: '1104 S Wabash Ave, Chicago, IL', lat: 41.8687, lng: -87.6255 },
      { name: 'Theatre Building', address: '62 E 11th St, Chicago, IL', lat: 41.8688, lng: -87.6240 },
      { name: 'Student Center Study Lounges', address: '754 S Wabash Ave, Chicago, IL', lat: 41.8735, lng: -87.6258 },
      { name: 'Harold Washington Library', address: '400 S State St, Chicago, IL', lat: 41.8766, lng: -87.6278 },
      { name: 'University Center', address: '525 S State St, Chicago, IL', lat: 41.8769, lng: -87.6278 },
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
