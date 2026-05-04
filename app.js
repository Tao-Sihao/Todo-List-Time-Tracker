  
    const STORAGE_KEY = "todo-list-time-tracker-v1";
    let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    setInterval(renderAll, 1000);

    function now() {
      return Date.now();
    }

    function save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }

    function localDate(ts = Date.now()) {
      const d = new Date(ts);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }

    function addTask() {
      const title = document.getElementById("title").value.trim();
      const category = document.getElementById("category").value;
      const estimated = Number(document.getElementById("estimated").value || 0);

      if (!title) {
        alert("Please enter a task name first.");
        return;
      }

      tasks.push({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        title,
        category,
        estimated,
        done: false,
        createdAt: now(),
        records: []
      });

      document.getElementById("title").value = "";
      document.getElementById("estimated").value = "";
      save();
      renderAll();
    }

    function startTask(id) {
      const active = getActiveTask();
      if (active && active.id !== id) {
        alert("Another task is already being tracked. Please stop it before starting a new one.");
        return;
      }

      tasks = tasks.map(task => {
        if (task.id !== id) return task;
        const hasActiveRecord = task.records.some(record => !record.end);
        if (hasActiveRecord) return task;

        return {
          ...task,
          records: [
            ...task.records,
            {
              start: now(),
              end: null
            }
          ]
        };
      });

      save();
      renderAll();
    }

    function stopTask(id) {
      tasks = tasks.map(task => {
        if (task.id !== id) return task;

        return {
          ...task,
          records: task.records.map(record => {
            if (record.end) return record;
            const end = now();
            return {
              ...record,
              end,
              durationMs: Math.max(0, end - record.start)
            };
          })
        };
      });

      save();
      renderAll();
    }

    function toggleDone(id) {
      tasks = tasks.map(task =>
        task.id === id ? { ...task, done: !task.done } : task
      );
      save();
      renderAll();
    }

    function deleteTask(id) {
      const task = tasks.find(t => t.id === id);
      if (task && task.records.some(r => !r.end)) {
        alert("This task is currently being tracked. Please stop the timer before deleting it.");
        return;
      }

      if (!confirm("Delete this task and all of its time records?")) return;

      tasks = tasks.filter(task => task.id !== id);
      save();
      renderAll();
    }

    function getActiveTask() {
      return tasks.find(task => task.records.some(record => !record.end));
    }

    function isActive(task) {
      return task.records.some(record => !record.end);
    }

    function taskTotalMs(task) {
      return task.records.reduce((sum, record) => {
        const end = record.end || now();
        return sum + Math.max(0, end - record.start);
      }, 0);
    }

    function recordDurationMs(record) {
      const end = record.end || now();
      return Math.max(0, end - record.start);
    }

    function renderSummary() {
      const today = localDate();
      const todayMs = tasks.reduce((sum, task) => {
        return sum + task.records.reduce((s, record) => {
          return localDate(record.start) === today ? s + recordDurationMs(record) : s;
        }, 0);
      }, 0);

      const todayRecordCount = tasks.reduce((sum, task) => {
        return sum + task.records.filter(record => localDate(record.start) === today).length;
      }, 0);

      const todayTasks = tasks.filter(task => localDate(task.createdAt) === today);
      const done = todayTasks.filter(task => task.done).length;
      const active = getActiveTask();

      document.getElementById("todayTotal").textContent = formatDuration(todayMs);
      document.getElementById("activeTask").textContent = active ? active.title : "None";
      document.getElementById("recordCount").textContent = todayRecordCount;
      document.getElementById("doneCount").textContent = `${done}/${todayTasks.length}`;
    }

    function renderTasks() {
      const root = document.getElementById("taskList");

      if (!tasks.length) {
        root.innerHTML = '<div class="empty">No tasks yet. Add a task, then click “Start Tracking”.</div>';
        return;
      }

      const active = getActiveTask();

      root.innerHTML = [...tasks]
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(task => {
          const activeThis = isActive(task);
          const totalMs = taskTotalMs(task);
          const canStart = !active || active.id === task.id;

          return `
            <div class="task ${activeThis ? "active" : ""} ${task.done ? "done" : ""}">
              <div class="task-top">
                <div>
                  <div class="title">${escapeHtml(task.title)}</div>
                  <div class="meta">
                    <span class="pill">${escapeHtml(task.category)}</span>
                    ${activeThis ? '<span class="pill active-pill">Tracking now</span>' : ''}
                    <span class="pill">Total: ${formatDuration(totalMs)}</span>
                    ${task.estimated ? `<span class="pill">Estimate: ${task.estimated} min</span>` : ''}
                    <span class="pill">${task.done ? "Completed" : "Open"}</span>
                  </div>
                </div>
                <div class="meta">Created: ${formatDateTime(task.createdAt)}</div>
              </div>

              <div class="task-actions">
                ${
                  activeThis
                    ? `<button class="warning" onclick="stopTask('${task.id}')">Stop Tracking</button>`
                    : `<button onclick="startTask('${task.id}')" ${canStart ? "" : "disabled"}>Start Tracking</button>`
                }
                <button class="secondary" onclick="toggleDone('${task.id}')">
                  ${task.done ? "Mark Open" : "Mark Completed"}
                </button>
                <button class="danger" onclick="deleteTask('${task.id}')">Delete</button>
              </div>

              ${renderRecordTable(task)}
            </div>
          `;
        })
        .join("");
    }

    function renderRecordTable(task) {
      if (!task.records.length) {
        return '<div class="empty">No work sessions recorded for this task yet.</div>';
      }

      return `
        <table>
          <thead>
            <tr>
              <th>Start time</th>
              <th>End time</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            ${task.records.map(record => `
              <tr>
                <td>${formatDateTime(record.start)}</td>
                <td>${record.end ? formatDateTime(record.end) : "In progress"}</td>
                <td>${formatDuration(recordDurationMs(record))}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    }

    function renderChart() {
      const days = Number(document.getElementById("chartRange").value || 7);
      const data = [];

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const date = localDate(d.getTime());

        const ms = tasks.reduce((sum, task) => {
          return sum + task.records.reduce((s, record) => {
            return localDate(record.start) === date ? s + recordDurationMs(record) : s;
          }, 0);
        }, 0);

        data.push({
          label: date.slice(5),
          minutes: Math.round(ms / 60000)
        });
      }

      const width = 900;
      const height = 240;
      const pad = 42;
      const maxValue = Math.max(30, ...data.map(d => d.minutes));
      const xStep = (width - pad * 2) / Math.max(data.length - 1, 1);

      const points = data.map((d, i) => {
        const x = pad + i * xStep;
        const y = height - pad - (d.minutes / maxValue) * (height - pad * 2);
        return `${x},${y}`;
      }).join(" ");

      document.getElementById("chart").innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Daily total work duration line chart">
          <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#e5e7eb"/>
          <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="#e5e7eb"/>
          <text x="${pad - 38}" y="${pad + 4}" font-size="12" fill="#6b7280">${maxValue}m</text>
          <text x="${pad - 20}" y="${height - pad + 4}" font-size="12" fill="#6b7280">0</text>
          <polyline points="${points}" fill="none" stroke="#111827" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          ${data.map((d, i) => {
            const x = pad + i * xStep;
            const y = height - pad - (d.minutes / maxValue) * (height - pad * 2);
            return `
              <circle cx="${x}" cy="${y}" r="4" fill="#111827"/>
              <text x="${x - 16}" y="${height - 12}" font-size="11" fill="#6b7280">${d.label}</text>
              <text x="${x - 12}" y="${y - 10}" font-size="11" fill="#111827">${d.minutes}m</text>
            `;
          }).join("")}
        </svg>
      `;
    }

    function loadSample() {
      if (!confirm("Sample data will be added while keeping your existing tasks. Continue?")) return;

      const base = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;

      function makeRecord(dayOffset, hour, minute, durationMin) {
        const d = new Date(base + dayOffset * dayMs);
        d.setHours(hour, minute, 0, 0);
        const start = d.getTime();
        return {
          start,
          end: start + durationMin * 60000,
          durationMs: durationMin * 60000
        };
      }

      tasks.push(
        {
          id: "sample-1-" + Date.now(),
          title: "Write product requirements",
          category: "Work",
          estimated: 90,
          done: false,
          createdAt: base,
          records: [makeRecord(0, 9, 30, 45), makeRecord(0, 14, 0, 35)]
        },
        {
          id: "sample-2-" + Date.now(),
          title: "Study JavaScript basics",
          category: "Study",
          estimated: 60,
          done: true,
          createdAt: base - dayMs,
          records: [makeRecord(-1, 20, 0, 60)]
        },
        {
          id: "sample-3-" + Date.now(),
          title: "Organize project notes",
          category: "Work",
          estimated: 45,
          done: true,
          createdAt: base - 2 * dayMs,
          records: [makeRecord(-2, 10, 15, 35), makeRecord(-2, 16, 30, 20)]
        }
      );

      save();
      renderAll();
    }

    function renderAll() {
      renderSummary();
      renderTasks();
      renderChart();
    }

    function formatDateTime(ts) {
      const d = new Date(ts);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const h = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${y}-${m}-${day} ${h}:${min}`;
    }

    function formatDuration(ms) {
      const totalSeconds = Math.floor(ms / 1000);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      if (h > 0) return `${h}h ${m}m`;
      if (m > 0) return `${m}m ${s}s`;
      return `${s}s`;
    }

    function escapeHtml(str) {
      return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    renderAll();
  