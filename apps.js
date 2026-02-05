// ========== XP APPLICATIONS ==========
// Fully functional Notepad, Calculator, Paint, and Minesweeper

// App registry
const XPApps = {};

// Hook into window lifecycle (called by script.js)
window.initApp = function(id) {
  if (XPApps[id] && XPApps[id].init) {
    XPApps[id].init();
  }
};

window.destroyApp = function(id) {
  if (XPApps[id] && XPApps[id].destroy) {
    XPApps[id].destroy();
  }
};


// ================================================================
//  APP 1: NOTEPAD
// ================================================================
XPApps['notepad'] = {
  _listeners: [],

  init() {
    const container = document.querySelector('#window-notepad .window-content');
    if (!container || container.dataset.appInit) return;
    container.dataset.appInit = 'true';

    container.innerHTML = `
      <div class="notepad-menubar">
        <div class="notepad-menu-item" data-menu="file">File</div>
        <div class="notepad-menu-item" data-menu="edit">Edit</div>
        <div class="notepad-menu-item" data-menu="format">Format</div>
        <div class="notepad-menu-item" data-menu="help">Help</div>
      </div>
      <div class="notepad-menu-dropdown" id="notepad-menu-file">
        <div class="notepad-menu-option" data-action="new"><span class="menu-label">New</span><span class="menu-shortcut">Ctrl+N</span></div>
        <div class="notepad-menu-separator"></div>
        <div class="notepad-menu-option" data-action="saveAs"><span class="menu-label">Save As...</span><span class="menu-shortcut">Ctrl+S</span></div>
      </div>
      <div class="notepad-menu-dropdown" id="notepad-menu-edit">
        <div class="notepad-menu-option" data-action="selectAll"><span class="menu-label">Select All</span><span class="menu-shortcut">Ctrl+A</span></div>
        <div class="notepad-menu-option" data-action="copy"><span class="menu-label">Copy</span><span class="menu-shortcut">Ctrl+C</span></div>
        <div class="notepad-menu-option" data-action="cut"><span class="menu-label">Cut</span><span class="menu-shortcut">Ctrl+X</span></div>
        <div class="notepad-menu-option" data-action="paste"><span class="menu-label">Paste</span><span class="menu-shortcut">Ctrl+V</span></div>
        <div class="notepad-menu-separator"></div>
        <div class="notepad-menu-option" data-action="datetime"><span class="menu-label">Time/Date</span><span class="menu-shortcut">F5</span></div>
      </div>
      <div class="notepad-menu-dropdown" id="notepad-menu-format">
        <div class="notepad-menu-option" data-action="toggleWrap" id="notepad-wrap-option">
          <span class="menu-check">&#10003;</span><span class="menu-label">Word Wrap</span>
        </div>
      </div>
      <div class="notepad-menu-dropdown" id="notepad-menu-help">
        <div class="notepad-menu-option" data-action="about"><span class="menu-label">About Notepad</span></div>
      </div>
      <textarea class="notepad-textarea" id="notepad-text" spellcheck="false" wrap="soft">Welcome to Kyle K.'s Portfolio!
======================================

Hey there! I'm Kyle K. -- developer, builder, and lifelong learner.

Currently working on:
  * PepMaxx - Premium peptide tracking app (iOS/Android)
  * Peak Revival-X - TikTok Shop supplements brand
  * Free Meals on Wheels - Non-profit volunteer app
  * sigma-video-gen - AI video generation pipeline

Tech Stack:
  React Native (Expo) | Next.js | Python | PostgreSQL
  Three.js | Supabase | RevenueCat | ElevenLabs AI

Find me:
  GitHub:   github.com/ergophobian
  TikTok:   @ergophobian
  X:        @indefatigabile

Thanks for checking out the portfolio!
Try the other apps -- Calculator, Paint, and Minesweeper!</textarea>
      <div class="notepad-status-bar">
        <span id="notepad-status">Ln 1, Col 1</span>
      </div>
    `;

    // Wire up menu dropdown actions
    container.querySelectorAll('.notepad-menu-option[data-action]').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = opt.dataset.action;
        if (action === 'new') this.newFile();
        else if (action === 'saveAs') this.saveAs();
        else if (action === 'selectAll') this.selectAll();
        else if (action === 'copy') { document.getElementById('notepad-text').focus(); document.execCommand('copy'); }
        else if (action === 'cut') { document.getElementById('notepad-text').focus(); document.execCommand('cut'); }
        else if (action === 'paste') { document.getElementById('notepad-text').focus(); document.execCommand('paste'); }
        else if (action === 'datetime') this.insertDateTime();
        else if (action === 'toggleWrap') this.toggleWrap();
        else if (action === 'about') this.about();
        this.closeMenus();
      });
    });

    // Menu dropdown toggle logic
    container.querySelectorAll('.notepad-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const menuId = 'notepad-menu-' + item.dataset.menu;
        const dropdown = document.getElementById(menuId);
        const wasActive = dropdown.classList.contains('active');

        // Close all dropdowns first
        container.querySelectorAll('.notepad-menu-dropdown').forEach(d => d.classList.remove('active'));
        container.querySelectorAll('.notepad-menu-item').forEach(i => i.classList.remove('active'));

        if (!wasActive) {
          dropdown.classList.add('active');
          item.classList.add('active');
          // Position dropdown under menu item
          const rect = item.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          dropdown.style.left = (rect.left - containerRect.left) + 'px';
          dropdown.style.top = (rect.bottom - containerRect.top) + 'px';
        }
      });

      // Hover to switch menus when one is already open
      item.addEventListener('mouseenter', () => {
        const anyOpen = container.querySelector('.notepad-menu-dropdown.active');
        if (anyOpen) {
          container.querySelectorAll('.notepad-menu-dropdown').forEach(d => d.classList.remove('active'));
          container.querySelectorAll('.notepad-menu-item').forEach(i => i.classList.remove('active'));
          const menuId = 'notepad-menu-' + item.dataset.menu;
          const dropdown = document.getElementById(menuId);
          dropdown.classList.add('active');
          item.classList.add('active');
          const rect = item.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          dropdown.style.left = (rect.left - containerRect.left) + 'px';
          dropdown.style.top = (rect.bottom - containerRect.top) + 'px';
        }
      });
    });

    // Close menus on click outside
    const closeHandler = (e) => {
      if (!e.target.closest('.notepad-menu-item') && !e.target.closest('.notepad-menu-dropdown')) {
        this.closeMenus();
      }
    };
    document.addEventListener('click', closeHandler);
    this._listeners.push({ el: document, type: 'click', fn: closeHandler });

    // Update status bar on cursor position change
    const textarea = document.getElementById('notepad-text');
    const updateStatus = () => {
      const text = textarea.value.substring(0, textarea.selectionStart);
      const lines = text.split('\n');
      const ln = lines.length;
      const col = lines[lines.length - 1].length + 1;
      document.getElementById('notepad-status').textContent = `Ln ${ln}, Col ${col}`;
    };
    textarea.addEventListener('click', updateStatus);
    textarea.addEventListener('keyup', updateStatus);
    textarea.addEventListener('input', updateStatus);

    this._wordWrap = true;
  },

  closeMenus() {
    document.querySelectorAll('.notepad-menu-dropdown').forEach(d => d.classList.remove('active'));
    document.querySelectorAll('.notepad-menu-item').forEach(i => i.classList.remove('active'));
  },

  newFile() {
    document.getElementById('notepad-text').value = '';
  },

  saveAs() {
    const text = document.getElementById('notepad-text').value;
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'untitled.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  },

  selectAll() {
    document.getElementById('notepad-text').select();
  },

  insertDateTime() {
    const ta = document.getElementById('notepad-text');
    const now = new Date();
    const str = now.toLocaleTimeString() + ' ' + now.toLocaleDateString();
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    ta.value = ta.value.substring(0, start) + str + ta.value.substring(end);
    ta.selectionStart = ta.selectionEnd = start + str.length;
    ta.focus();
  },

  toggleWrap() {
    const ta = document.getElementById('notepad-text');
    this._wordWrap = !this._wordWrap;
    const check = document.querySelector('#notepad-wrap-option .menu-check');
    if (this._wordWrap) {
      ta.wrap = 'soft';
      ta.style.whiteSpace = '';
      ta.style.overflowX = '';
      if (check) check.style.visibility = 'visible';
    } else {
      ta.wrap = 'off';
      ta.style.whiteSpace = 'pre';
      ta.style.overflowX = 'auto';
      if (check) check.style.visibility = 'hidden';
    }
  },

  about() {
    alert('Notepad for Kyle\'s XP Portfolio\nA faithful recreation of the classic Windows XP Notepad.');
  },

  destroy() {
    this._listeners.forEach(l => l.el.removeEventListener(l.type, l.fn));
    this._listeners = [];
    const container = document.querySelector('#window-notepad .window-content');
    if (container) {
      container.dataset.appInit = '';
      container.innerHTML = '';
    }
  }
};


