const profilesContainer = document.getElementById('profiles');
const mainAudio = document.getElementById('mainAudio');
const mainPlayBtn = document.getElementById('mainPlayBtn');
const mainVolume = document.getElementById('mainVolume');
const cursorDot = document.getElementById('cursor-dot');
const loadingScreen = document.getElementById('loadingScreen');
const snowContainer = document.getElementById('snowContainer');
let isPlaying = false;

function setPlayIcon() {
  mainPlayBtn.textContent = isPlaying ? '⏸' : '▶';
}

// Handle screen tap/click to enter
loadingScreen.addEventListener('click', async () => {
  loadingScreen.style.opacity = '0';
  setTimeout(() => {
    loadingScreen.style.display = 'none';
  }, 500);

  // Start playing music
  try {
    await mainAudio.play();
    isPlaying = true;
    setPlayIcon();
  } catch (err) {
    console.log('Audio play failed:', err);
  }
});

function createSnowflake() {
  if (!snowContainer) return;

  const snowflake = document.createElement('span');
  snowflake.className = 'snowflake';
  snowflake.textContent = '❄';
  const size = Math.random() * 10 + 8;
  const left = Math.random() * 100;
  const duration = Math.random() * 6 + 6;
  const delay = Math.random() * 2;
  snowflake.style.left = `${left}%`;
  snowflake.style.fontSize = `${size}px`;
  snowflake.style.opacity = `${Math.random() * 0.5 + 0.35}`;
  snowflake.style.animationDuration = `${duration}s`;
  snowflake.style.animationDelay = `${delay}s`;

  snowContainer.appendChild(snowflake);

  snowflake.addEventListener('animationend', () => {
    snowflake.remove();
  });
}

function startSnow() {
  for (let i = 0; i < 15; i += 1) {
    setTimeout(createSnowflake, i * 150);
  }

  setInterval(() => {
    if (document.body.contains(snowContainer)) {
      createSnowflake();
    }
  }, 300);
}

startSnow();

function renderTicker() {
  const ticker = document.getElementById('memberTicker');
  if (!ticker) return;
  const profileNames = PROFILES.map(profile => profile.username);
  const text = profileNames.join('  •  ');
  ticker.innerHTML = `${text}  •  ${text}`.split('  •  ').map(name => `<span>${name}</span>`).join('');
}

function renderProfiles() {
  profilesContainer.innerHTML = PROFILES.map(profile => {
    return `
      <a href="profile.html?slug=${profile.slug}" class="profile-link" title="${profile.username}">
        <div class="profile-card">
          <div class="avatar-container">
            <img src="https://cdn.discordapp.com/embed/avatars/0.png" class="avatar-img" alt="${profile.username}" />
            <div class="status-dot status-offline"></div>
          </div>
          <h3 class="profile-name" data-profile="${profile.slug}">${profile.username}</h3>
          <div class="view-btn">fanboy</div>
        </div>
      </a>
    `;
  }).join('');
}

mainPlayBtn.addEventListener('click', async () => {
  if (!mainAudio) return;
  try {
    if (mainAudio.paused) {
      await mainAudio.play();
      isPlaying = true;
    } else {
      mainAudio.pause();
      isPlaying = false;
    }
    setPlayIcon();
    mainAudio.muted = false;
  } catch (err) {
    console.log('Audio blocked:', err);
  }
});

mainVolume.addEventListener('input', e => {
  mainAudio.volume = e.target.value;
});

mainAudio.volume = mainVolume.value;
renderTicker();
renderProfiles();

function animateProfileCards() {
  const cards = document.querySelectorAll('.profile-card');
  cards.forEach((card, index) => {
    setTimeout(() => card.classList.add('show'), index * 60);
  });
}

animateProfileCards();


async function updateStatuses() {
  for (const profile of PROFILES) {
    try {
      const response = await fetch(`https://api.lanyard.rest/v1/users/${profile.id}`);
      const data = await response.json();
      const status = data.data.discord_status;
      const discordUser = data.data.discord_user;
      const avatarHash = discordUser.avatar;

      // Update status dot
      const statusDot = document.querySelector(`a[href="profile.html?slug=${profile.slug}"] .status-dot`);
      if (statusDot) {
        statusDot.className = `status-dot status-${status}`;
      }

      const cardLink = document.querySelector(`a[href="profile.html?slug=${profile.slug}"]`);
      if (cardLink && discordUser && discordUser.username && discordUser.discriminator) {
        cardLink.title = `${discordUser.username}#${discordUser.discriminator}`;
      }

      // Keep the card label as the profile username, and only update avatar/status.
      const avatarImg = document.querySelector(`a[href="profile.html?slug=${profile.slug}"] .avatar-img`);
      if (avatarImg) {
        if (avatarHash) {
          avatarImg.src = `https://cdn.discordapp.com/avatars/${profile.id}/${avatarHash}.png?size=256`;
        } else {
          const defaultIndex = parseInt(discordUser.discriminator, 10) % 5;
          avatarImg.src = `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
        }
      }
    } catch (err) {
      console.log(`Failed to update ${profile.slug}:`, err);
    }
  }
}

// Update statuses on load and every 30 seconds
updateStatuses();
setInterval(updateStatuses, 30000);

document.addEventListener('mousemove', e => {
  cursorDot.style.left = `${e.clientX}px`;
  cursorDot.style.top = `${e.clientY}px`;
});
