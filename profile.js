const enterScreen = document.getElementById('enter');
const mainCard = document.getElementById('main');
const bgContainer = document.getElementById('bg-container');
const audio = document.getElementById('bgAudio');
const btnPlay = document.getElementById('mpPlay');
const vol = document.getElementById('mpVolume');
const bar = document.getElementById('mpProgressBar');
const cursorDot = document.getElementById('cursor-dot');
let playing = false;

function setPlayIcon() {
  if (btnPlay) btnPlay.textContent = playing ? '⏸' : '▶';
}

function setBrowserProfile(name, iconUrl) {
  if (name) {
    document.title = `${name} | DEMON FANBOY`;
  }
  let icon = document.querySelector('link[rel~="icon"]');
  if (!icon) {
    icon = document.createElement('link');
    icon.rel = 'icon';
    document.head.appendChild(icon);
  }
  icon.href = iconUrl;
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function findProfile() {
  const slug = getQueryParam('slug');
  if (!slug) return null;
  return PROFILES.find(profile => profile.slug === slug);
}

function renderSocials(socials) {
  const rows = Object.entries(socials || {}).filter(([, data]) => !!data.url).map(([key, data]) => {
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    const logoSrc = new URL(data.logo, window.location.href).href;
    return `<a class="icon glow" href="${data.url}" target="_blank" rel="noreferrer"><img src="${logoSrc}" alt="${label}" style="width:24px; height:24px;" onerror="this.style.display='none'"></a>`;
  });
  const iconRow = document.getElementById('iconRow');
  if (iconRow) {
    iconRow.innerHTML = rows.join('');
    iconRow.style.display = rows.length ? 'flex' : 'none';
  }
}

function loadProfile() {
  const profile = findProfile();
  if (!profile) {
    document.body.innerHTML = '<div style="color:white; display:flex; align-items:center; justify-content:center; min-height:100vh;">Profile not found.</div>';
    return;
  }

  // Load background video if available
  if (profile.background && bgContainer) {
    bgContainer.innerHTML = `<video autoplay muted loop style="width: 100%; height: 100%; object-fit: cover;"><source src="${profile.background}" type="video/mp4"></video>`;
  }

  const nameEl = document.getElementById('discordName');
  const avatarEl = document.getElementById('discordAvatar');
  const bioEl = document.getElementById('bioText');
  const decoEl = document.getElementById('avatarDecoration');
  const statusDot = document.getElementById('statusDot');
  const statusContainer = document.getElementById('lanyardStatus');
  const viewsEl = document.getElementById('viewsCount');

  if (nameEl) nameEl.textContent = profile.username;
  if (bioEl) {
    bioEl.textContent = profile.bio;
    bioEl.style.setProperty('--chars', profile.bio.length);
    bioEl.classList.add('typing');
  }
  if (viewsEl) viewsEl.textContent = profile.views;
  setBrowserProfile(profile.username, 'backgrounds/main/logo.png');

  // Fetch live Discord data
  fetch(`https://api.lanyard.rest/v1/users/${profile.id}`)
    .then(res => res.json())
    .then(data => {
      const discordUser = data.data.discord_user;
      const discordStatus = data.data.discord_status;
      const activities = data.data.activities;

      if (discordUser && nameEl) {
        const discordHandle = `${discordUser.username}#${discordUser.discriminator}`;
        avatarEl?.setAttribute('alt', discordHandle);
        if (discordUser.avatar) {
          setBrowserProfile(profile.username, `https://cdn.discordapp.com/avatars/${profile.id}/${discordUser.avatar}.png?size=64`);
        } else {
          setBrowserProfile(profile.username, `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.discriminator, 10) % 5}.png`);
        }
      }

      if (avatarEl) {
        if (discordUser && discordUser.avatar) {
          avatarEl.src = `https://cdn.discordapp.com/avatars/${profile.id}/${discordUser.avatar}.png?size=256`;
          avatarEl.style.display = 'block';
        } else if (discordUser && typeof discordUser.discriminator !== 'undefined') {
          const defaultIndex = parseInt(discordUser.discriminator, 10) % 5;
          avatarEl.src = `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
          avatarEl.style.display = 'block';
        } else {
          avatarEl.style.display = 'none';
        }
      }
      if (decoEl) {
        decoEl.style.display = 'none';
      }
      if (statusDot) statusDot.className = `status-dot status-${discordStatus}`;
      if (statusContainer) {
        let statusText = discordStatus.charAt(0).toUpperCase() + discordStatus.slice(1);
        let activityText = profile.bio; // default to bio
        if (activities && activities.length > 0) {
          const activity = activities[0];
          if (activity.type === 0) { // Playing
            activityText = `Playing ${activity.name}`;
          } else if (activity.type === 2) { // Listening
            activityText = `Listening to ${activity.details || activity.name}`;
          } else if (activity.type === 3) { // Watching
            activityText = `Watching ${activity.name}`;
          }
        }
        statusContainer.innerHTML = `
          <div class="status-title">${statusText}</div>
          <div class="status-text">${activityText}</div>
        `;
        statusContainer.style.display = 'flex';
      }
    })
    .catch(err => {
      console.log('Lanyard fetch failed:', err);
      // Fallback to Discord default avatar
      if (avatarEl) {
        avatarEl.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
        avatarEl.style.display = 'block';
      }
      setBrowserProfile(profile.username, 'backgrounds/main/logo.png');
      if (statusDot) statusDot.className = 'status-dot status-offline';
      if (statusContainer) {
        statusContainer.innerHTML = `
          <div class="status-title">Offline</div>
          <div class="status-text">${profile.bio}</div>
        `;
        statusContainer.style.display = 'flex';
      }
    });

  renderSocials(profile.socials);

  if (audio) {
    audio.src = profile.music || audio.src;
    audio.volume = Number(vol.value);
  }

  // Update music player title and artist
  const mpTitle = document.getElementById('mpTitle');
  const mpArtist = document.getElementById('mpArtist');
  if (mpTitle && profile.musicMeta) {
    mpTitle.textContent = profile.musicMeta.title || 'Unknown Title';
  }
  if (mpArtist && profile.musicMeta) {
    mpArtist.textContent = profile.musicMeta.artist || 'Unknown Artist';
  }

  if (mainCard) mainCard.classList.remove('hidden');
  setTimeout(() => mainCard.classList.add('show'), 150);
}

enterScreen.addEventListener('click', async () => {
  enterScreen.classList.add('hide');
  if (mainCard) mainCard.classList.remove('hidden');
  setTimeout(() => mainCard.classList.add('show'), 150);
  if (audio && !playing) {
    try {
      await audio.play();
      playing = true;
      setPlayIcon();
    } catch (err) {
      console.log('Audio blocked:', err);
    }
  }
});

btnPlay.addEventListener('click', async () => {
  if (!audio) return;
  try {
    if (!playing) {
      await audio.play();
      playing = true;
    } else {
      audio.pause();
      playing = false;
    }
    setPlayIcon();
  } catch (err) {
    console.log('Play blocked:', err);
  }
});

vol.addEventListener('input', () => {
  if (audio) audio.volume = Number(vol.value);
});

if (audio && bar) {
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    bar.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
  });
}

document.addEventListener('mousemove', e => {
  cursorDot.style.left = `${e.clientX}px`;
  cursorDot.style.top = `${e.clientY}px`;
});

loadProfile();
setPlayIcon();
