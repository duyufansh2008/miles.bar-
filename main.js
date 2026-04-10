
import { Renderer, Program, Mesh, Triangle } from 'https://cdn.jsdelivr.net/npm/ogl@1.0.11';

let gyroEnabled = false;


function applyGyro(beta = 0, gamma = 0) {
  const x = Math.max(0, Math.min(1, 0.5 + gamma / 90));
  const y = Math.max(0, Math.min(1, 0.5 + beta / 120));
  program.uniforms.uPointer.value = [x, 1 - y];
}

async function enableMotionEffect() {
  try {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      const result = await DeviceOrientationEvent.requestPermission();
      if (result !== "granted") return;
    }

    window.addEventListener("deviceorientation", (event) => {
  if (!gyroEnabled) return;

  const beta = event.beta != null ? event.beta : 0;
  const gamma = event.gamma != null ? event.gamma : 0;

  applyGyro(beta, gamma);
}, true);

    gyroEnabled = true;
  } catch (e) {
    console.error(e);
  }
}
    const canvas = document.getElementById("fx-canvas");
const renderer = new Renderer({
  canvas,
  alpha: true,
  dpr: Math.min(window.devicePixelRatio, 2)
});

const gl = renderer.gl;
gl.clearColor(0, 0, 0, 0);

const geometry = new Triangle(gl);

const program = new Program(gl, {
  vertex: `
    attribute vec2 uv;
    attribute vec2 position;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `,
  fragment: `
    precision highp float;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uPointer;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      vec2 p = uv - 0.5;

      float wave1 = sin((uv.x * 10.0) + uTime * 0.7) * 0.02;
      float wave2 = cos((uv.y * 12.0) - uTime * 0.6) * 0.02;
      float glow = 0.18 / (length(uv - uPointer) * 8.0 + 0.4);

      vec3 color = vec3(0.0);
      color += vec3(0.10, 0.22, 0.32) * glow;
      color += vec3(0.05, 0.09, 0.16) * (wave1 + wave2 + 0.08);

      gl_FragColor = vec4(color, 0.34);
    }
  `,
  uniforms: {
    uTime: { value: 0 },
    uResolution: { value: [window.innerWidth, window.innerHeight] },
    uPointer: { value: [0.5, 0.5] }
  }
});

const mesh = new Mesh(gl, { geometry, program });

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  program.uniforms.uResolution.value = [window.innerWidth, window.innerHeight];
}
window.addEventListener("resize", resize);
resize();

window.addEventListener("pointermove", (e) => {
  program.uniforms.uPointer.value = [
    e.clientX / window.innerWidth,
    1 - e.clientY / window.innerHeight
  ];
});

let start = performance.now();
function update(t) {
  program.uniforms.uTime.value = (t - start) * 0.001;
  renderer.render({ scene: mesh });
  requestAnimationFrame(update);
}
requestAnimationFrame(update);
    function syncScheduleHeight() {
  const leftColumn = document.querySelector('.left-column');
  const scheduleCard = document.querySelector('.schedule-card');

  if (!leftColumn || !scheduleCard) return;

  const leftHeight = leftColumn.offsetHeight;
  scheduleCard.style.height = `${leftHeight}px`;
}

window.addEventListener('load', syncScheduleHeight);
window.addEventListener('resize', syncScheduleHeight);
window.addEventListener('orientationchange', syncScheduleHeight);

const leftColumnEl = document.querySelector('.left-column');
if (leftColumnEl) {
  const ro = new ResizeObserver(() => syncScheduleHeight());
  ro.observe(leftColumnEl);
}

const bgA = document.getElementById("bg-a");
const bgB = document.getElementById("bg-b");
let activeBg = bgA;
let standbyBg = bgB;
let lastBingUrl = "";

const fallbackWallpapers = [
  "https://images.unsplash.com/photo-1506744626753-eba7bc10871e?q=100&w=3840&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=100&w=3840&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=100&w=3840&auto=format&fit=crop"
];

function getFallbackWallpaper() {
  return fallbackWallpapers[Math.floor(Math.random() * fallbackWallpapers.length)];
}

