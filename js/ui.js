/**
 * Rooted — UI Rendering
 */
const RootedUI = (() => {
  const main = () => document.getElementById('main-content');

  function clearScreen() { main().innerHTML = ''; }

  function showToast(message, duration = 2400) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.hidden = true; }, duration);
  }

  function renderHome(location, status, actions, household) {
    clearScreen();
    const screen = document.createElement('div');
    screen.className = 'screen active';
    screen.id = 'screen-home';

    const statusHTML = `
      <div class="status-card">
        <div class="status-card-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8 6 4 10 4 14a8 8 0 0 0 16 0c0-4-4-8-8-12z"/></svg>
          Bioregion status
        </div>
        <div class="status-grid">
          <div class="status-item"><div class="status-label">Overnight low</div><div class="status-value">${status.low}°C</div></div>
          <div class="status-item"><div class="status-label">Afternoon high</div><div class="status-value">${status.high}°C <span class="muted">${status.uv}</span></div></div>
          <div class="status-item"><div class="status-label">Soil moisture</div><div class="status-value ${status.soilNote ? 'warning' : ''}">${status.soilMoisture}${status.soilNote ? ' <span class="muted">' + status.soilNote + '</span>' : ''}</div></div>
          <div class="status-item"><div class="status-label">Wind</div><div class="status-value">${status.wind}</div></div>
          <div class="status-item" style="grid-column: 1 / -1"><div class="status-label">Water outlook</div><div class="status-value">${status.waterOutlook} <span class="muted">· household buffer ${status.waterBuffer} days</span></div></div>
        </div>
      </div>`;

    let actionsHTML = `<div class="section-header"><span class="section-title">Prioritized for you today</span><button class="section-link" id="why-actions">Why these actions?</button></div>`;

    actions.forEach((action, i) => {
      actionsHTML += `
        <div class="action-card ${action.priority ? 'priority' : ''}" data-action-id="${action.id}">
          <div class="action-card-header">
            <div class="action-number">${i + 1}</div>
            <div class="action-meta">
              <div class="action-type">${action.type}</div>
              <div class="action-title">${action.title}</div>
              <div class="action-desc">${action.desc}</div>
            </div>
          </div>
          <div class="action-actions">
            ${action.primaryLabel ? `<button class="btn btn-primary" data-action="${action.primaryAction}">${action.primaryLabel}</button>` : ''}
            ${action.secondaryLabel ? `<button class="btn btn-secondary" data-action="${action.secondaryAction}">${action.secondaryLabel}</button>` : ''}
          </div>
        </div>`;
    });

    screen.innerHTML = statusHTML + actionsHTML;
    main().appendChild(screen);

    screen.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => handleAction(e.currentTarget.dataset.action));
    });
    screen.querySelector('#why-actions')?.addEventListener('click', () => showToast('Actions are ranked by urgency, local conditions, and your household profile.'));
  }

  function handleAction(action) {
    if (action === 'complete') { showToast('Marked as done. Your household model will update.'); return; }
    if (action === 'technique-watering') { showToast('Technique: Water slowly at the base until soil is moist 15–20 cm deep. Mulch immediately after.'); return; }
    if (action === 'technique-soil') { showToast('Push a finger or stick 10–15 cm into the soil. If it feels dry at that depth, water.'); return; }
    if (action.startsWith('message:') || action.startsWith('profile:')) { showToast('Messaging / profile opens in the full version.'); return; }
    if (action.startsWith('join:') || action.startsWith('plan:')) { showToast('Interest recorded. You’ll be notified when the group is ready.'); return; }
    showToast('Action noted.');
  }

  function renderScan() {
    clearScreen();
    const screen = document.createElement('div');
    screen.className = 'screen active';
    screen.innerHTML = `
      <div class="scan-hero">
        <h2>Identify & diagnose</h2>
        <p>Point your camera at a plant, leaf, or soil. Rooted will identify it and give place-specific advice.</p>
        <div class="scan-zone" id="scan-zone">
          <div class="scan-zone-content">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <span style="font-size:0.875rem;font-weight:500">Tap to take or upload photo</span>
          </div>
        </div>
        <input type="file" id="scan-input" accept="image/*" capture="environment" hidden />
        <div id="scan-result-container"></div>
      </div>`;
    main().appendChild(screen);

    const zone = screen.querySelector('#scan-zone');
    const input = screen.querySelector('#scan-input');
    const resultContainer = screen.querySelector('#scan-result-container');

    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      if (input.files.length) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          zone.classList.add('has-image');
          const old = zone.querySelector('img');
          if (old) old.remove();
          const img = document.createElement('img');
          img.src = e.target.result;
          zone.appendChild(img);
          resultContainer.innerHTML = `<p style="text-align:center;color:var(--text-muted);font-size:0.875rem;margin-top:12px">Analysing…</p>`;
          setTimeout(() => {
            const result = RootedData.identifyPlant(file.name);
            resultContainer.innerHTML = `
              <div class="scan-result">
                <div style="display:flex;gap:12px;margin-bottom:12px">
                  <div style="width:40px;height:40px;border-radius:10px;background:var(--green-100);display:flex;align-items:center;justify-content:center;font-size:1.25rem">${result.icon}</div>
                  <div><h3 style="font-size:1rem;font-weight:600;margin-bottom:2px">${result.name}</h3><div style="font-size:0.75rem;color:var(--text-muted)">${result.confidence}% confidence</div></div>
                </div>
                <div style="font-size:0.875rem;color:var(--text-secondary);line-height:1.5;margin-bottom:14px"><strong>Diagnosis:</strong> ${result.diagnosis}<br><br><strong>Advice:</strong> ${result.advice}</div>
                <div style="display:flex;gap:8px"><button class="btn btn-primary" id="save-obs">Save to household</button><button class="btn btn-secondary" id="new-scan">Scan another</button></div>
              </div>`;
            resultContainer.querySelector('#save-obs').addEventListener('click', () => showToast('Observation saved to your household log.'));
            resultContainer.querySelector('#new-scan').addEventListener('click', () => { zone.classList.remove('has-image'); zone.querySelector('img')?.remove(); resultContainer.innerHTML = ''; input.value = ''; });
          }, 900);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  function renderHousehold(household) {
    clearScreen();
    const screen = document.createElement('div');
    screen.className = 'screen active';
    const heatLabel = household.heatRisk === 'moderate' ? 'Moderate' : household.heatRisk;
    screen.innerHTML = `
      <div class="section-header"><span class="section-title">Household resilience</span></div>
      <div class="score-row">
        <div class="score-card"><div class="score-value">${household.waterScore}</div><div class="score-label">Water security</div><div class="score-delta up">↑ ${household.waterDelta} pts this month</div></div>
        <div class="score-card"><div class="score-value">${household.foodPercent}%</div><div class="score-label">Current food production</div><div class="score-delta">Potential ${household.foodPotential}%</div></div>
      </div>
      <div class="metric-list">
        <div class="metric-item"><div class="metric-left"><div class="metric-name">Water buffer</div><div class="metric-sub">${household.hasTank ? 'Tank installed' : 'No tank yet'}</div></div><div class="metric-right"><div class="metric-value">${household.tankDays} days</div></div></div>
        <div class="metric-item"><div class="metric-left"><div class="metric-name">Heat vulnerability</div><div class="metric-sub">West-facing rooms still warm</div></div><div class="metric-right"><div class="metric-value">${heatLabel}</div></div></div>
        <div class="metric-item"><div class="metric-left"><div class="metric-name">Neighbourhood reciprocity</div><div class="metric-sub">Given ${household.reciprocityGiven} · Received ${household.reciprocityReceived}</div></div><div class="metric-right"><div class="metric-value">Active</div></div></div>
      </div>
      <div class="section-header"><span class="section-title">Food production potential</span></div>
      <div class="card"><div class="card-body">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:0.875rem;font-weight:500">This season</span><span style="font-size:0.875rem;color:var(--text-secondary)">${household.foodPercent}% → ${household.foodPotential}%</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${household.foodPercent}%"></div></div>
        <p style="font-size:0.8125rem;color:var(--text-secondary);margin-top:12px;line-height:1.45">With suggested succession planting you could reach ~${household.foodPotential}% of household vegetable needs this season.</p>
      </div></div>`;
    main().appendChild(screen);
  }

  function renderCommunity(location) {
    clearScreen();
    const screen = document.createElement('div');
    screen.className = 'screen active';
    const people = RootedData.getNearbyPeople(location);
    const missions = RootedData.getMissions(location);
    let html = `<div class="section-header"><span class="section-title">Nearby people</span></div>`;
    people.forEach(p => {
      html += `<div class="person-card"><div class="person-avatar">${p.initials}</div><div class="person-info"><div class="person-name">${p.name}</div><div class="person-meta">${p.distance} · ${p.skills.join(' · ')}</div><div class="person-desc">${p.blurb}</div><div style="display:flex;gap:8px"><button class="btn btn-primary" data-msg="${p.id}">Message</button><button class="btn btn-secondary" data-profile="${p.id}">View</button></div></div></div>`;
    });
    html += `<div class="section-header" style="margin-top:16px"><span class="section-title">Open missions</span></div>`;
    missions.forEach(m => {
      html += `<div class="mission-card"><div class="mission-header"><div class="mission-icon">🌱</div><div><div class="mission-title">${m.title}</div><div class="mission-meta">${m.households} households interested · ${m.effort}</div></div></div><div class="mission-desc">${m.fullDesc}</div><div style="display:flex;gap:8px"><button class="btn btn-primary" data-join="${m.id}">Join / express interest</button><button class="btn btn-secondary" data-plan="${m.id}">See plan</button></div></div>`;
    });
    screen.innerHTML = html;
    main().appendChild(screen);
    screen.querySelectorAll('[data-msg], [data-profile], [data-join], [data-plan]').forEach(btn => {
      btn.addEventListener('click', () => showToast('Action recorded.'));
    });
  }

  function populateLocationList(currentId) {
    const list = document.getElementById('location-list');
    list.innerHTML = '';
    RootedData.LOCATIONS.forEach(loc => {
      const btn = document.createElement('button');
      btn.className = 'location-option' + (loc.id === currentId ? ' active' : '');
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span>${loc.name}, ${loc.city}</span>`;
      btn.addEventListener('click', () => window.dispatchEvent(new CustomEvent('location-selected', { detail: loc.id })));
      list.appendChild(btn);
    });
  }

  return { renderHome, renderScan, renderHousehold, renderCommunity, showToast, populateLocationList, handleAction };
})();