// ================================================================
//  APP 2: CALCULATOR
// ================================================================
XPApps['calculator'] = {
  _display: null,
  _currentInput: '0',
  _previousInput: '',
  _operation: null,
  _resetNext: false,
  _memory: 0,
  _history: '',
  _listeners: [],

  init() {
    const container = document.querySelector('#window-calculator .window-content');
    if (!container || container.dataset.appInit) return;
    container.dataset.appInit = 'true';

    container.innerHTML = `
      <div class="calc-body">
        <div class="calc-display-wrap">
          <input type="text" class="calc-display" id="calc-display" value="0" readonly />
        </div>
        <div class="calc-buttons">
          <div class="calc-row">
            <button class="calc-btn calc-mem" data-action="mc">MC</button>
            <button class="calc-btn calc-mem" data-action="mr">MR</button>
            <button class="calc-btn calc-mem" data-action="ms">MS</button>
            <button class="calc-btn calc-mem" data-action="m+">M+</button>
            <button class="calc-btn calc-mem" data-action="m-">M-</button>
          </div>
          <div class="calc-row">
            <button class="calc-btn calc-func" data-action="back">&#9003;</button>
            <button class="calc-btn calc-func" data-action="ce">CE</button>
            <button class="calc-btn calc-func" data-action="c">C</button>
            <button class="calc-btn calc-func" data-action="negate">&plusmn;</button>
            <button class="calc-btn calc-func" data-action="sqrt">&radic;</button>
          </div>
          <div class="calc-row">
            <button class="calc-btn calc-num" data-action="7">7</button>
            <button class="calc-btn calc-num" data-action="8">8</button>
            <button class="calc-btn calc-num" data-action="9">9</button>
            <button class="calc-btn calc-op" data-action="/">/</button>
            <button class="calc-btn calc-op" data-action="%">%</button>
          </div>
          <div class="calc-row">
            <button class="calc-btn calc-num" data-action="4">4</button>
            <button class="calc-btn calc-num" data-action="5">5</button>
            <button class="calc-btn calc-num" data-action="6">6</button>
            <button class="calc-btn calc-op" data-action="*">*</button>
            <button class="calc-btn calc-op" data-action="1/x">1/x</button>
          </div>
          <div class="calc-row">
            <button class="calc-btn calc-num" data-action="1">1</button>
            <button class="calc-btn calc-num" data-action="2">2</button>
            <button class="calc-btn calc-num" data-action="3">3</button>
            <button class="calc-btn calc-op" data-action="-">-</button>
            <button class="calc-btn calc-eq" data-action="=" rowspan="2">=</button>
          </div>
          <div class="calc-row">
            <button class="calc-btn calc-num calc-zero" data-action="0">0</button>
            <button class="calc-btn calc-num" data-action=".">.</button>
            <button class="calc-btn calc-op" data-action="+">+</button>
          </div>
        </div>
      </div>
    `;

    this._display = document.getElementById('calc-display');

    // Attach button events
    container.querySelectorAll('.calc-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleInput(btn.dataset.action);
      });
    });

    // Keyboard support
    const keyHandler = (e) => {
      // Only handle if calculator window is visible/focused
      const win = document.getElementById('window-calculator');
      if (!win || win.style.display === 'none') return;

      const key = e.key;
      if (key >= '0' && key <= '9') this.handleInput(key);
      else if (key === '.') this.handleInput('.');
      else if (key === '+') this.handleInput('+');
      else if (key === '-') this.handleInput('-');
      else if (key === '*') this.handleInput('*');
      else if (key === '/') { e.preventDefault(); this.handleInput('/'); }
      else if (key === '%') this.handleInput('%');
      else if (key === 'Enter' || key === '=') this.handleInput('=');
      else if (key === 'Escape') this.handleInput('c');
      else if (key === 'Backspace') this.handleInput('back');
      else if (key === 'Delete') this.handleInput('ce');
    };
    document.addEventListener('keydown', keyHandler);
    this._listeners.push({ el: document, type: 'keydown', fn: keyHandler });
  },

  handleInput(action) {
    // Digit input
    if (action >= '0' && action <= '9') {
      if (this._resetNext) {
        this._currentInput = action;
        this._resetNext = false;
      } else {
        if (this._currentInput === '0' && action !== '0') {
          this._currentInput = action;
        } else if (this._currentInput !== '0') {
          this._currentInput += action;
        }
      }
      this.updateDisplay();
      return;
    }

    // Decimal point
    if (action === '.') {
      if (this._resetNext) {
        this._currentInput = '0.';
        this._resetNext = false;
      } else if (!this._currentInput.includes('.')) {
        this._currentInput += '.';
      }
      this.updateDisplay();
      return;
    }

    // Clear all
    if (action === 'c') {
      this._currentInput = '0';
      this._previousInput = '';
      this._operation = null;
      this._resetNext = false;
      this.updateDisplay();
      return;
    }

    // Clear entry
    if (action === 'ce') {
      this._currentInput = '0';
      this._resetNext = false;
      this.updateDisplay();
      return;
    }

    // Backspace
    if (action === 'back') {
      if (this._resetNext) return;
      this._currentInput = this._currentInput.slice(0, -1) || '0';
      this.updateDisplay();
      return;
    }

    // Negate
    if (action === 'negate') {
      if (this._currentInput !== '0') {
        if (this._currentInput.startsWith('-')) {
          this._currentInput = this._currentInput.substring(1);
        } else {
          this._currentInput = '-' + this._currentInput;
        }
      }
      this.updateDisplay();
      return;
    }

    // Square root
    if (action === 'sqrt') {
      const val = parseFloat(this._currentInput);
      if (val < 0) {
        this._currentInput = 'Error';
      } else {
        this._currentInput = String(Math.sqrt(val));
      }
      this._resetNext = true;
      this.updateDisplay();
      return;
    }

    // Reciprocal
    if (action === '1/x') {
      const val = parseFloat(this._currentInput);
      if (val === 0) {
        this._currentInput = 'Error';
      } else {
        this._currentInput = String(1 / val);
      }
      this._resetNext = true;
      this.updateDisplay();
      return;
    }

    // Percent
    if (action === '%') {
      const current = parseFloat(this._currentInput);
      const prev = parseFloat(this._previousInput);
      if (this._previousInput && this._operation) {
        this._currentInput = String((prev * current) / 100);
      } else {
        this._currentInput = String(current / 100);
      }
      this.updateDisplay();
      return;
    }

    // Memory operations
    if (action === 'mc') { this._memory = 0; return; }
    if (action === 'mr') {
      this._currentInput = String(this._memory);
      this._resetNext = true;
      this.updateDisplay();
      return;
    }
    if (action === 'ms') { this._memory = parseFloat(this._currentInput); return; }
    if (action === 'm+') { this._memory += parseFloat(this._currentInput); return; }
    if (action === 'm-') { this._memory -= parseFloat(this._currentInput); return; }

    // Operators: +, -, *, /
    if (['+', '-', '*', '/'].includes(action)) {
      if (this._operation && !this._resetNext) {
        this.calculate();
      }
      this._previousInput = this._currentInput;
      this._operation = action;
      this._resetNext = true;
      return;
    }

    // Equals
    if (action === '=') {
      if (this._operation) {
        this.calculate();
        this._operation = null;
        this._previousInput = '';
        this._resetNext = true;
      }
      return;
    }
  },

  calculate() {
    const prev = parseFloat(this._previousInput);
    const current = parseFloat(this._currentInput);
    let result = 0;

    switch (this._operation) {
      case '+': result = prev + current; break;
      case '-': result = prev - current; break;
      case '*': result = prev * current; break;
      case '/':
        if (current === 0) {
          this._currentInput = 'Cannot divide by zero';
          this.updateDisplay();
          this._resetNext = true;
          return;
        }
        result = prev / current;
        break;
    }

    // Handle floating point precision
    this._currentInput = String(parseFloat(result.toPrecision(12)));
    this.updateDisplay();
  },

  updateDisplay() {
    if (this._display) {
      let val = this._currentInput;
      // Format number with commas for display (but not for error messages)
      if (!isNaN(parseFloat(val)) && isFinite(val)) {
        const parts = val.split('.');
        // Only add commas to integer part if it's reasonable length
        if (parts[0].replace('-', '').length <= 15) {
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
        val = parts.join('.');
      }
      this._display.value = val;
    }
  },

  destroy() {
    this._listeners.forEach(l => l.el.removeEventListener(l.type, l.fn));
    this._listeners = [];
    this._currentInput = '0';
    this._previousInput = '';
    this._operation = null;
    this._resetNext = false;
    const container = document.querySelector('#window-calculator .window-content');
    if (container) {
      container.dataset.appInit = '';
      container.innerHTML = '';
    }
  }
};