async function getBingWallpaper() {
  const res = await fetch("/api/bing-wallpaper", {
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error(`Wallpaper API failed: ${res.status}`);
  }

  return await res.json();
}

async function swapBackground(initial = false) {
  let url = "";

  try {
    const data = await getBingWallpaper();
    url = data.url;

    if (!initial && url === lastBingUrl) return;
    lastBingUrl = url;
  } catch (err) {
    console.error("Bing 壁紙載入失敗，改用備用圖：", err);
    url = getFallbackWallpaper();
  }

  standbyBg.style.backgroundImage = `url("${url}")`;
  standbyBg.style.transform = "scale(1.08)";
  standbyBg.style.opacity = "0";

  requestAnimationFrame(() => {
    standbyBg.style.opacity = "1";
    standbyBg.style.transform = "scale(1.04)";
    activeBg.style.opacity = "0";
  });

  setTimeout(() => {
    const temp = activeBg;
    activeBg = standbyBg;
    standbyBg = temp;
    standbyBg.style.transform = "scale(1.08)";
  }, initial ? 50 : 1400);
}

swapBackground(true);
setInterval(() => swapBackground(false), 6 * 60 * 60 * 1000);

    /* =========================
       Hong Kong Time Helpers
    ========================= */
    function getHKParts(date = new Date()) {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Hong_Kong",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).formatToParts(date);

      const map = {};
      parts.forEach(p => {
        if (p.type !== "literal") map[p.type] = p.value;
      });

      return {
        year: Number(map.year),
        month: Number(map.month),
        day: Number(map.day),
        hour: Number(map.hour),
        minute: Number(map.minute),
        second: Number(map.second)
      };
    }

    function getHKDateObject() {
      const p = getHKParts();
      return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    }

    function isSameDay(d1, d2) {
      return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
      );
    }

    /* =========================
       Clock
    ========================= */
    const clockEl = document.getElementById("clock");
    const dateEl = document.getElementById("date");
    const miniClockEl = document.getElementById("mini-clock");
    const miniDateEl = document.getElementById("mini-date");

    function updateClock() {
      const now = new Date();

      const timeText = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Hong_Kong",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(now);

      const homeDateText = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Hong_Kong",
        weekday: "long",
        month: "long",
        day: "numeric"
      }).format(now);

      const miniDateText = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Hong_Kong",
        month: "short",
        day: "numeric",
        weekday: "short"
      }).format(now);

      clockEl.textContent = timeText;
      dateEl.textContent = homeDateText;
      miniClockEl.textContent = timeText;
      miniDateEl.textContent = miniDateText;
    }

    updateClock();
    setInterval(updateClock, 1000);

    /* =========================
       Search
    ========================= */
    const searchInput = document.getElementById("search-input");

    function looksLikeURL(value) {
      return /^(https?:\/\/|[a-z0-9-]+\.[a-z]{2,})(\/.*)?$/i.test(value);
    }

    function goSearch(raw) {
      const q = raw.trim();
      if (!q) return;

      if (q.startsWith("!yt ")) {
        window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(q.slice(4))}`;
        return;
      }

      if (q.startsWith("!b ")) {
        window.location.href = `https://search.bilibili.com/all?keyword=${encodeURIComponent(q.slice(3))}`;
        return;
      }

      if (looksLikeURL(q)) {
        const url = /^https?:\/\//i.test(q) ? q : `https://${q}`;
        window.location.href = url;
        return;
      }

      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    }

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") goSearch(searchInput.value);
    });

    window.addEventListener("load", () => {
      setTimeout(() => searchInput.focus(), 150);
    });

    /* =========================
       Dashboard State
    ========================= */
    const body = document.body;
    const dashboardStage = document.getElementById("dashboard-stage");

    function animateIn(el, keyframes, options) {
  el.animate(keyframes, options);
}

function enterDashboard() {
  body.classList.add("dashboard-active");
  searchInput.blur();

  animateIn(document.getElementById("hero-section"), [
    { opacity: 1, transform: "translateY(0) scale(1)" },
    { opacity: 0, transform: "translateY(-18px) scale(0.96)" }
  ], {
    duration: 420,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    fill: "forwards"
  });

  animateIn(document.getElementById("dashboard-panel"), [
    { opacity: 0, transform: "translateX(-50%) scale(0.985)" },
    { opacity: 1, transform: "translateX(-50%) scale(1)" }
  ], {
    duration: 520,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    fill: "forwards"
  });
}

