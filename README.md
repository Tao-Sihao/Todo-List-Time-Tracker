# Todo List Time Tracker

A browser-based todo list time tracker with local storage, task sessions, and daily work statistics.

This project is a lightweight productivity tool built with **HTML, CSS, and JavaScript**. It helps you record what you worked on, when you started, when you stopped, and how much time you spent.

## Features

- Add todo tasks
- ![App Screenshot](/images/screenshot1.png)
- Start tracking a task
- Stop tracking a task
- ![App Screenshot](/images/screenshot2.png)
- Automatically record start time and end time
- Automatically calculate work duration
- Support multiple work sessions for the same task
- Show today’s total work time
- ![App Screenshot](/images/screenshot3.png)
- Show today’s session count
- Mark tasks as completed
- View task-level work history
- View work duration trends for the last 7 or 30 days
- Save data locally in the browser with `localStorage`

## Demo Logic

The basic workflow is:

```text
Add a task
↓
Click Start Tracking
↓
The app records the start time
↓
Click Stop Tracking
↓
The app records the end time
↓
The app calculates the work duration automatically
```

## How to Use

Open `index.html` in your browser.

You can:

1. Add a task.
2. Click **Start Tracking**.
3. Work on the task.
4. Click **Stop Tracking**.
5. Check your total work time and daily trend chart.

## Data Storage

This app uses browser `localStorage`.

That means:

- Your data is saved in the same browser.
- Your data remains after closing and reopening the page.
- Your data does not automatically sync across devices.
- Your data may be lost if you clear browser site data.

## Future Improvements

Possible next steps:

- Export data to CSV
- Import backup data
- Add weekly and monthly review pages
- Add category statistics
- Add a real backend database
- Add account login and cross-device sync
- Add dark mode

## License

MIT
