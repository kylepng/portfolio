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

    // Realistic mouse click using white noise burst
    function playSoftClick() {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const bufferSize = audioCtx.sampleRate * 0.025; // 25ms
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 6);
        }
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 4000;
        filter.Q.value = 1.0;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.5 * globalVolume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.025);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        source.start();
      } catch(e) {}
    }

    function playClick() {
      playSoftClick();
    }

    function playStartSound() {
      playSoftClick();
    }

    function playWindowOpen() {
      try {
        const audio = new Audio('sounds/open-window.ogg');
        audio.volume = 0.25 * globalVolume;
        audio.play().catch(() => {});
      } catch(e) {}
    }

    function playWindowClose() {
      try {
        const audio = new Audio('sounds/enter.ogg');
        audio.volume = 0.2 * globalVolume;
        audio.play().catch(() => {});
      } catch(e) {}
    }

    function playStartupSound() {
      playXPSound(XPSounds.startup, 0.5);
    }

    function playErrorSound() {
      playXPSound(XPSounds.error, 0.4);
    }

    // Satisfying mechanical keyboard sound (synthesized thock)
    function playKeySound() {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const now = audioCtx.currentTime;
        const vol = 0.35 * globalVolume;

        // Click component - short noise burst (the snap)
        const clickLen = Math.floor(audioCtx.sampleRate * 0.008);
        const clickBuf = audioCtx.createBuffer(1, clickLen, audioCtx.sampleRate);
        const clickData = clickBuf.getChannelData(0);
        for (let i = 0; i < clickLen; i++) {
          clickData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / clickLen, 8);
        }
        const clickSrc = audioCtx.createBufferSource();
        clickSrc.buffer = clickBuf;
        const clickFilter = audioCtx.createBiquadFilter();
        clickFilter.type = 'bandpass';
        clickFilter.frequency.value = 3500 + Math.random() * 1000;
        clickFilter.Q.value = 1.5;
        const clickGain = audioCtx.createGain();
        clickGain.gain.setValueAtTime(vol * 0.6, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
        clickSrc.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(audioCtx.destination);
        clickSrc.start(now);
        clickSrc.stop(now + 0.015);

        // Thock component - low resonant tap
        const thock = audioCtx.createOscillator();
        thock.type = 'sine';
        thock.frequency.setValueAtTime(280 + Math.random() * 80, now);
        thock.frequency.exponentialRampToValueAtTime(80, now + 0.04);
        const thockGain = audioCtx.createGain();
        thockGain.gain.setValueAtTime(vol * 0.4, now);
        thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        thock.connect(thockGain);
        thockGain.connect(audioCtx.destination);
        thock.start(now);
        thock.stop(now + 0.04);
      } catch(e) {}
    }

    // Easter egg sound
    function playEasterEggSound() {
      try {
        const audio = new Audio('sounds/easter-egg.ogg');
        audio.volume = 0.4 * globalVolume;
        audio.play().catch(() => {});
      } catch(e) {}
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

    // ========== PINBALL VOLUME ==========
    let pinballVolume = 0.40; // 40% default

    function setPinballVolume(val) {
      val = Math.round(val);
      pinballVolume = val / 100;
      const label = document.getElementById('pinball-vol-label');
      if (label) label.textContent = val + '%';

      // Exponential curve: 1% → 0.000001, 10% → 0.001, 50% → 0.125, 100% → 1.0
      const expVol = Math.pow(pinballVolume, 3);

      try {
        const frame = document.getElementById('pinball-frame');
        if (frame && frame.contentWindow && frame.contentWindow.setMasterVolume) {
          frame.contentWindow.setMasterVolume(expVol);
        }
      } catch(e) {}
    }

    // Keep applying volume as game loads
    setInterval(() => {
      if (openWindows && openWindows.has('pinball')) {
        setPinballVolume(pinballVolume * 100);
      }
    }, 2000);

    // ========== GLOBAL CLICK & KEY SOUNDS ==========
    document.addEventListener('mousedown', function(e) {
      playSoftClick();
    });

    document.addEventListener('keydown', function(e) {
      // Don't play for modifier keys alone
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;
      playKeySound();
    });

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
          if (frame && frame.dataset.src) {
            // Always reload pinball src (fixes black screen on reopen)
            frame.src = frame.dataset.src;
          }
          // Focus the iframe and apply volume after loading
          setTimeout(() => {
            if (frame) {
              frame.focus();
              try {
                frame.contentWindow.document.getElementById('canvas')?.focus();
              } catch(e) {}
              // Apply pinball volume to iframe audio
              setPinballVolume(pinballVolume * 100);
            }
          }, 500);
          // Keep applying volume as game loads audio dynamically
          setTimeout(() => setPinballVolume(pinballVolume * 100), 1500);
          setTimeout(() => setPinballVolume(pinballVolume * 100), 3000);
          // Muffle music like hearing it through a wall (bathroom at the club effect)
          muffleMusic(true);
          // Also open the controls helper window
          openWindow('pinball-controls');
        }

        // Lazy-load game iframes (Snake, Tetris, 2048, Breakout)
        const gameFrameIds = {snake: 'snake-frame', tetris: 'tetris-frame', game2048: 'game2048-frame', breakout: 'breakout-frame'};
        if (gameFrameIds[id]) {
          const frame = document.getElementById(gameFrameIds[id]);
          if (frame && frame.dataset.src) {
            frame.src = frame.dataset.src;
          }
          setTimeout(() => { if (frame) frame.focus(); }, 300);
        }

        // Initialize resize handles for this window
        initResizeHandles();

        // Initialize app if applicable
        if (window.initApp) {
          try { window.initApp(id); } catch(e) {}
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
          // Restore music to normal (un-muffle)
          muffleMusic(false);
        }

        // Unload game iframes on close
        const gameCloseFrames = {snake: 'snake-frame', tetris: 'tetris-frame', game2048: 'game2048-frame', breakout: 'breakout-frame'};
        if (gameCloseFrames[id]) {
          const frame = document.getElementById(gameCloseFrames[id]);
          if (frame) frame.src = '';
        }

        // Destroy app if applicable
        if (window.destroyApp) {
          try { window.destroyApp(id); } catch(e) {}
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

    // ========== WINDOW RESIZING ==========
    let isResizing = false;
    let resizeDirection = '';
    let resizeWindow = null;
    let resizeStart = { x: 0, y: 0, w: 0, h: 0, top: 0, left: 0 };

    function initResizeHandles() {
      document.querySelectorAll('.window').forEach(win => {
        if (win.querySelector('.resize-handle')) return; // already has handles
        const directions = ['n','s','e','w','ne','nw','se','sw'];
        directions.forEach(dir => {
          const handle = document.createElement('div');
          handle.className = `resize-handle resize-handle-${dir}`;
          handle.addEventListener('mousedown', (e) => startResize(e, win, dir));
          win.appendChild(handle);
        });
      });
    }

    function startResize(e, win, direction) {
      isResizing = true;
      resizeDirection = direction;
      resizeWindow = win;
      resizeStart = {
        x: e.clientX,
        y: e.clientY,
        w: win.offsetWidth,
        h: win.offsetHeight,
        top: win.offsetTop,
        left: win.offsetLeft
      };
      bringToFront(win);
      e.preventDefault();
      e.stopPropagation();
    }

    document.addEventListener('mousemove', (e) => {
      if (!isResizing || !resizeWindow) return;
      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;
      const minW = 300, minH = 200;

      if (resizeDirection.includes('e')) {
        resizeWindow.style.width = Math.max(minW, resizeStart.w + dx) + 'px';
      }
      if (resizeDirection.includes('w')) {
        const newW = Math.max(minW, resizeStart.w - dx);
        resizeWindow.style.width = newW + 'px';
        resizeWindow.style.left = (resizeStart.left + resizeStart.w - newW) + 'px';
      }
      if (resizeDirection.includes('s')) {
        resizeWindow.style.height = Math.max(minH, resizeStart.h + dy) + 'px';
      }
      if (resizeDirection.includes('n')) {
        const newH = Math.max(minH, resizeStart.h - dy);
        resizeWindow.style.height = newH + 'px';
        resizeWindow.style.top = (resizeStart.top + resizeStart.h - newH) + 'px';
      }
    });

    document.addEventListener('mouseup', () => {
      isResizing = false;
      resizeWindow = null;
    });

    // ========== DOUBLE-CLICK TITLEBAR TO MAXIMIZE ==========
    function initTitlebarDblClick() {
      document.querySelectorAll('.window-titlebar').forEach(titlebar => {
        titlebar.addEventListener('dblclick', (e) => {
          const win = titlebar.closest('.window');
          if (win) {
            const id = win.id.replace('window-', '');
            maximizeWindow(id);
          }
        });
      });
    }

    // ========== KEYBOARD SHORTCUTS ==========
    let altTabActive = false;
    let altTabIndex = 0;
    let altTabWindows = [];

    document.addEventListener('keydown', (e) => {
      // Alt+F4: Close active window
      if (e.altKey && e.key === 'F4') {
        e.preventDefault();
        const topWindow = getTopWindow();
        if (topWindow) {
          const id = topWindow.id.replace('window-', '');
          closeWindow(id);
        }
      }

      // Alt+Tab: Task switcher
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        if (!altTabActive) {
          altTabWindows = Array.from(openWindows).filter(id => {
            const win = document.getElementById('window-' + id);
            return win && win.classList.contains('active');
          });
          if (altTabWindows.length > 0) {
            altTabActive = true;
            altTabIndex = 0;
            showTaskSwitcher();
          }
        } else {
          altTabIndex = (altTabIndex + 1) % altTabWindows.length;
          updateTaskSwitcher();
        }
      }

      // Ctrl+Escape: Toggle Start Menu (removed Meta/Win key - too annoying)
      if (e.ctrlKey && e.key === 'Escape') {
        e.preventDefault();
        toggleStartMenu();
      }

      // Escape: close task switcher
      if (e.key === 'Escape' && altTabActive) {
        hideTaskSwitcher();
      }
    });

    document.addEventListener('keyup', (e) => {
      // When Alt is released during Alt+Tab, switch to selected window
      if (e.key === 'Alt' && altTabActive) {
        const selectedId = altTabWindows[altTabIndex];
        if (selectedId) {
          const win = document.getElementById('window-' + selectedId);
          if (win) {
            win.classList.add('active');
            win.classList.remove('minimizing');
            bringToFront(win);
          }
        }
        hideTaskSwitcher();
      }
    });

    function getTopWindow() {
      let topZ = 0;
      let topWin = null;
      openWindows.forEach(id => {
        const win = document.getElementById('window-' + id);
        if (win && win.classList.contains('active')) {
          const z = parseInt(win.style.zIndex) || 0;
          if (z > topZ) { topZ = z; topWin = win; }
        }
      });
      return topWin;
    }

    function showTaskSwitcher() {
      let switcher = document.getElementById('task-switcher');
      if (!switcher) {
        switcher = document.createElement('div');
        switcher.id = 'task-switcher';
        switcher.className = 'task-switcher';
        document.body.appendChild(switcher);
      }
      updateTaskSwitcher();
      switcher.classList.add('active');
    }

    function updateTaskSwitcher() {
      const switcher = document.getElementById('task-switcher');
      if (!switcher) return;

      let html = '';
      altTabWindows.forEach((id, i) => {
        const win = document.getElementById('window-' + id);
        const title = win?.querySelector('.window-title')?.textContent || id;
        const icon = win?.querySelector('.window-titlebar img')?.src || '';
        html += `<div class="task-switcher-item ${i === altTabIndex ? 'selected' : ''}">
          <img src="${icon}" onerror="this.style.display='none'">
          <span>${title}</span>
        </div>`;
      });

      if (altTabWindows[altTabIndex]) {
        const win = document.getElementById('window-' + altTabWindows[altTabIndex]);
        const title = win?.querySelector('.window-title')?.textContent || '';
        html += `<div class="task-switcher-title">${title}</div>`;
      }

      switcher.innerHTML = html;
    }

    function hideTaskSwitcher() {
      altTabActive = false;
      const switcher = document.getElementById('task-switcher');
      if (switcher) switcher.classList.remove('active');
    }

    // ========== CONTEXT MENU HOOK ==========
    document.addEventListener('contextmenu', (e) => {
      if (window.showContextMenu) {
        // Determine context type
        const icon = e.target.closest('.desktop-icon');
        const taskbar = e.target.closest('.taskbar');
        const win = e.target.closest('.window');

        if (icon) {
          e.preventDefault();
          window.showContextMenu(e, 'icon', icon.dataset.window);
        } else if (taskbar) {
          e.preventDefault();
          window.showContextMenu(e, 'taskbar');
        } else if (!win) {
          // Desktop background
          e.preventDefault();
          window.showContextMenu(e, 'desktop');
        }
      }
    });

    // ========== ALL PROGRAMS SUBMENU ==========
    function toggleAllPrograms() {
      const submenu = document.getElementById('all-programs-submenu');
      if (submenu) {
        submenu.classList.toggle('active');
        playClick();
      }
    }

    // ========== ICON SELECTION ==========
    function selectIcon(icon) {
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
      icon.classList.add('selected');
    }

    // Click on empty desktop area deselects all icons
    document.getElementById('desktop').addEventListener('click', function(e) {
      if (e.target === this || e.target.classList.contains('icons-container')) {
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
      }
    });

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

      // Close All Programs submenu when start menu toggles
      const submenu = document.getElementById('all-programs-submenu');
      if (submenu && !menu.classList.contains('active')) {
        submenu.classList.remove('active');
      }
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

    // ========== SCREENSAVER (Starfield) ==========
    let screensaverActive = false;
    let screensaverCanvas, screensaverCtx;
    let stars = [];
    let inactivityTimer;
    const INACTIVITY_TIMEOUT = 60000; // 60 seconds

    function resetInactivityTimer() {
      clearTimeout(inactivityTimer);
      if (screensaverActive) stopScreensaver();
      inactivityTimer = setTimeout(startScreensaver, INACTIVITY_TIMEOUT);
    }

    // Reset on any user activity
    ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
      document.addEventListener(evt, resetInactivityTimer, { passive: true });
    });

    function startScreensaver() {
      screensaverActive = true;
      const ss = document.getElementById('screensaver');
      ss.classList.add('active');

      // Create canvas for starfield
      if (!screensaverCanvas) {
        screensaverCanvas = document.createElement('canvas');
        screensaverCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%';
        ss.innerHTML = '';
        ss.appendChild(screensaverCanvas);
      }
      screensaverCanvas.width = window.innerWidth;
      screensaverCanvas.height = window.innerHeight;
      screensaverCtx = screensaverCanvas.getContext('2d');

      // Init stars
      stars = [];
      for (let i = 0; i < 200; i++) {
        stars.push({
          x: Math.random() * screensaverCanvas.width - screensaverCanvas.width/2,
          y: Math.random() * screensaverCanvas.height - screensaverCanvas.height/2,
          z: Math.random() * 1000
        });
      }

      animateScreensaver();
    }

    function animateScreensaver() {
      if (!screensaverActive) return;
      const ctx = screensaverCtx;
      const w = screensaverCanvas.width;
      const h = screensaverCanvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 0, w, h);

      stars.forEach(star => {
        star.z -= 3;
        if (star.z <= 0) {
          star.x = Math.random() * w - cx;
          star.y = Math.random() * h - cy;
          star.z = 1000;
        }

        const sx = (star.x / star.z) * 300 + cx;
        const sy = (star.y / star.z) * 300 + cy;
        const size = Math.max(0.5, (1 - star.z / 1000) * 3);
        const brightness = Math.min(255, Math.floor((1 - star.z / 1000) * 255));

        ctx.fillStyle = `rgb(${brightness},${brightness},${brightness})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animateScreensaver);
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
        // Also close All Programs submenu
        const submenu = document.getElementById('all-programs-submenu');
        if (submenu) submenu.classList.remove('active');
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

    // ========== SECRET GAMES DESKTOP ==========
    let isGamesMode = false;

    function toggleGamesDesktop() {
      if (isGamesMode) {
        switchToNormalDesktop();
      } else {
        switchToGamesDesktop();
      }
    }

    function switchToGamesDesktop() {
      const desktop = document.getElementById('desktop');
      const normalIconContainers = document.querySelectorAll('.icons-container:not(#games-icons)');
      const gamesIcons = document.getElementById('games-icons');
      const taskbar = document.querySelector('.taskbar');
      const loadingOverlay = document.getElementById('games-loading');

      if (!gamesIcons) return;

      // Show loading bar
      if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        const fill = loadingOverlay.querySelector('.games-load-bar-fill');
        if (fill) {
          fill.style.width = '0%';
          setTimeout(() => { fill.style.width = '100%'; }, 50);
        }
      }

      setTimeout(() => {
        // Hide everything except games
        normalIconContainers.forEach(c => c.style.display = 'none');
        if (taskbar) taskbar.style.display = 'none';
        if (gamesIcons) gamesIcons.style.display = 'flex';

        // Switch wallpaper to classic XP blue
        desktop.classList.add('games-mode');
        isGamesMode = true;

        // Hide loading
        if (loadingOverlay) loadingOverlay.style.display = 'none';

        playEasterEggSound();
      }, 1200);
    }

    function switchToNormalDesktop() {
      const desktop = document.getElementById('desktop');
      const normalIconContainers = document.querySelectorAll('.icons-container:not(#games-icons)');
      const gamesIcons = document.getElementById('games-icons');
      const taskbar = document.querySelector('.taskbar');

      normalIconContainers.forEach(c => c.style.display = 'flex');
      if (gamesIcons) gamesIcons.style.display = 'none';
      if (taskbar) taskbar.style.display = '';

      desktop.classList.remove('games-mode');
      isGamesMode = false;
      playSoftClick();
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

      // Initialize resize handles and titlebar double-click for all windows
      initResizeHandles();
      initTitlebarDblClick();

      // Start the inactivity timer for screensaver
      resetInactivityTimer();

      // Show welcome notification
      setTimeout(() => {
        showNotification('Welcome!', 'Click Start to explore my portfolio.');
      }, 1500);

      // Auto-start music after boot
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

    function initYouTubePlayer() {
      if (musicInitialized) return;
      if (typeof YT === 'undefined' || !YT.Player) return;
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
          onReady: function() {
            ytPlayer.setVolume(50);
            musicInitialized = true;
            isMusicPlaying = false;
          },
          onStateChange: function(event) {
            if (event.data === YT.PlayerState.ENDED) {
              ytPlayer.playVideo();
            }
          }
        }
      });
    }

    // Handle YouTube API - it may have already loaded before this script ran
    window.onYouTubeIframeAPIReady = initYouTubePlayer;
    // If API already loaded (race condition), init now
    if (typeof YT !== 'undefined' && YT.loaded) {
      initYouTubePlayer();
    }
    // Fallback: retry after a few seconds if still not initialized
    setTimeout(function() {
      if (!musicInitialized) initYouTubePlayer();
    }, 3000);

    function toggleMusic() {
      if (!musicInitialized || !ytPlayer) {
        if (typeof YT !== 'undefined' && YT.Player) {
          initYouTubePlayer();
          showNotification('Music', 'Starting music player...');
          setTimeout(toggleMusic, 2000);
        } else {
          showNotification('Music', 'Music player is loading, try again in a moment');
        }
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
        showNotification('Music', 'Now playing: Lofi beats');
      }
    }

    // Muffle music like hearing it through a bathroom wall at the club
    // Drops volume way down and applies low-pass filter effect via YouTube volume
    let isMusicMuffled = false;
    function muffleMusic(muffle) {
      isMusicMuffled = muffle;
      if (!ytPlayer || !ytPlayer.setVolume) return;
      if (muffle) {
        // Drop to ~8% volume - muffled through-the-wall sound
        ytPlayer.setVolume(8);
      } else {
        // Restore to normal
        ytPlayer.setVolume(50);
      }
    }