function exitDashboard() {
  animateIn(document.getElementById("dashboard-panel"), [
    { opacity: 1, transform: "translateX(-50%) scale(1)" },
    { opacity: 0, transform: "translateX(-50%) scale(0.985)" }
  ], {
    duration: 300,
    easing: "ease",
    fill: "forwards"
  });

  animateIn(document.getElementById("hero-section"), [
    { opacity: 0, transform: "translateY(-18px) scale(0.96)" },
    { opacity: 1, transform: "translateY(0) scale(1)" }
  ], {
    duration: 360,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    fill: "forwards"
  });

  setTimeout(() => {
    body.classList.remove("dashboard-active");
    searchInput.focus();
  }, 300);
}

    // 首頁：點搜尋框以外空白 -> 進入日曆面板
    document.getElementById("home-stage").addEventListener("pointerdown", (e) => {
      if (e.target.closest(".search-wrapper")) return;
      enterDashboard();
    });

    // 面板：點空白 -> 回首頁
    dashboardStage.addEventListener("pointerdown", (e) => {
      if (e.target === dashboardStage) {
        exitDashboard();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && body.classList.contains("dashboard-active")) {
        exitDashboard();
      }
    });


    function bindTilt(card) {
      const maxRotate = 5;
      const maxShift = 6;

      function reset() {
        card.style.setProperty("--card-rx", "0deg");
        card.style.setProperty("--card-ry", "0deg");
        card.style.setProperty("--card-tx", "0px");
        card.style.setProperty("--card-ty", "0px");
        card.style.setProperty("--shine-x", "50%");
        card.style.setProperty("--shine-y", "50%");
      }

      function update(clientX, clientY) {
        const rect = card.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const px = x / rect.width;
        const py = y / rect.height;

        const ry = (px - 0.5) * (maxRotate * 2);
        const rx = (0.5 - py) * (maxRotate * 2);

        const tx = (px - 0.5) * (maxShift * 2);
        const ty = (py - 0.5) * (maxShift * 2);

        card.style.setProperty("--card-rx", `${rx.toFixed(2)}deg`);
        card.style.setProperty("--card-ry", `${ry.toFixed(2)}deg`);
        card.style.setProperty("--card-tx", `${tx.toFixed(2)}px`);
        card.style.setProperty("--card-ty", `${ty.toFixed(2)}px`);
        card.style.setProperty("--shine-x", `${(px * 100).toFixed(1)}%`);
        card.style.setProperty("--shine-y", `${(py * 100).toFixed(1)}%`);
      }

      card.addEventListener("pointermove", (e) => {
  if (gyroEnabled) return;
  update(e.clientX, e.clientY);
});

      card.addEventListener("pointerleave", reset);

      card.addEventListener("touchmove", (e) => {
        const t = e.touches[0];
        if (!t) return;
        update(t.clientX, t.clientY);
      }, { passive: true });

      card.addEventListener("touchend", reset);
      card.addEventListener("touchcancel", reset);

      reset();
    }

    document.querySelectorAll(".tilt-card, .dashboard-topbar").forEach(bindTilt);

    /* =========================
       Timetable
    ========================= */
    const subjectsMap = {
      "X1": "Elective 1",
      "X2": "Elective 2",
      "X3": "Elective 3"
    };

    const timetable = {
      A: [
        { time: "8:20-9:00", subject: "CITT. & SOC." },
        { time: "9:00-9:40", subject: "CITT. & SOC." },
        { time: "9:40-9:55", subject: "Recess" },
        { time: "10:00-10:40", subject: "X3" },
        { time: "10:40-11:20", subject: "X3" },
        { time: "11:25-12:05", subject: "CHIN." },
        { time: "12:05-13:05", subject: "Lunch" },
        { time: "13:10-13:45", subject: "ENG." },
        { time: "13:45-14:20", subject: "ENG." },
        { time: "14:25-15:00", subject: "MATH." },
        { time: "15:00-15:35", subject: "Assembly" }
      ],
      B: [
        { time: "8:20-9:00", subject: "X1" },
        { time: "9:00-9:40", subject: "X1" },
        { time: "9:40-9:55", subject: "Recess" },
        { time: "10:00-10:40", subject: "ENG." },
        { time: "10:40-11:20", subject: "CHIN." },
        { time: "11:25-12:05", subject: "CHIN." },
        { time: "12:05-13:05", subject: "Lunch" },
        { time: "13:10-13:45", subject: "MATH." },
        { time: "13:45-14:20", subject: "MATH." },
        { time: "14:25-15:00", subject: "X2" },
        { time: "15:00-15:35", subject: "X2" }
      ],
      C: [
        { time: "8:00-8:15", subject: "Assembly" },
        { time: "8:20-9:00", subject: "MATH." },
        { time: "9:00-9:40", subject: "MATH." },
        { time: "9:40-9:55", subject: "Recess" },
        { time: "10:00-10:40", subject: "X1" },
        { time: "10:40-11:20", subject: "X1" },
        { time: "11:25-12:05", subject: "CHIN." },
        { time: "12:05-13:05", subject: "Lunch" },
        { time: "13:10-13:45", subject: "X3" },
        { time: "13:45-14:20", subject: "X3" },
        { time: "14:25-15:00", subject: "ENG." },
        { time: "15:00-15:35", subject: "ENG." }
      ],
      D: [
        { time: "8:20-9:00", subject: "X2" },
        { time: "9:00-9:40", subject: "X2" },
        { time: "9:40-9:55", subject: "Recess" },
        { time: "10:00-10:40", subject: "SPEAKING" },
        { time: "10:40-11:20", subject: "MATH." },
        { time: "11:25-12:05", subject: "MATH." },
        { time: "12:05-13:05", subject: "Lunch" },
        { time: "13:10-13:45", subject: "ENG.EN." },
        { time: "13:45-14:20", subject: "ENG.EN." },
        { time: "14:25-15:00", subject: "Assembly" },
        { time: "15:00-15:35", subject: "Assembly" }
      ],
      E: [
        { time: "8:20-9:00", subject: "P.E." },
        { time: "9:00-9:40", subject: "P.E." },
        { time: "9:40-9:55", subject: "Recess" },
        { time: "10:00-10:40", subject: "CITT. & SOC." },
        { time: "10:40-11:20", subject: "CHIN." },
        { time: "11:25-12:05", subject: "CHIN." },
        { time: "12:05-13:05", subject: "Lunch" },
        { time: "13:10-13:45", subject: "X1" },
        { time: "13:45-14:20", subject: "X1" },
        { time: "14:25-15:00", subject: "ENG." },
        { time: "15:00-15:35", subject: "CHIN." }
      ],
      W: [
        { time: "8:00-8:45", subject: "Assembly" },
        { time: "8:50-9:20", subject: "X3" },
        { time: "9:20-9:50", subject: "X3" },
        { time: "9:50-10:05", subject: "Recess" },
        { time: "10:10-10:40", subject: "ENG." },
        { time: "10:40-11:10", subject: "ENG." },
        { time: "11:15-11:45", subject: "X2" },
        { time: "11:45-12:15", subject: "X2" },
        { time: "12:15-13:30", subject: "Lunch" },
        { time: "13:35-14:05", subject: "CHIN." },
        { time: "14:05-14:35", subject: "CHIN." }
      ]
    };

    const schoolCalendar2026 = {
      3: { 28: "none", 29: "none", 30: "E", 31: "A" },
      4: {
        1: "none", 2: "none", 3: "none", 4: "none", 5: "none", 6: "none", 7: "none", 8: "none",
        9: "B", 10: "C", 11: "none", 12: "none", 13: "D", 14: "E", 15: "W", 16: "A", 17: "B",
        18: "none", 19: "none", 20: "C", 21: "D", 22: "W", 23: "E", 24: "A", 25: "none",
        26: "none", 27: "B", 28: "C", 29: "W", 30: "D"
      }
    };

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const dayNamesShort = ["S", "M", "T", "W", "T", "F", "S"];

    const hkNow = getHKDateObject();
    let currentDate = new Date(hkNow.getFullYear(), hkNow.getMonth(), hkNow.getDate());
    let selectedDate = new Date(hkNow.getFullYear(), hkNow.getMonth(), hkNow.getDate());
    let viewMonthDate = new Date(hkNow.getFullYear(), hkNow.getMonth(), 1);

    const calMonthYear = document.getElementById("cal-month-year");
    const calGrid = document.getElementById("cal-grid");
    const scheduleDayTitle = document.getElementById("schedule-day-title");
    const scheduleDateSubtitle = document.getElementById("schedule-date-subtitle");
    const scheduleBadge = document.getElementById("schedule-badge");
    const scheduleList = document.getElementById("schedule-list");

    function getDayType(dateObj) {
      const y = dateObj.getFullYear();
      const m = dateObj.getMonth() + 1;
      const d = dateObj.getDate();
      if (y === 2026 && schoolCalendar2026[m] && schoolCalendar2026[m][d]) {
        return schoolCalendar2026[m][d];
      }
      return "none";
    }

    function renderCalendar() {
      const year = viewMonthDate.getFullYear();
      const month = viewMonthDate.getMonth();

      calMonthYear.textContent = `${monthNames[month]} ${year}`;
      calGrid.innerHTML = "";

      dayNamesShort.forEach(day => {
        calGrid.insertAdjacentHTML("beforeend", `<div class="cal-day-name">${day}</div>`);
      });

      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const daysInPrevMonth = new Date(year, month, 0).getDate();

      for (let i = firstDay - 1; i >= 0; i--) {
        calGrid.insertAdjacentHTML("beforeend", `<div class="cal-date muted">${daysInPrevMonth - i}</div>`);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const dayType = getDayType(dateObj);
        const hasClass = dayType !== "none";

        let classes = "cal-date";
        if (isSameDay(dateObj, currentDate)) classes += " today";
        if (isSameDay(dateObj, selectedDate)) classes += " selected";

        calGrid.insertAdjacentHTML(
          "beforeend",
          `<div class="${classes}" data-year="${year}" data-month="${month}" data-day="${day}">
            ${day}
            ${hasClass ? '<div class="cal-dot"></div>' : ""}
          </div>`
        );
      }
    }

    calGrid.addEventListener("click", (e) => {
      const cell = e.target.closest(".cal-date[data-year]");
      if (!cell) return;

      const y = Number(cell.dataset.year);
      const m = Number(cell.dataset.month);
      const d = Number(cell.dataset.day);

      selectedDate = new Date(y, m, d);
      renderCalendar();
renderSchedule();
syncScheduleHeight();

    });

    document.getElementById("cal-prev").addEventListener("click", () => {
  viewMonthDate.setMonth(viewMonthDate.getMonth() - 1);
  renderCalendar();
  syncScheduleHeight();
});

