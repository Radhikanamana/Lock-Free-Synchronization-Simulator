/**
 * ═══════════════════════════════════════════════════════════
 *  Lock-Free Synchronization Simulator — simulator.js
 *  Author: Your Name
 *
 *  Simulates three concurrency models:
 *    1. Lock-free (Compare-And-Swap / CAS)
 *    2. Mutex (blocking lock)
 *    3. Race condition (no synchronization)
 *
 *  Each "thread" is a JS object scheduled with setTimeout.
 *  The shared counter is a plain JS variable that all threads
 *  compete to increment.
 * ═══════════════════════════════════════════════════════════
 */

"use strict";

// ── Global simulation state ────────────────────────────────
let mode          = 'lockfree';   // current sync mode
let running       = false;        // is simulation active?
let paused        = false;        // is simulation paused?
let sharedCounter = 0;            // THE shared variable all threads fight over
let threads       = [];           // array of thread objects
let timers        = [];           // all active setTimeout handles (for cleanup)
let mutexLocked   = false;        // is the mutex currently held?
let mutexQueue    = [];           // threads waiting for the mutex
let speedMs       = 500;          // base delay in ms (lower = faster)

// Accumulated stats per session (persist across resets for comparison bars)
let mutexOps = 0;
let lfOps    = 0;

// Per-run stats (reset on resetSim)
let stats = { ops: 0, retries: 0, lost: 0 };

const MAX_LOG     = 50;   // max log entries to keep
const MAX_THREADS = 6;    // upper limit for thread count
const MIN_THREADS = 1;    // lower limit

// ════════════════════════════════════════════════════════════
// MODE
// ════════════════════════════════════════════════════════════

/**
 * Switch between 'lockfree', 'mutex', or 'race' modes.
 * Resets the simulation when called.
 * @param {string} m - mode identifier
 */
function setMode(m) {
  mode = m;

  // Update active state on mode buttons
  ['lockfree', 'mutex', 'race'].forEach(x => {
    document.getElementById('btn-' + x).classList.toggle('active', x === m);
  });

  // Update statistics label
  document.getElementById('stat-mode').textContent =
    m === 'lockfree' ? 'lock-free' : m;

  // Hide CAS panel in mutex mode (CAS doesn't apply)
  document.getElementById('cas-panel').style.display =
    (m === 'mutex') ? 'none' : '';

  resetSim();
}

// ════════════════════════════════════════════════════════════
// THREAD MANAGEMENT
// ════════════════════════════════════════════════════════════

/**
 * Create n fresh thread objects and render them.
 * @param {number} n - number of threads to create
 */
function initThreads(n) {
  threads = [];
  for (let i = 0; i < n; i++) {
    threads.push({
      id:       i + 1,
      state:    'idle',   // idle | running | success | failed | waiting
      retries:  0,
      progress: 0
    });
  }
  renderThreads();
}

/**
 * Rebuild the entire threads panel from scratch.
 */
function renderThreads() {
  const panel = document.getElementById('threads-panel');
  panel.innerHTML = '';

  threads.forEach(t => {
    const div = document.createElement('div');
    div.className = 'thread-box ' + t.state;
    div.id = 'thread-' + t.id;
    div.innerHTML = `
      <div class="thread-header">
        <span class="thread-name">Thread ${t.id}</span>
        <div class="thread-dot"></div>
      </div>
      <div class="thread-meta">
        <span>State: <b id="tstate-${t.id}">${capitalize(t.state)}</b></span>
        <span>Retries: <b id="tretry-${t.id}">${t.retries}</b></span>
      </div>
      <div class="progress-track">
        <div class="progress-bar" id="prog-${t.id}" style="width:${t.progress}%"></div>
      </div>`;
    panel.appendChild(div);
  });
}

/**
 * Update a single thread's visual state without re-rendering all threads.
 * @param {object} t - thread object
 */
function updateThread(t) {
  const el   = document.getElementById('thread-' + t.id);
  const sEl  = document.getElementById('tstate-'  + t.id);
  const rEl  = document.getElementById('tretry-'  + t.id);
  const pEl  = document.getElementById('prog-'    + t.id);
  if (!el) return;

  el.className = 'thread-box ' + t.state;
  if (sEl) sEl.textContent = capitalize(t.state);
  if (rEl) rEl.textContent = t.retries;
  if (pEl) pEl.style.width = t.progress + '%';
}

/**
 * Add one more thread (max MAX_THREADS).
 */
function addThread() {
  if (threads.length >= MAX_THREADS) return;
  const t = { id: threads.length + 1, state: 'idle', retries: 0, progress: 0 };
  threads.push(t);
  renderThreads();
  // If simulation is already running, immediately schedule the new thread
  if (running) scheduleThread(t);
}