// ================================================================
//  APP 3: PAINT
// ================================================================
XPApps['paint'] = {
  _canvas: null,
  _ctx: null,
  _drawing: false,
  _tool: 'pencil',
  _color: '#000000',
  _lineWidth: 3,
  _startX: 0,
  _startY: 0,
  _snapshot: null,
  _listeners: [],

  COLORS: [
    '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080',
    '#FFFFFF', '#C0C0C0', '#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF'
  ],

  TOOLS: [
    { id: 'pencil', label: 'Pencil', icon: '&#9998;' },
    { id: 'brush', label: 'Brush', icon: '&#9999;' },
    { id: 'eraser', label: 'Eraser', icon: '&#9114;' },
    { id: 'line', label: 'Line', icon: '&#9585;' },
    { id: 'rect', label: 'Rectangle', icon: '&#9634;' },
    { id: 'ellipse', label: 'Ellipse', icon: '&#9711;' },
    { id: 'fill', label: 'Fill', icon: '&#9697;' },
  ],

  init() {
    const container = document.querySelector('#window-paint .window-content');
    if (!container || container.dataset.appInit) return;
    container.dataset.appInit = 'true';

    // Build toolbar
    let toolsHTML = this.TOOLS.map(t =>
      `<button class="paint-tool-btn ${t.id === 'pencil' ? 'active' : ''}" data-tool="${t.id}" title="${t.label}">${t.icon}</button>`
    ).join('');

    // Build color palette
    let colorsHTML = this.COLORS.map(c =>
      `<div class="paint-color-swatch ${c === '#000000' ? 'active' : ''}" data-color="${c}" style="background-color:${c}" title="${c}"></div>`
    ).join('');

    container.innerHTML = `
      <div class="paint-app">
        <div class="paint-toolbar">
          <div class="paint-tools">
            ${toolsHTML}
          </div>
          <div class="paint-separator"></div>
          <div class="paint-line-widths">
            <button class="paint-width-btn" data-width="1" title="1px">
              <span style="display:block;width:16px;height:1px;background:#000;margin:auto"></span>
            </button>
            <button class="paint-width-btn active" data-width="3" title="3px">
              <span style="display:block;width:16px;height:3px;background:#000;margin:auto"></span>
            </button>
            <button class="paint-width-btn" data-width="5" title="5px">
              <span style="display:block;width:16px;height:5px;background:#000;margin:auto"></span>
            </button>
          </div>
          <div class="paint-separator"></div>
          <button class="paint-action-btn" id="paint-clear-btn" title="Clear Canvas">Clear</button>
          <button class="paint-action-btn" id="paint-save-btn" title="Save as PNG">Save</button>
        </div>
        <div class="paint-canvas-wrap">
          <canvas id="paint-canvas" width="560" height="340"></canvas>
        </div>
        <div class="paint-bottom-bar">
          <div class="paint-active-colors">
            <div class="paint-active-color-primary" id="paint-primary-color" style="background-color:#000000" title="Primary Color"></div>
          </div>
          <div class="paint-palette">
            ${colorsHTML}
          </div>
          <div class="paint-coords" id="paint-coords">0, 0 px</div>
        </div>
      </div>
    `;

    this._canvas = document.getElementById('paint-canvas');
    this._ctx = this._canvas.getContext('2d');

    // Fill with white background
    this._ctx.fillStyle = '#FFFFFF';
    this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

    // Tool selection
    container.querySelectorAll('.paint-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.paint-tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._tool = btn.dataset.tool;
        this._canvas.style.cursor = this._tool === 'eraser' ? 'cell' : 'crosshair';
      });
    });

    // Color selection
    container.querySelectorAll('.paint-color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        container.querySelectorAll('.paint-color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        this._color = swatch.dataset.color;
        document.getElementById('paint-primary-color').style.backgroundColor = this._color;
      });
    });

    // Line width selection
    container.querySelectorAll('.paint-width-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.paint-width-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._lineWidth = parseInt(btn.dataset.width);
      });
    });

    // Clear canvas
    document.getElementById('paint-clear-btn').addEventListener('click', () => {
      this._ctx.fillStyle = '#FFFFFF';
      this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
    });

    // Save canvas
    document.getElementById('paint-save-btn').addEventListener('click', () => {
      const a = document.createElement('a');
      a.download = 'painting.png';
      a.href = this._canvas.toDataURL('image/png');
      a.click();
    });

    // Canvas drawing events
    this._canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this._canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this._canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this._canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));

    // Coordinate display
    this._canvas.addEventListener('mousemove', (e) => {
      const rect = this._canvas.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      document.getElementById('paint-coords').textContent = `${x}, ${y} px`;
    });

    this._canvas.style.cursor = 'crosshair';
  },

  getCanvasCoords(e) {
    const rect = this._canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  },

  onMouseDown(e) {
    this._drawing = true;
    const pos = this.getCanvasCoords(e);
    this._startX = pos.x;
    this._startY = pos.y;

    // Save canvas state for shape tools
    if (['line', 'rect', 'ellipse'].includes(this._tool)) {
      this._snapshot = this._ctx.getImageData(0, 0, this._canvas.width, this._canvas.height);
    }

    if (this._tool === 'fill') {
      this.floodFill(Math.round(pos.x), Math.round(pos.y), this._color);
      this._drawing = false;
      return;
    }

    if (this._tool === 'pencil' || this._tool === 'brush' || this._tool === 'eraser') {
      this._ctx.beginPath();
      this._ctx.moveTo(pos.x, pos.y);
      this._ctx.lineCap = 'round';
      this._ctx.lineJoin = 'round';

      if (this._tool === 'eraser') {
        this._ctx.strokeStyle = '#FFFFFF';
        this._ctx.lineWidth = this._lineWidth * 4;
      } else if (this._tool === 'brush') {
        this._ctx.strokeStyle = this._color;
        this._ctx.lineWidth = this._lineWidth * 3;
      } else {
        this._ctx.strokeStyle = this._color;
        this._ctx.lineWidth = this._lineWidth;
      }
    }
  },

  onMouseMove(e) {
    if (!this._drawing) return;
    const pos = this.getCanvasCoords(e);

    if (this._tool === 'pencil' || this._tool === 'brush' || this._tool === 'eraser') {
      this._ctx.lineTo(pos.x, pos.y);
      this._ctx.stroke();
    } else if (['line', 'rect', 'ellipse'].includes(this._tool)) {
      // Restore snapshot then draw preview
      this._ctx.putImageData(this._snapshot, 0, 0);
      this._ctx.strokeStyle = this._color;
      this._ctx.lineWidth = this._lineWidth;
      this._ctx.lineCap = 'round';
      this._ctx.lineJoin = 'round';

      if (this._tool === 'line') {
        this._ctx.beginPath();
        this._ctx.moveTo(this._startX, this._startY);
        this._ctx.lineTo(pos.x, pos.y);
        this._ctx.stroke();
      } else if (this._tool === 'rect') {
        this._ctx.beginPath();
        this._ctx.strokeRect(
          this._startX, this._startY,
          pos.x - this._startX, pos.y - this._startY
        );
      } else if (this._tool === 'ellipse') {
        this.drawEllipse(
          this._startX, this._startY,
          pos.x, pos.y
        );
      }
    }
  },

  onMouseUp(e) {
    if (!this._drawing) return;
    this._drawing = false;

    if (this._tool === 'pencil' || this._tool === 'brush' || this._tool === 'eraser') {
      this._ctx.closePath();
    }
    // For shape tools the final shape is already drawn in onMouseMove
  },

  drawEllipse(x1, y1, x2, y2) {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const rx = Math.abs(x2 - x1) / 2;
    const ry = Math.abs(y2 - y1) / 2;
    this._ctx.beginPath();
    this._ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    this._ctx.stroke();
  },

  floodFill(startX, startY, fillColor) {
    const canvas = this._canvas;
    const ctx = this._ctx;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width;
    const h = canvas.height;

    // Parse fill color
    const tmp = document.createElement('canvas').getContext('2d');
    tmp.fillStyle = fillColor;
    tmp.fillRect(0, 0, 1, 1);
    const fc = tmp.getImageData(0, 0, 1, 1).data;

    const idx = (startY * w + startX) * 4;
    const tr = data[idx], tg = data[idx + 1], tb = data[idx + 2], ta = data[idx + 3];

    // Don't fill if same color
    if (tr === fc[0] && tg === fc[1] && tb === fc[2] && ta === fc[3]) return;

    const stack = [[startX, startY]];
    const visited = new Uint8Array(w * h);

    const match = (i) => {
      return data[i] === tr && data[i + 1] === tg && data[i + 2] === tb && data[i + 3] === ta;
    };

    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const i = (y * w + x) * 4;
      const vi = y * w + x;

      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      if (visited[vi]) continue;
      if (!match(i)) continue;

      visited[vi] = 1;
      data[i] = fc[0];
      data[i + 1] = fc[1];
      data[i + 2] = fc[2];
      data[i + 3] = fc[3];

      stack.push([x + 1, y]);
      stack.push([x - 1, y]);
      stack.push([x, y + 1]);
      stack.push([x, y - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  },

  destroy() {
    this._listeners.forEach(l => l.el.removeEventListener(l.type, l.fn));
    this._listeners = [];
    this._drawing = false;
    this._canvas = null;
    this._ctx = null;
    const container = document.querySelector('#window-paint .window-content');
    if (container) {
      container.dataset.appInit = '';
      container.innerHTML = '';
    }
  }
};


// ================================================================
//  APP 4: MINESWEEPER
// ================================================================
XPApps['minesweeper'] = {
  ROWS: 9,
  COLS: 9,
  MINES: 10,
  _board: [],
  _revealed: [],
  _flagged: [],
  _gameOver: false,
  _gameWon: false,
  _firstClick: true,
  _timer: 0,
  _timerInterval: null,
  _minesLeft: 10,
  _listeners: [],
  _mouseDown: false,

  NUMBER_COLORS: {
    1: '#0000FF',
    2: '#008000',
    3: '#FF0000',
    4: '#000080',
    5: '#800000',
    6: '#008080',
    7: '#000000',
    8: '#808080'
  },

  init() {
    const container = document.querySelector('#window-minesweeper .window-content');
    if (!container || container.dataset.appInit) return;
    container.dataset.appInit = 'true';

    container.innerHTML = `
      <div class="mine-app">
        <div class="mine-header">
          <div class="mine-counter" id="mine-count">010</div>
          <button class="mine-smiley" id="mine-smiley">&#128578;</button>
          <div class="mine-counter" id="mine-timer">000</div>
        </div>
        <div class="mine-board" id="mine-board"></div>
      </div>
    `;

    // Smiley restart
    document.getElementById('mine-smiley').addEventListener('click', () => {
      this.resetGame();
    });

    // Track mouse for smiley expression
    const boardEl = document.getElementById('mine-board');
    boardEl.addEventListener('mousedown', (e) => {
      if (e.button === 0 && !this._gameOver && !this._gameWon) {
        this._mouseDown = true;
        document.getElementById('mine-smiley').innerHTML = '&#128558;'; // surprised
      }
    });

    const upHandler = () => {
      if (this._mouseDown && !this._gameOver && !this._gameWon) {
        this._mouseDown = false;
        document.getElementById('mine-smiley').innerHTML = '&#128578;'; // normal
      }
    };
    document.addEventListener('mouseup', upHandler);
    this._listeners.push({ el: document, type: 'mouseup', fn: upHandler });

    // Prevent context menu on right-click
    boardEl.addEventListener('contextmenu', (e) => e.preventDefault());

    this.resetGame();
  },

  resetGame() {
    this._board = [];
    this._revealed = [];
    this._flagged = [];
    this._gameOver = false;
    this._gameWon = false;
    this._firstClick = true;
    this._minesLeft = this.MINES;
    this._timer = 0;
    this._mouseDown = false;

    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }

    // Initialize empty board
    for (let r = 0; r < this.ROWS; r++) {
      this._board[r] = [];
      this._revealed[r] = [];
      this._flagged[r] = [];
      for (let c = 0; c < this.COLS; c++) {
        this._board[r][c] = 0;
        this._revealed[r][c] = false;
        this._flagged[r][c] = false;
      }
    }

    this.updateCounter('mine-count', this._minesLeft);
    this.updateCounter('mine-timer', 0);

    const smiley = document.getElementById('mine-smiley');
    if (smiley) smiley.innerHTML = '&#128578;'; // normal smiley

    this.renderBoard();
  },

  placeMines(safeRow, safeCol) {
    // Clear board
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        this._board[r][c] = 0;
      }
    }

    let placed = 0;
    while (placed < this.MINES) {
      const r = Math.floor(Math.random() * this.ROWS);
      const c = Math.floor(Math.random() * this.COLS);
      // Don't place mine on safe cell or adjacent cells
      if (Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1) continue;
      if (this._board[r][c] === -1) continue;
      this._board[r][c] = -1;
      placed++;
    }

    // Calculate numbers
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this._board[r][c] === -1) continue;
        let count = 0;
        this.forEachNeighbor(r, c, (nr, nc) => {
          if (this._board[nr][nc] === -1) count++;
        });
        this._board[r][c] = count;
      }
    }
  },

  forEachNeighbor(row, col, callback) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < this.ROWS && nc >= 0 && nc < this.COLS) {
          callback(nr, nc);
        }
      }
    }
  },

  renderBoard() {
    const boardEl = document.getElementById('mine-board');
    if (!boardEl) return;

    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${this.COLS}, 26px)`;
    boardEl.style.gridTemplateRows = `repeat(${this.ROWS}, 26px)`;

    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'mine-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;

        if (this._revealed[r][c]) {
          cell.classList.add('revealed');
          const val = this._board[r][c];
          if (val === -1) {
            cell.classList.add('mine');
            cell.innerHTML = '&#128163;'; // bomb
          } else if (val > 0) {
            cell.textContent = val;
            cell.style.color = this.NUMBER_COLORS[val] || '#000';
            cell.style.fontWeight = 'bold';
          }
        } else if (this._flagged[r][c]) {
          cell.classList.add('flagged');
          cell.innerHTML = '&#128681;'; // flag
        }

        // Left click to reveal
        cell.addEventListener('mousedown', (e) => {
          if (e.button === 0) {
            this.revealCell(r, c);
          } else if (e.button === 2) {
            this.toggleFlag(r, c);
          }
        });

        boardEl.appendChild(cell);
      }
    }
  },

  revealCell(row, col) {
    if (this._gameOver || this._gameWon) return;
    if (this._revealed[row][col] || this._flagged[row][col]) return;

    if (this._firstClick) {
      this._firstClick = false;
      this.placeMines(row, col);
      this.startTimer();
    }

    this._revealed[row][col] = true;

    // Hit a mine
    if (this._board[row][col] === -1) {
      this._gameOver = true;
      this.onLose(row, col);
      return;
    }

    // Cascade reveal for empty cells
    if (this._board[row][col] === 0) {
      this.forEachNeighbor(row, col, (nr, nc) => {
        if (!this._revealed[nr][nc] && !this._flagged[nr][nc]) {
          this.revealCell(nr, nc);
        }
      });
    }

    // Check for win
    this.checkWin();
    this.renderBoard();
  },

  toggleFlag(row, col) {
    if (this._gameOver || this._gameWon) return;
    if (this._revealed[row][col]) return;

    this._flagged[row][col] = !this._flagged[row][col];
    this._minesLeft += this._flagged[row][col] ? -1 : 1;
    this.updateCounter('mine-count', this._minesLeft);
    this.renderBoard();
  },

  checkWin() {
    let revealedCount = 0;
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this._revealed[r][c]) revealedCount++;
      }
    }
    if (revealedCount === this.ROWS * this.COLS - this.MINES) {
      this._gameWon = true;
      this.onWin();
    }
  },

  onWin() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }

    // Flag all remaining mines
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this._board[r][c] === -1) {
          this._flagged[r][c] = true;
        }
      }
    }
    this._minesLeft = 0;
    this.updateCounter('mine-count', 0);

    const smiley = document.getElementById('mine-smiley');
    if (smiley) smiley.innerHTML = '&#128526;'; // cool sunglasses

    this.renderBoard();
  },

  onLose(hitRow, hitCol) {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }

    // Reveal all mines
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this._board[r][c] === -1) {
          this._revealed[r][c] = true;
        }
      }
    }

    const smiley = document.getElementById('mine-smiley');
    if (smiley) smiley.innerHTML = '&#128128;'; // skull

    this.renderBoard();

    // Highlight the clicked mine
    const boardEl = document.getElementById('mine-board');
    if (boardEl) {
      const hitCell = boardEl.querySelector(`[data-row="${hitRow}"][data-col="${hitCol}"]`);
      if (hitCell) {
        hitCell.classList.add('mine-hit');
        hitCell.innerHTML = '&#128165;'; // explosion
      }
    }
  },

  startTimer() {
    if (this._timerInterval) return;
    this._timer = 0;
    this._timerInterval = setInterval(() => {
      this._timer++;
      if (this._timer > 999) this._timer = 999;
      this.updateCounter('mine-timer', this._timer);
    }, 1000);
  },

  updateCounter(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const v = Math.max(0, Math.min(999, value));
    el.textContent = String(v).padStart(3, '0');
  },

  destroy() {
    this._listeners.forEach(l => l.el.removeEventListener(l.type, l.fn));
    this._listeners = [];
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
    const container = document.querySelector('#window-minesweeper .window-content');
    if (container) {
      container.dataset.appInit = '';
      container.innerHTML = '';
    }
  }
};