document.getElementById("cal-next").addEventListener("click", () => {
  viewMonthDate.setMonth(viewMonthDate.getMonth() + 1);
  renderCalendar();
  syncScheduleHeight();
});

    function timeToMinutes(rangeStartOrEnd) {
      const [h, m] = rangeStartOrEnd.split(":").map(Number);
      return h * 60 + m;
    }

    function renderSchedule() {
      const isToday = isSameDay(selectedDate, currentDate);
      scheduleDayTitle.textContent = isToday ? "Today's Schedule" : "Selected Schedule";
      scheduleDateSubtitle.textContent = new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      }).format(selectedDate);

      const dayType = getDayType(selectedDate);

      if (dayType === "none" || !timetable[dayType]) {
        scheduleBadge.textContent = "Holiday";
        scheduleList.innerHTML = `<div class="empty-state">🎉 沒有排程，享受生活吧！</div>`;
        return;
      }

      scheduleBadge.textContent = `Day ${dayType}`;
      scheduleList.innerHTML = "";

      const hk = getHKParts();
      const currentMins = hk.hour * 60 + hk.minute;

      timetable[dayType].forEach(period => {
        const [startText, endText] = period.time.split("-");
        const start = timeToMinutes(startText);
        const end = timeToMinutes(endText);

        const isCurrent = isToday && currentMins >= start && currentMins < end;
        const displayName = subjectsMap[period.subject] || period.subject;

        scheduleList.insertAdjacentHTML(
          "beforeend",
          `<div class="period-item ${isCurrent ? "current" : ""}">
            <div class="period-time">${period.time}</div>
            <div class="period-subject">${displayName}</div>
            ${isCurrent ? '<div class="period-status">Now</div>' : ""}
          </div>`
        );
      });

      if (isToday) {
        requestAnimationFrame(() => {
          const currentEl = scheduleList.querySelector(".period-item.current");
          if (currentEl) {
            currentEl.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        });
      }
    }

    function refreshTodayDate() {
      const hkDate = getHKDateObject();
      currentDate = new Date(hkDate.getFullYear(), hkDate.getMonth(), hkDate.getDate());

      if (isSameDay(selectedDate, currentDate)) {
        renderSchedule();
      }
      renderCalendar();
    }

    renderCalendar();
renderSchedule();
syncScheduleHeight();
    setInterval(() => {
      updateClock();
    }, 1000);

    setInterval(() => {
  refreshTodayDate();
}, 60000);
window.addEventListener("click", () => {
  enableMotionEffect();
}, { once: true });
// 删掉原本在这里的 }
