/**
 * Rooted — Bioregional Data & Intelligence Engine
 */
const RootedData = (() => {
  const LOCATIONS = [
    { id: 'cape-town-south', name: 'Southern Suburbs', city: 'Cape Town', region: 'Western Cape', climate: 'mediterranean', hemisphere: 'south', waterStress: 'high', coords: { lat: -34.05, lon: 18.45 } },
    { id: 'johannesburg-north', name: 'Northern Suburbs', city: 'Johannesburg', region: 'Gauteng', climate: 'subtropical-highland', hemisphere: 'south', waterStress: 'medium', coords: { lat: -26.05, lon: 28.05 } },
    { id: 'durban-central', name: 'Berea', city: 'Durban', region: 'KwaZulu-Natal', climate: 'humid-subtropical', hemisphere: 'south', waterStress: 'low', coords: { lat: -29.85, lon: 31.00 } },
    { id: 'pretoria-east', name: 'Eastern Suburbs', city: 'Pretoria', region: 'Gauteng', climate: 'subtropical-highland', hemisphere: 'south', waterStress: 'medium', coords: { lat: -25.75, lon: 28.28 } },
    { id: 'stellenbosch', name: 'Stellenbosch', city: 'Stellenbosch', region: 'Western Cape', climate: 'mediterranean', hemisphere: 'south', waterStress: 'high', coords: { lat: -33.93, lon: 18.86 } }
  ];

  function getSeason(hemisphere = 'south') {
    const month = new Date().getMonth();
    if (hemisphere === 'south') {
      if (month >= 2 && month <= 4) return 'autumn';
      if (month >= 5 && month <= 7) return 'winter';
      if (month >= 8 && month <= 10) return 'spring';
      return 'summer';
    }
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  function getTimeOfDay() {
    const h = new Date().getHours();
    if (h < 6) return 'night';
    if (h < 11) return 'morning';
    if (h < 16) return 'afternoon';
    if (h < 20) return 'evening';
    return 'night';
  }

  function generateStatus(location) {
    const season = getSeason(location.hemisphere);
    const time = getTimeOfDay();
    const tempProfiles = {
      mediterranean: { summer: { low: 16, high: 28 }, autumn: { low: 12, high: 24 }, winter: { low: 7, high: 18 }, spring: { low: 11, high: 23 } },
      'subtropical-highland': { summer: { low: 15, high: 27 }, autumn: { low: 10, high: 23 }, winter: { low: 3, high: 18 }, spring: { low: 10, high: 24 } },
      'humid-subtropical': { summer: { low: 20, high: 29 }, autumn: { low: 16, high: 26 }, winter: { low: 10, high: 23 }, spring: { low: 16, high: 26 } }
    };
    const base = tempProfiles[location.climate][season];
    const variance = Math.floor(Math.random() * 3) - 1;
    const low = base.low + variance;
    const high = base.high + variance;
    let soilMoisture = 'moderate';
    let soilNote = '';
    if (location.waterStress === 'high' && (season === 'summer' || season === 'spring')) {
      soilMoisture = 'moderate';
      soilNote = 'but dropping';
    } else if (season === 'winter' && location.climate === 'mediterranean') {
      soilMoisture = 'good';
    }
    let wind = 'light variable';
    if (location.city === 'Cape Town' && (season === 'summer' || season === 'spring')) wind = 'south-easterly';
    else if (location.city === 'Johannesburg') wind = 'north-easterly';
    let waterOutlook = 'Normal supply';
    let waterBuffer = 21;
    if (location.waterStress === 'high') { waterOutlook = 'Level 2 restrictions'; waterBuffer = 11 + Math.floor(Math.random() * 4); }
    else if (location.waterStress === 'medium') { waterOutlook = 'Watch levels'; waterBuffer = 16 + Math.floor(Math.random() * 5); }
    const uv = (season === 'summer' || season === 'spring') ? 'strong UV' : 'moderate UV';
    return { low, high, uv, soilMoisture, soilNote, wind, waterOutlook, waterBuffer, season, time };
  }

  function generateActions(location, status, household) {
    const actions = [];
    const season = status.season;
    const time = status.time;
    if (time === 'morning' && (season === 'summer' || season === 'spring')) {
      actions.push({ id: 'water-beds', type: 'IMMEDIATE ACTION', priority: true, title: 'Your tomato and basil beds will stress after 11:00.', desc: 'Deep water now (6–8 litres per plant) and apply light mulch. Predicted benefit: +3–4 days of soil moisture.', primaryLabel: 'Show me exact technique', secondaryLabel: 'Mark as done', primaryAction: 'technique-watering', secondaryAction: 'complete' });
    } else {
      actions.push({ id: 'soil-check', type: 'RECOMMENDED', priority: true, title: 'Check soil moisture at 10–15 cm depth.', desc: 'Current model suggests moisture is adequate but worth verifying after recent conditions.', primaryLabel: 'How to check', secondaryLabel: 'Mark as done', primaryAction: 'technique-soil', secondaryAction: 'complete' });
    }
    const people = getNearbyPeople(location);
    if (people.length > 0) {
      const person = people[0];
      actions.push({ id: 'nearby-' + person.id, type: 'OPPORTUNITY NEARBY', priority: false, title: person.name + ' (' + person.distance + ') has ' + person.offer + '.', desc: person.blurb, primaryLabel: 'Message', secondaryLabel: 'See notes', primaryAction: 'message:' + person.id, secondaryAction: 'profile:' + person.id, person });
    }
    const missions = getMissions(location);
    if (missions.length > 0) {
      const mission = missions[0];
      actions.push({ id: 'mission-' + mission.id, type: 'REGENERATIVE MISSION', priority: false, title: mission.title, desc: mission.shortDesc, primaryLabel: 'Join / express interest', secondaryLabel: 'See draft plan', primaryAction: 'join:' + mission.id, secondaryAction: 'plan:' + mission.id, mission });
    }
    return actions;
  }

  function getNearbyPeople(location) {
    const pool = {
      'cape-town-south': [{ id: 'sipho', name: 'Sipho', distance: '0.7 km', offer: 'surplus comfrey leaves and is open to a swap', blurb: 'Friendly gardener. Loves soil health and herbs. Has done two successful plant swaps.', initials: 'S', skills: ['Comfrey', 'Soil building', 'Herbs'] }],
      'johannesburg-north': [{ id: 'thabo', name: 'Thabo', distance: '0.9 km', offer: 'worm castings and is looking for tomato seedlings', blurb: 'Runs a small vermicompost system. Reliable and experienced.', initials: 'T', skills: ['Composting', 'Vegetables'] }],
      'durban-central': [{ id: 'priya', name: 'Priya', distance: '0.5 km', offer: 'curry leaf cuttings and moringa starts', blurb: 'Subtropical specialist. Great with humid conditions.', initials: 'P', skills: ['Subtropical', 'Edibles'] }],
      'pretoria-east': [{ id: 'maria', name: 'Maria', distance: '1.1 km', offer: 'frost cloth offcuts and advice on winter protection', blurb: 'Experienced with Highveld winters. Very practical.', initials: 'M', skills: ['Frost protection', 'Vegetables'] }],
      'stellenbosch': [{ id: 'johan', name: 'Johan', distance: '0.8 km', offer: 'grape vine prunings for cuttings and mulch', blurb: 'Works with a small vineyard. Knows Mediterranean crops well.', initials: 'J', skills: ['Vines', 'Mediterranean'] }]
    };
    return pool[location.id] || pool['cape-town-south'];
  }

  function getMissions(location) {
    return [{
      id: 'rain-garden',
      title: location.waterStress === 'high' ? 'Shared rain-garden & grey-water project' : 'Shared rain-garden on the common verge',
      shortDesc: 'Four households on your street interested. Could reduce runoff and build resilience together.',
      fullDesc: 'A simple rain-garden and grey-water diversion for the common verge. Estimated group time: 6–8 hours over two weekends.',
      households: 4,
      effort: '6–8 hours over two weekends',
      impact: 'Reduced runoff, improved local water retention'
    }];
  }

  function getDefaultHousehold() {
    return { waterScore: 62, waterDelta: 8, foodPercent: 18, foodPotential: 31, heatRisk: 'moderate', reciprocityGiven: 2, reciprocityReceived: 1, hasTank: true, tankDays: 11, lastUpdated: Date.now() };
  }

  const PLANT_DB = [
    { keywords: ['chard', 'spinach', 'leafy'], name: 'Swiss Chard', confidence: 92, diagnosis: 'Early magnesium deficiency + mild heat stress. Not pest-related.', advice: 'Apply a foliar spray of Epsom salt solution this evening after 17:30. Avoid midday.', icon: '🥬' },
    { keywords: ['tomato'], name: 'Tomato', confidence: 89, diagnosis: 'Lower leaves show early signs of stress from inconsistent moisture.', advice: 'Deep water at the base only. Mulch with 5–7 cm of organic material.', icon: '🍅' },
    { keywords: ['basil'], name: 'Basil', confidence: 94, diagnosis: 'Healthy overall. Tip leaves slightly pale — normal under strong light.', advice: 'Pinch growing tips regularly to encourage bushiness.', icon: '🌿' },
    { keywords: ['default'], name: 'Unknown plant', confidence: 64, diagnosis: 'Unable to identify with high confidence from this image.', advice: 'Try a clearer photo of the leaves and any flowers or fruit.', icon: '🌱' }
  ];

  function identifyPlant(imageName = '') {
    const lower = (imageName || '').toLowerCase();
    for (const plant of PLANT_DB) {
      if (plant.keywords.some(k => lower.includes(k))) return { ...plant };
    }
    const options = PLANT_DB.filter(p => p.keywords[0] !== 'default');
    return { ...options[Math.floor(Math.random() * options.length)] };
  }

  return {
    LOCATIONS,
    getSeason,
    getTimeOfDay,
    generateStatus,
    generateActions,
    getNearbyPeople,
    getMissions,
    getDefaultHousehold,
    identifyPlant,
    getLocationById(id) { return LOCATIONS.find(l => l.id === id) || LOCATIONS[0]; }
  };
})();