/**
 * Remove the last thread (min MIN_THREADS).
 */
function removeThread() {
  if (threads.length <= MIN_THREADS) return;
  threads.pop();
  renderThreads();
}

// ════════════════════════════════════════════════════════════
// LOGGING
// ════════════════════════════════════════════════════════════

/**
 * Prepend a timestamped log entry to the log panel.
 * @param {string} msg   - message text
 * @param {string} type  - css class: 'ok' | 'err' | 'info' | ''
 */
function log(msg, type) {
  type = type || '';
  const now = new Date();
  const ts  = now.toLocaleTimeString('en', {
    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const el  = document.getElementById('log-entries');
  const div = document.createElement('div');
  div.className   = 'log-entry ' + type;
  div.textContent = '[' + ts + '] ' + msg;
  el.prepend(div);

  // Trim old entries
  const all = el.querySelectorAll('.log-entry');
  if (all.length > MAX_LOG) all[all.length - 1].remove();
}

// ════════════════════════════════════════════════════════════
// COUNTER DISPLAY
// ════════════════════════════════════════════════════════════

/**
 * Update the large shared counter display with a flash animation.
 * @param {number}  val       - new counter value
 * @param {string}  owner     - label shown below the counter
 * @param {boolean} conflict  - true = flash red (race condition)
 */
function flashCounter(val, owner, conflict) {
  sharedCounter = val;
  const el = document.getElementById('counter-val');
  el.textContent = val;
  el.className = 'counter-value ' + (conflict ? 'conflict' : 'flash');
  setTimeout(function() { el.className = 'counter-value'; }, 450);
  document.getElementById('counter-owner').textContent = owner || '—';
}

// ════════════════════════════════════════════════════════════
// CAS PANEL
// ════════════════════════════════════════════════════════════

/**
 * Update the CAS operation panel.
 * @param {number}  exp     - expected value the thread read
 * @param {number}  cur     - actual current value of counter
 * @param {number}  nv      - new value to write (exp + 1)
 * @param {boolean} ok      - did CAS succeed?
 * @param {number}  retries - retry count for this thread
 */
function showCAS(exp, cur, nv, ok, retries) {
  document.getElementById('cas-exp').textContent     = exp;
  document.getElementById('cas-cur').textContent     = cur;
  document.getElementById('cas-new').textContent     = nv;
  document.getElementById('cas-retries').textContent = retries;

  const r = document.getElementById('cas-result');
  r.className   = 'cas-result ' + (ok ? 'ok' : 'fail');
  r.textContent = ok
    ? '✓ CAS success — counter updated'
    : '✗ CAS failed — retrying...';
}

// ════════════════════════════════════════════════════════════
// STATISTICS & BARS
// ════════════════════════════════════════════════════════════

/**
 * Refresh all stats labels and throughput bars.
 */
function updateStats() {
  document.getElementById('stat-ops').textContent     = stats.ops;
  document.getElementById('stat-retries').textContent = stats.retries;
  document.getElementById('stat-lost').textContent    = stats.lost;

  // Throughput bars: compare mutex vs lock-free ops (session total)
  const ref = Math.max(mutexOps, lfOps, 1);
  document.getElementById('bar-m').style.width     = Math.round(mutexOps / ref * 100) + '%';
  document.getElementById('bar-lf').style.width    = Math.round(lfOps    / ref * 100) + '%';
  document.getElementById('bar-m-val').textContent  = mutexOps;
  document.getElementById('bar-lf-val').textContent = lfOps;
}

// ════════════════════════════════════════════════════════════
// SPEED CONTROL
// ════════════════════════════════════════════════════════════

/**
 * Map slider value (1–5) to base delay in milliseconds.
 * @param {number} v - slider value 1..5
 */
function setSpeed(v) {
  var delays = [1200, 800, 500, 300, 150];
  speedMs = delays[v - 1];
  document.getElementById('speed-label').textContent = v + '×';
}

// ════════════════════════════════════════════════════════════
// SIMULATION — LOCK-FREE (CAS)
// ════════════════════════════════════════════════════════════

/**
 * One iteration of a lock-free increment for thread t.
 *
 * Algorithm:
 *   1. Read current counter into readVal
 *   2. After a random delay (simulating "doing work"), attempt CAS:
 *      IF counter == readVal  →  set counter = readVal + 1  (success)
 *      ELSE                   →  another thread changed it, retry
 *
 * @param {object} t - thread object
 */
function runLockFree(t) {
  if (!running || paused) return;

  t.state    = 'running';
  t.progress = 20;
  updateThread(t);

  // Step 1: Read the shared variable
  var readVal = sharedCounter;
  log('Thread ' + t.id + ' read counter = ' + readVal, 'info');

  // Step 2: Simulate some work time, then attempt CAS
  var delay = speedMs * (0.6 + Math.random() * 0.7);

  var timer = setTimeout(function() {
    if (!running || paused) return;

    var cur = sharedCounter;   // what is the counter NOW?
    var nv  = readVal + 1;     // value we want to write
    var ok  = (cur === readVal); // CAS check: expected == current?

    showCAS(readVal, cur, nv, ok, t.retries);

    if (ok) {
      // ── CAS SUCCESS ──
      sharedCounter = nv;
      t.state    = 'success';
      t.progress = 100;
      t.retries  = 0;
      updateThread(t);
      flashCounter(nv, 'Thread ' + t.id, false);
      log('Thread ' + t.id + ' CAS success → counter = ' + nv, 'ok');
      stats.ops++;
      lfOps++;
      updateStats();

      // Reset to idle after short pause
      var rt = setTimeout(function() {
        t.state    = 'idle';
        t.progress = 0;
        updateThread(t);
      }, speedMs * 0.5);
      timers.push(rt);

    } else {
      // ── CAS FAILURE — retry ──
      t.state = 'failed';
      t.retries++;
      t.progress = 45;
      updateThread(t);
      log('Thread ' + t.id + ' CAS failed (expected ' + readVal + ', found ' + cur + ') — retry #' + t.retries, 'err');
      stats.retries++;
      updateStats();

      var retryTimer = setTimeout(function() {
        if (running && !paused) runLockFree(t);
      }, speedMs * 0.3);
      timers.push(retryTimer);
    }
  }, delay);

  timers.push(timer);
}

// ════════════════════════════════════════════════════════════
// SIMULATION — MUTEX
// ════════════════════════════════════════════════════════════

/**
 * One iteration of a mutex-protected increment for thread t.
 *
 * Algorithm:
 *   1. Try to acquire the mutex lock
 *   2. If locked: join the waiting queue
 *   3. If free: lock it, read+increment+write, release lock
 *   4. On release: wake the next thread in queue
 *
 * @param {object} t - thread object
 */
function runMutex(t) {
  if (!running || paused) return;

  // If mutex is already held, queue this thread
  if (mutexLocked) {
    t.state    = 'waiting';
    t.progress = 10;
    updateThread(t);
    log('Thread ' + t.id + ' waiting for mutex lock...', '');
    mutexQueue.push(t);
    return;
  }

  // Acquire the mutex
  mutexLocked = true;
  document.getElementById('mutex-badge').classList.add('visible');
  t.state    = 'running';
  t.progress = 35;
  updateThread(t);
  log('Thread ' + t.id + ' acquired mutex lock', 'info');

  var delay = speedMs * (0.7 + Math.random() * 0.5);

  var timer = setTimeout(function() {
    if (!running) return;

    // Critical section: safe to increment
    var nv = sharedCounter + 1;
    flashCounter(nv, 'Thread ' + t.id, false);
    t.state    = 'success';
    t.progress = 100;
    t.retries  = 0;
    updateThread(t);
    log('Thread ' + t.id + ' released mutex — counter = ' + nv, 'ok');
    stats.ops++;
    mutexOps++;
    updateStats();

    // Release the mutex
    mutexLocked = false;
    document.getElementById('mutex-badge').classList.remove('visible');

    // Wake the next waiting thread (if any)
    var next = mutexQueue.shift();
    if (next) {
      var nt = setTimeout(function() { runMutex(next); }, speedMs * 0.1);
      timers.push(nt);
    }

    // Reset to idle
    var rt = setTimeout(function() {
      t.state    = 'idle';
      t.progress = 0;
      updateThread(t);
    }, speedMs * 0.4);
    timers.push(rt);

  }, delay);

  timers.push(timer);
}

// ════════════════════════════════════════════════════════════
// SIMULATION — RACE CONDITION
// ════════════════════════════════════════════════════════════

/**
 * One iteration of an UNSAFE increment (no synchronization).
 *
 * This demonstrates what happens without any locking:
 *   1. Thread reads value
 *   2. (Some time passes — another thread may write in between)
 *   3. Thread writes readVal + 1
 *   → If counter changed between read and write, update is LOST
 *
 * @param {object} t - thread object
 */
function runRace(t) {
  if (!running || paused) return;

  t.state    = 'running';
  t.progress = 20;
  updateThread(t);

  var readVal = sharedCounter;
  log('Thread ' + t.id + ' read counter = ' + readVal, 'info');

  // Wider random delay increases chance of collision between threads
  var delay = speedMs * (0.4 + Math.random() * 1.1);

  var timer = setTimeout(function() {
    if (!running || paused) return;

    if (sharedCounter !== readVal) {
      // ── RACE CONDITION DETECTED ──
      stats.lost++;
      t.state    = 'failed';
      t.progress = 50;
      updateThread(t);
      log('Thread ' + t.id + ' LOST UPDATE! (read ' + readVal + ', actual is ' + sharedCounter + ')', 'err');
      flashCounter(sharedCounter, 'Thread ' + t.id + ' (stale)', true);
      updateStats();
      document.getElementById('race-badge').classList.add('visible');

      var rt = setTimeout(function() {
        t.state    = 'idle';
        t.progress = 0;
        updateThread(t);
      }, speedMs * 0.6);
      timers.push(rt);

    } else {
      // No collision this time — write succeeds
      var nv = readVal + 1;
      sharedCounter = nv;
      t.state    = 'success';
      t.progress = 100;
      updateThread(t);
      flashCounter(nv, 'Thread ' + t.id, false);
      log('Thread ' + t.id + ' wrote counter = ' + nv, 'ok');
      stats.ops++;
      updateStats();

      var rt2 = setTimeout(function() {
        t.state    = 'idle';
        t.progress = 0;
        updateThread(t);
      }, speedMs * 0.4);
      timers.push(rt2);
    }
  }, delay);

  timers.push(timer);
}

// ════════════════════════════════════════════════════════════
// SCHEDULER
// ════════════════════════════════════════════════════════════

/**
 * Continuously reschedule a thread to run after a random interval.
 * Each thread runs independently on its own loop.
 * @param {object} t - thread object
 */
function scheduleThread(t) {
  var jitter = speedMs * (0.9 + Math.random() * 0.9);

  var timer = setTimeout(function() {
    if (!running) return;
    if (paused) {
      // If paused, re-schedule without running
      scheduleThread(t);
      return;
    }

    // Dispatch to correct simulation
    if      (mode === 'lockfree') runLockFree(t);
    else if (mode === 'mutex')    runMutex(t);
    else                          runRace(t);

    // Schedule next iteration
    var loop = setTimeout(function() { scheduleThread(t); }, jitter * 1.5);
    timers.push(loop);

  }, jitter);

  timers.push(timer);
}

// ════════════════════════════════════════════════════════════
// CONTROLS
// ════════════════════════════════════════════════════════════

/**
 * Start the simulation.
 */
function startSim() {
  if (running) return;
  running = true;
  paused  = false;

  document.getElementById('btn-start').disabled = true;
  document.getElementById('btn-pause').disabled = false;

  log('━━ Simulation started — mode: ' + mode + ' ━━', 'info');
  threads.forEach(function(t) { scheduleThread(t); });
}

/**
 * Toggle pause / resume.
 */
function pauseSim() {
  paused = !paused;
  var btn = document.getElementById('btn-pause');
  btn.textContent = paused ? '▶ Resume' : '⏸ Pause';
  log(paused ? '⏸ Simulation paused' : '▶ Simulation resumed', 'info');
}

/**
 * Stop everything and return to initial state.
 * Does NOT reset the session throughput bars (mutexOps / lfOps)
 * so you can compare modes across multiple runs.
 */
function resetSim() {
  running = false;
  paused  = false;

  // Cancel all pending timeouts
  timers.forEach(clearTimeout);
  timers = [];

  // Reset shared state
  sharedCounter = 0;
  mutexLocked   = false;
  mutexQueue    = [];
  stats = { ops: 0, retries: 0, lost: 0 };

  // Reset UI
  document.getElementById('btn-start').disabled = false;
  document.getElementById('btn-pause').disabled = true;
  document.getElementById('btn-pause').textContent = '⏸ Pause';

  document.getElementById('counter-val').textContent   = '0';
  document.getElementById('counter-val').className     = 'counter-value';
  document.getElementById('counter-owner').textContent = '—';

  document.getElementById('race-badge').classList.remove('visible');
  document.getElementById('mutex-badge').classList.remove('visible');

  // Reset CAS panel
  document.getElementById('cas-result').className = 'cas-result';
  ['cas-exp', 'cas-cur', 'cas-new'].forEach(function(id) {
    document.getElementById(id).textContent = '—';
  });
  document.getElementById('cas-retries').textContent = '0';

  // Clear log
  document.getElementById('log-entries').innerHTML = '';

  updateStats();

  // Re-create threads (keep same count)
  initThreads(threads.length || 3);
}

// ════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════

/**
 * Capitalize first letter of a string.
 * @param {string} s
 * @returns {string}
 */
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ════════════════════════════════════════════════════════════
// INIT — runs when page loads
// ════════════════════════════════════════════════════════════
initThreads(3);
setMode('lockfree');
