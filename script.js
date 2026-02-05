    // ========== AUDIO ==========
    let audioCtx = null;
    let globalVolume = 0.8;

    // Windows XP Sounds
    const XPSounds = {
      startup: 'https://www.winhistory.de/more/winstart/mp3/winxp.mp3',
      shutdown: 'https://www.winhistory.de/more/winstart/mp3/winxpshutdown.mp3',
      notify: 'https://www.winhistory.de/more/winstart/mp3/notify.mp3',
      error: 'https://www.winhistory.de/more/winstart/mp3/chord.mp3'
    };

    function playXPSound(soundUrl, volume = 0.5) {
      try {
        const audio = new Audio(soundUrl);
        audio.volume = volume * globalVolume;
        audio.play().catch(() => {});
      } catch(e) {}
    }

    // Simple soft click using Web Audio API
    function playSoftClick() {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 1800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1 * globalVolume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.05);
      } catch(e) {}
    }

    function playClick() {
      playSoftClick();
    }

    function playStartSound() {
      playSoftClick();
    }

    function playWindowOpen() {
      playXPSound(XPSounds.notify, 0.3);
    }

    function playWindowClose() {
      playXPSound(XPSounds.click, 0.3);
    }

    function playStartupSound() {
      playXPSound(XPSounds.startup, 0.5);
    }

    function playErrorSound() {
      playXPSound(XPSounds.error, 0.4);
    }

    function updateVolume(val) {
      val = Math.max(0, Math.min(100, Math.round(val)));
      globalVolume = val / 100;
      document.getElementById('volume-value').textContent = val;
      document.getElementById('volume-fill').style.height = val + '%';
      document.getElementById('volume-knob').style.bottom = 'calc(' + val + '% - 6px)';

      // Actually control YouTube music volume
      if (ytPlayer && ytPlayer.setVolume) {
        ytPlayer.setVolume(val);
      }
    }

    // Draggable volume slider
    function initVolumeSlider() {
      const track = document.getElementById('volume-track');
      const knob = document.getElementById('volume-knob');
      let isDraggingVolume = false;

      function setVolumeFromY(clientY) {
        const rect = track.getBoundingClientRect();
        const y = clientY - rect.top;
        const percent = 100 - (y / rect.height * 100);
        updateVolume(percent);
      }

      knob.addEventListener('mousedown', (e) => {
        isDraggingVolume = true;
        e.preventDefault();
      });

      track.addEventListener('click', (e) => {
        setVolumeFromY(e.clientY);
        playClick();
      });

      document.addEventListener('mousemove', (e) => {
        if (isDraggingVolume) {
          setVolumeFromY(e.clientY);
        }
      });

      document.addEventListener('mouseup', () => {
        if (isDraggingVolume) {
          isDraggingVolume = false;
          playClick();
        }
      });
    }

    // Initialize volume slider when DOM ready
    document.addEventListener('DOMContentLoaded', initVolumeSlider);

    // ========== WINDOW MANAGEMENT ==========
    let activeWindow = null;
    let dragOffset = { x: 0, y: 0 };
    let isDragging = false;
    let openWindows = new Set();
    let zCounter = 100;

    function openWindow(id) {
      const win = document.getElementById('window-' + id);
      if (win) {
        win.classList.remove('closing', 'minimizing');
        win.classList.add('active');
        bringToFront(win);
        openWindows.add(id);
        updateTaskbar();
        playWindowOpen();

        // Bounce the icon
        const icon = document.querySelector(`[data-window="${id}"]`);
        if (icon) {
          icon.classList.add('bounce');
          setTimeout(() => icon.classList.remove('bounce'), 300);
        }

        // Load pinball only when opened (lazy load) and focus it
        if (id === 'pinball') {
          const frame = document.getElementById('pinball-frame');
          if (frame && !frame.src && frame.dataset.src) {
            frame.src = frame.dataset.src;
          }
          // Focus the iframe after a short delay to allow loading
          setTimeout(() => {
            if (frame) {
              frame.focus();
              // Also try to focus the canvas inside
              try {
                frame.contentWindow.document.getElementById('canvas')?.focus();
              } catch(e) {}
            }
          }, 500);
          // Lower music volume while pinball is playing
          if (ytPlayer && ytPlayer.setVolume) {
            ytPlayer.setVolume(25);
          }
          // Also open the controls helper window
          openWindow('pinball-controls');
        }
      }
    }

    function closeWindow(id) {
      const win = document.getElementById('window-' + id);
      if (win) {
        playWindowClose();
        win.classList.add('closing');

        // Unload pinball to stop audio and close controls window
        if (id === 'pinball') {
          const frame = document.getElementById('pinball-frame');
          if (frame) frame.src = '';
          // Also close the controls helper
          const controlsWin = document.getElementById('window-pinball-controls');
          if (controlsWin) {
            controlsWin.classList.remove('active');
            openWindows.delete('pinball-controls');
          }
          // Restore music volume when pinball closes
          if (ytPlayer && ytPlayer.setVolume) {
            ytPlayer.setVolume(50);
          }
        }

        setTimeout(() => {
          win.classList.remove('active', 'closing');
          openWindows.delete(id);
          updateTaskbar();
        }, 150);
      }
    }

    function minimizeWindow(id) {
      const win = document.getElementById('window-' + id);
      if (win) {
        playClick();
        win.classList.add('minimizing');
        setTimeout(() => {
          win.classList.remove('active', 'minimizing');
        }, 300);
      }
    }

    function maximizeWindow(id) {
      const win = document.getElementById('window-' + id);
      if (win) {
        playClick();
        if (win.style.width === '100%') {
          win.style.width = '600px';
          win.style.height = '';
          win.style.top = '60px';
          win.style.left = '180px';
        } else {
          win.style.width = '100%';
          win.style.height = 'calc(100% - 30px)';
          win.style.top = '0';
          win.style.left = '0';
        }
      }
    }

    function bringToFront(win) {
      zCounter++;
      win.style.zIndex = zCounter;
    }

    function startDrag(e, winId) {
      const win = document.getElementById(winId);
      isDragging = true;
      activeWindow = win;
      bringToFront(win);
      dragOffset.x = e.clientX - win.offsetLeft;
      dragOffset.y = e.clientY - win.offsetTop;
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', stopDrag);
      e.preventDefault();
    }

    function drag(e) {
      if (isDragging && activeWindow) {
        let newX = e.clientX - dragOffset.x;
        let newY = e.clientY - dragOffset.y;
        newX = Math.max(0, Math.min(newX, window.innerWidth - 100));
        newY = Math.max(0, Math.min(newY, window.innerHeight - 60));
        activeWindow.style.left = newX + 'px';
        activeWindow.style.top = newY + 'px';
      }
    }

    function stopDrag() {
      isDragging = false;
      activeWindow = null;
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDrag);
    }

    // ========== ICON SELECTION ==========
    function selectIcon(icon) {
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
      icon.classList.add('selected');
    }

    // ========== TASKBAR ==========
    function updateTaskbar() {
      const taskbarApps = document.getElementById('taskbar-apps');
      taskbarApps.innerHTML = '';
      openWindows.forEach(id => {
        const win = document.getElementById('window-' + id);
        if (win) {
          const title = win.querySelector('.window-title').textContent;
          const icon = win.querySelector('.window-titlebar img').src;
          const app = document.createElement('div');
          app.className = 'taskbar-app';
          app.innerHTML = `<img src="${icon}"><span>${title}</span>`;
          app.onclick = () => {
            if (!win.classList.contains('active')) {
              win.classList.remove('minimizing');
              win.classList.add('active');
            }
            bringToFront(win);
            playClick();
          };
          taskbarApps.appendChild(app);
        }
      });
    }

    // ========== START MENU ==========
    function toggleStartMenu() {
      const menu = document.getElementById('start-menu');
      const btn = document.getElementById('start-btn');
      menu.classList.toggle('active');
      btn.classList.toggle('pressed');

      // Close other popups
      document.getElementById('calendar-popup').classList.remove('active');
      document.getElementById('wifi-popup').classList.remove('active');
      document.getElementById('volume-popup').classList.remove('active');
    }

    // ========== SYSTEM TRAY ==========
    function toggleCalendar() {
      const popup = document.getElementById('calendar-popup');
      popup.classList.toggle('active');
      document.getElementById('wifi-popup').classList.remove('active');
      document.getElementById('volume-popup').classList.remove('active');
      document.getElementById('start-menu').classList.remove('active');

      if (popup.classList.contains('active')) {
        renderCalendar();
      }
    }

    function toggleWifi() {
      const popup = document.getElementById('wifi-popup');
      popup.classList.toggle('active');
      document.getElementById('calendar-popup').classList.remove('active');
      document.getElementById('volume-popup').classList.remove('active');
      document.getElementById('start-menu').classList.remove('active');
    }

    function toggleVolume() {
      const popup = document.getElementById('volume-popup');
      popup.classList.toggle('active');
      document.getElementById('calendar-popup').classList.remove('active');
      document.getElementById('wifi-popup').classList.remove('active');
      document.getElementById('start-menu').classList.remove('active');
    }

    function renderCalendar() {
      const now = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

      document.getElementById('calendar-month').textContent =
        `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

      const grid = document.getElementById('calendar-grid');
      grid.innerHTML = '';

      const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
      days.forEach(day => {
        const el = document.createElement('div');
        el.className = 'calendar-day header';
        el.textContent = day;
        grid.appendChild(el);
      });

      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

      for (let i = 0; i < firstDay; i++) {
        const el = document.createElement('div');
        el.className = 'calendar-day empty';
        grid.appendChild(el);
      }

      for (let i = 1; i <= daysInMonth; i++) {
        const el = document.createElement('div');
        el.className = 'calendar-day';
        if (i === now.getDate()) el.classList.add('today');
        el.textContent = i;
        grid.appendChild(el);
      }
    }

    // ========== CLOCK ==========
    function updateClock() {
      const now = new Date();
      document.getElementById('clock').textContent = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    updateClock();
    setInterval(updateClock, 1000);

    // ========== NOTIFICATIONS ==========
    function showNotification(title, body) {
      const notif = document.getElementById('notification');
      document.getElementById('notif-title').textContent = title;
      document.getElementById('notif-body').textContent = body;
      notif.classList.add('active');
      setTimeout(() => notif.classList.remove('active'), 4000);
    }

    // ========== SHUTDOWN ==========
    function showShutdown() {
      document.getElementById('shutdown-dialog').classList.add('active');
      document.getElementById('start-menu').classList.remove('active');
    }

    function hideShutdown() {
      document.getElementById('shutdown-dialog').classList.remove('active');
    }

    function triggerShutdown() {
      playClick();
      // Play XP shutdown sound
      playXPSound(XPSounds.shutdown, 0.5);
      // Hide shutdown dialog
      hideShutdown();
      // Create shutdown screen
      const shutdownScreen = document.createElement('div');
      shutdownScreen.id = 'xp-shutdown';
      shutdownScreen.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(180deg,#2b4f9e 0%,#3561b1 50%,#1e3c7a 100%);z-index:10000;display:flex;flex-direction:column;justify-content:center;align-items:center;opacity:0;transition:opacity 0.5s;';
      shutdownScreen.innerHTML = `
        <div style="color:#fff;font-family:'Franklin Gothic Medium',Tahoma,sans-serif;font-size:24px;font-style:italic;margin-bottom:20px;">Windows is shutting down...</div>
        <div style="color:rgba(255,255,255,0.7);font-size:12px;font-family:Tahoma;">Saving your settings...</div>
      `;
      document.body.appendChild(shutdownScreen);
      setTimeout(() => shutdownScreen.style.opacity = '1', 50);
      // Fade to black
      setTimeout(() => {
        shutdownScreen.style.background = '#000';
        shutdownScreen.innerHTML = `
          <div style="color:#ff8c00;font-family:Tahoma,sans-serif;font-size:16px;text-align:center;line-height:1.6;">
            It is now safe to turn off<br>your computer.
          </div>
          <button onclick="window.parent.postMessage('exitDesktop', '*'); window.location.reload();" style="
            margin-top: 40px;
            background: linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 100%);
            color: #fff;
            border: 2px solid #666;
            padding: 12px 30px;
            font-size: 14px;
            cursor: pointer;
            border-radius: 5px;
            font-family: Tahoma, sans-serif;
          ">Power On</button>
        `;
      }, 3000);
    }

    // ========== SCREENSAVER ==========
    let screensaverActive = false;

    function startScreensaver() {
      screensaverActive = true;
      document.getElementById('screensaver').classList.add('active');
    }

    function stopScreensaver() {
      if (screensaverActive) {
        screensaverActive = false;
        document.getElementById('screensaver').classList.remove('active');
        playClick();
      }
    }

    // ========== CLICK OUTSIDE TO CLOSE ==========
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.start-menu') && !e.target.closest('.start-button')) {
        document.getElementById('start-menu').classList.remove('active');
        document.getElementById('start-btn').classList.remove('pressed');
      }
      if (!e.target.closest('.calendar-popup') && !e.target.closest('.system-time')) {
        document.getElementById('calendar-popup').classList.remove('active');
      }
      if (!e.target.closest('.wifi-popup') && !e.target.closest('.tray-btn')) {
        document.getElementById('wifi-popup').classList.remove('active');
      }
      if (!e.target.closest('.volume-popup') && !e.target.closest('.tray-btn')) {
        document.getElementById('volume-popup').classList.remove('active');
      }
    });

    // ========== THREE.JS BACKGROUND ==========
    function initThreeJS() {
      const canvas = document.getElementById('three-bg');
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000, 0);

      // Create floating particles
      const particles = [];
      const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3
      });

      for (let i = 0; i < 100; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
        particle.position.x = (Math.random() - 0.5) * 20;
        particle.position.y = (Math.random() - 0.5) * 20;
        particle.position.z = (Math.random() - 0.5) * 10 - 5;
        particle.userData.velocity = {
          x: (Math.random() - 0.5) * 0.01,
          y: (Math.random() - 0.5) * 0.01,
          z: (Math.random() - 0.5) * 0.005
        };
        particles.push(particle);
        scene.add(particle);
      }

      camera.position.z = 5;

      function animate() {
        requestAnimationFrame(animate);

        particles.forEach(p => {
          p.position.x += p.userData.velocity.x;
          p.position.y += p.userData.velocity.y;
          p.position.z += p.userData.velocity.z;

          if (Math.abs(p.position.x) > 10) p.userData.velocity.x *= -1;
          if (Math.abs(p.position.y) > 10) p.userData.velocity.y *= -1;
          if (p.position.z > 0 || p.position.z < -10) p.userData.velocity.z *= -1;

          p.material.opacity = 0.1 + Math.sin(Date.now() * 0.001 + p.position.x) * 0.1;
        });

        renderer.render(scene, camera);
      }
      animate();

      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
    }

    // ========== BOOT SEQUENCE ==========
    let bootCompleted = false;

    function finishBoot() {
      if (bootCompleted) return;
      bootCompleted = true;

      const bootScreen = document.getElementById('boot-screen');
      const desktop = document.getElementById('desktop');

      bootScreen.classList.add('hidden');
      desktop.style.display = 'block';
      initThreeJS();

      // Show welcome notification
      setTimeout(() => {
        showNotification('Welcome!', 'Click Start to explore my portfolio. Try the WiFi icon for a surprise!');
      }, 1500);

      // Auto-start music after boot completes - keep trying until it works
      function startMusic() {
        if (musicInitialized && ytPlayer) {
          ytPlayer.playVideo();
          document.getElementById('music-btn').classList.add('playing');
          isMusicPlaying = true;
        } else {
          setTimeout(startMusic, 1000);
        }
      }
      // Delay music start to let startup sound finish
      setTimeout(startMusic, 4000);
    }

    function skipBoot() {
      finishBoot();
    }

    function bootSequence() {
      // Play the iconic Windows XP startup sound FIRST
      playStartupSound();

      // Show XP welcome screen for 4 seconds (let startup sound play)
      setTimeout(() => {
        finishBoot();
      }, 4000);
    }

    // Start boot sequence
    window.onload = bootSequence;

    // YouTube Music Player
    let ytPlayer = null;
    let isMusicPlaying = false;
    let musicInitialized = false;

    function onYouTubeIframeAPIReady() {
      ytPlayer = new YT.Player('yt-player', {
        height: '0',
        width: '0',
        videoId: 'RSFqIWudfq0',
        playerVars: {
          autoplay: 0,
          loop: 1,
          playlist: 'RSFqIWudfq0',
          controls: 0,
          disablekb: 1,
          modestbranding: 1
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange
        }
      });
    }

    function onPlayerReady(event) {
      ytPlayer.setVolume(50);
      // Don't autoplay here - let finishBoot() handle it after Windows intro
      musicInitialized = true;
      isMusicPlaying = false;
    }

    function onPlayerStateChange(event) {
      if (event.data === YT.PlayerState.ENDED) {
        ytPlayer.playVideo();
      }
    }

    function toggleMusic() {
      if (!musicInitialized || !ytPlayer) {
        showNotification('Music', 'Music player is loading...');
        return;
      }

      const musicBtn = document.getElementById('music-btn');

      if (isMusicPlaying) {
        ytPlayer.pauseVideo();
        musicBtn.classList.remove('playing');
        isMusicPlaying = false;
        showNotification('Music', 'Music paused');
      } else {
        ytPlayer.playVideo();
        musicBtn.classList.add('playing');
        isMusicPlaying = true;
        showNotification('Music', 'Now playing: Lofi beats 🎵');
      }
    }

