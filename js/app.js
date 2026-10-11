/**
 * Rooted — Main Application
 */

(function () {
  'use strict';

  const state = {
    locationId: null,
    location: null,
    status: null,
    actions: [],
    household: null,
    currentScreen: 'home'
  };

  const STORAGE_KEY = 'rooted_v1';

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.locationId) state.locationId = saved.locationId;
        if (saved.household) state.household = saved.household;
      }
    } catch (e) {}
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        locationId: state.locationId,
        household: state.household,
        savedAt: Date.now()
      }));
    } catch (e) {}
  }

  function refreshData() {
    state.location = RootedData.getLocationById(state.locationId);
    state.status = RootedData.generateStatus(state.location);
    if (!state.household) {
      state.household = RootedData.getDefaultHousehold();
    }
    state.household.tankDays = state.status.waterBuffer;
    state.actions = RootedData.generateActions(state.location, state.status, state.household);
    const locText = document.getElementById('location-text');
    if (locText) {
      locText.textContent = state.location.name + ' · ' + state.location.city;
    }
  }

  function navigateTo(screen) {
    state.currentScreen = screen;
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.screen === screen);
    });
    switch (screen) {
      case 'home':
        RootedUI.renderHome(state.location, state.status, state.actions, state.household);
        break;
      case 'scan':
        RootedUI.renderScan();
        break;
      case 'household':
        RootedUI.renderHousehold(state.household);
        break;
      case 'community':
        RootedUI.renderCommunity(state.location);
        break;
    }
  }

  function setLocation(id) {
    state.locationId = id;
    refreshData();
    saveState();
    closeLocationModal();
    navigateTo(state.currentScreen === 'scan' ? 'home' : state.currentScreen);
    RootedUI.showToast('Location set to ' + state.location.name + ', ' + state.location.city);
  }

  function openLocationModal() {
    const modal = document.getElementById('location-modal');
    RootedUI.populateLocationList(state.locationId);
    modal.hidden = false;
  }

  function closeLocationModal() {
    document.getElementById('location-modal').hidden = true;
  }

  function tryGeolocation() {
    if (!navigator.geolocation) {
      RootedUI.showToast('Geolocation not available. Please choose a city.');
      openLocationModal();
      return;
    }
    RootedUI.showToast('Detecting location…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let best = RootedData.LOCATIONS[0];
        let bestDist = Infinity;
        RootedData.LOCATIONS.forEach(loc => {
          const d = Math.hypot(loc.coords.lat - latitude, loc.coords.lon - longitude);
          if (d < bestDist) {
            bestDist = d;
            best = loc;
          }
        });
        setLocation(best.id);
      },
      () => {
        RootedUI.showToast('Could not detect location. Please choose a city.');
        openLocationModal();
      },
      { timeout: 8000, maximumAge: 600000 }
    );
  }

  function init() {
    loadState();
    if (!state.locationId) state.locationId = 'cape-town-south';
    refreshData();
    saveState();

    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => navigateTo(item.dataset.screen));
    });

    document.getElementById('location-btn').addEventListener('click', openLocationModal);
    document.getElementById('close-location-modal').addEventListener('click', closeLocationModal);
    document.getElementById('use-current-location').addEventListener('click', () => {
      closeLocationModal();
      tryGeolocation();
    });

    window.addEventListener('location-selected', (e) => setLocation(e.detail));

    document.getElementById('location-modal').addEventListener('click', (e) => {
      if (e.target.id === 'location-modal') closeLocationModal();
    });

    navigateTo('home');

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
