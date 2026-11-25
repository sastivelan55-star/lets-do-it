# Life OS — Personal Productivity & Engineering Execution System

> **File Location:** `C:\lets do it\README.md`

Life OS is an engineering-first personal operating system, daily task execution engine, and productivity command center designed for students, software engineers, and high-performance individuals. It balances technical growth, career readiness, academics, daily habits, and project delivery with real-time cloud synchronization backed by Supabase PostgreSQL and offline resilience via IndexedDB.

---

## 📌 Purpose & Use Cases (What is the use?)

Life OS solves the fragmentation of using multiple disconnected apps for tasks, calendars, notes, career tracking, and news. It provides a single unified dashboard to:

1. **Execute Daily Missions with Zero Friction**: Keep track of what needs to be done *today* without getting overwhelmed by hundreds of backlogged items.
2. **Eliminate Lost or Overdue Work**: Automatically detects pending tasks from previous days and allows carrying them forward in one click.
3. **Bridge Long-Term Goals and Daily Action**: Connect high-level roadmaps and quarterly project milestones directly to daily hourly schedules and tasks.
4. **Career & Placement Mastery**: Dedicated placement HQ to practice Data Structures & Algorithms (DSA), technical topics, viva preparation, and resume tracking.
5. **Work Seamlessly Anywhere (Online & Offline)**: Instant optimistic UI with automatic cloud sync across devices using Supabase, backed by an offline-first IndexedDB engine.

---

## ✨ Comprehensive Features & Modules

### 1. 🏠 Premium Productivity Dashboard (Home)
- **Dynamic Header & Greeting**: Personalized time-of-day greeting (Good Morning / Afternoon / Evening) with weekday and date tracking.
- **Date Navigation**: Jump between past, present, and future dates with a single click, or return to "Today" instantly.
- **Today's Missions**:
  - Filter by All, Pending, or Completed.
  - Reversible one-click completion ticks that instantly update progress metrics.
  - Automatic Overdue Banner displaying pending tasks from previous days with a **Carry Forward All** action.
  - Inline Quick Add Mission input bar for rapid task entry without opening modals.
- **Floating Time Picker**: Non-disruptive floating time selector with presets (Morning 9:00 AM, Afternoon 2:00 PM, Evening 6:00 PM, Night 9:00 PM) and quick minute chips (+15m, +30m, +1h).
- **Quick Actions Palette**: One-click shortcuts for New Task, Go to Calendar, Add List, Browse Templates, Import Tasks, and View Stats.
- **Interactive Monthly Mini-Calendar**: Visual indicator dots for days with active tasks and completed tasks.
- **Upcoming Tasks Feed**: Chronologically sorted preview of scheduled deadlines.
- **Recent Activity Log**: Audit trail of recently created, completed, and updated tasks.
- **Light & Dark Mode**: One-click top-bar theme toggle with seamless background and glassmorphism styling transition.

### 2. 📋 Tasks Hub & Management System (Google Tasks-Inspired)
- **Smart Views**:
  - **All Tasks**: Central repository for all active tasks.
  - **My Day**: Curated focus list for the current 24-hour cycle.
  - **Upcoming**: Scheduled future tasks with countdown badges.
  - **Daily Routines**: Tasks marked with recurring individual daily frequency (`isDaily`).
  - **Starred**: High-priority bookmarked tasks.
  - **Completed**: Historical archive of completed tasks with reversible toggle.
- **Custom Categorized Lists**:
  - Personal
  - College & Academics
  - Projects
  - Learning & Skills
  - Health & Routines
- **Task Attributes**: Priority flags (Critical, High, Medium, Low), life areas, tags, due dates, scheduled time, subtasks checklist, and rich notes.
- **Task Recycle Bin**: Soft delete with safety restore and permanent purge capabilities.

### 3. ⏱️ Daily Timetable & Hourly Timeline
- Visual 24-hour schedule grid for time-blocking work sessions, classes, deep work, and habits.
- Syncs directly with scheduled tasks from the Tasks Hub.

### 4. 📅 Calendar Planner
- Multi-perspective views (Day, Week, Month) for visualizing upcoming deadlines, exam dates, and project milestones.

### 5. 📁 Projects Hub
- Multi-project management with progress percentage tracking, deliverables breakdown, and linked tasks.

### 6. 🚀 Strategic Roadmap & Milestones
- Long-term strategic planner organizing goals across months and quarters with progress visualization.

### 7. 📊 Weekly Reflection & Performance Analytics
- Automated streak calculation engine for daily habit consistency.
- Weekly retrospective notes, accomplishment logs, and productivity scoring.

### 8. 🎓 Placement Training HQ
- Specialized modules for engineering interview preparation:
  - DSA topic checklists (Arrays, Trees, Graphs, DP, etc.).
  - Technical core subjects (OS, DBMS, CN, System Design).
  - Aptitude and mock interview tracking.

### 9. 📝 Knowledge Base & Notes
- Categorized technical notes, code snippets, documentation bookmarks, and search.

### 10. 🗄️ Digital Vault & Media Uploads
- Secure resource vault with file upload management integrated with Supabase Storage and resumable TUS protocol.

### 11. 🛒 Smart Grocery List
- Categorized shopping assistant with item check-offs, quantities, and spending estimates.

### 12. 📰 Jarvis News Intelligence Feed (`news-backend`)
- Standalone zero-cost Python FastAPI service aggregating 17+ verified RSS news feeds (Chennai, Tamil Nadu, India, and Global).
- Automatic deduplication, live TV streaming feeds, and optional AI executive briefing.

### 13. 🤖 Nova AI Assistant & Quick Capture
- Floating AI assistant for task breakdown, planning advice, and context-aware help.
- Global Quick Capture modal accessible via keyboard shortcut (`Ctrl + K`).

---

## ⚡ Tech Stack & Architecture

- **Frontend Framework**: React 19, TypeScript, Vite 8
- **Styling**: Modern Neo-Future Glassmorphism design system, Tailwind CSS v4, dynamic CSS custom properties for Light/Dark mode
- **Cloud Database & Auth**: Supabase PostgreSQL + GoTrue Auth SDK (`@supabase/supabase-js`)
- **Offline / Local Cache**: IndexedDB (`idb`) for zero-lag offline execution
- **Icons**: Lucide React
- **Date Handling**: `date-fns` v4
- **Backend Service (News)**: Python 3.10+, FastAPI, SQLite, Uvicorn
- **Testing**: Vitest 5 (25 test suites, 235 passing tests)
- **Linter**: Oxlint

---

## 📁 Project Directory Structure & Address

```
C:\lets do it\
├── README.md                              <-- THIS FILE (Main Application Documentation)
├── BUILD_STATUS.md                        <-- Build verification and release status
├── package.json                           <-- Dependencies and scripts
├── vite.config.ts                         <-- Vite configuration
├── index.html                             <-- Single Page App entrypoint
├── src\
│   ├── App.tsx                            <-- Root application layout & routing
│   ├── main.tsx                           <-- React root entrypoint
│   ├── index.css                          <-- Global CSS tokens & themes (Light/Dark)
│   ├── components\
│   │   ├── dashboard\
│   │   │   └── PremiumHomeDashboard.tsx   <-- Complete Home productivity dashboard
│   │   ├── layout\
│   │   │   ├── Sidebar.tsx                <-- Navigation sidebar
│   │   │   └── TopBar.tsx                 <-- Top navigation & Theme toggle
│   │   ├── tasks\                         <-- Task management & dialog components
│   │   ├── timetable\                     <-- Daily timetable timeline components
│   │   └── common\
│   │       └── FloatingTimePicker.tsx     <-- Floating time picker popover
│   ├── pages\
│   │   ├── HomePage.tsx                   <-- Home page container
│   │   ├── TaskBuilderPage.tsx            <-- Google Tasks-inspired Tasks Hub
│   │   ├── PlannerPage.tsx                <-- Calendar planner
│   │   ├── ProjectsPage.tsx               <-- Projects hub
│   │   ├── RoadmapPage.tsx                <-- Strategic roadmap
│   │   ├── WeeklyReviewPage.tsx           <-- Reflection & streak analysis
│   │   ├── PlacementHQPage.tsx            <-- Placement training hub
│   │   ├── KnowledgePage.tsx              <-- Knowledge & notes
│   │   ├── VaultPage.tsx                  <-- Digital vault & uploads
│   │   ├── GroceryPage.tsx                <-- Grocery checklist
│   │   ├── PulseFlowPage.tsx              <-- News intelligence feed
│   │   └── ReviewSettingsPage.tsx         <-- Settings & preferences
│   ├── context\
│   │   ├── AppContext.tsx                 <-- Core state, theme engine, data operations
│   │   └── AuthContext.tsx                <-- Supabase authentication state
│   ├── db\                                <-- IndexedDB storage and seed data
│   ├── services\                          <-- Cloud Supabase APIs & sync engines
│   └── tests\                             <-- Vitest integration and unit test suites
└── news-backend\                          <-- Python FastAPI RSS news backend
    ├── README.md                          <-- Backend documentation
    ├── main.py                            <-- FastAPI application
    └── requirements.txt                   <-- Python dependencies
```

---

## 🛠️ Quick Start & Local Development

### 1. Run the Frontend:
```bash
# In C:\lets do it
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Run Tests:
```bash
npm run test
```

### 3. Run Production Build:
```bash
npm run build
```

### 4. (Optional) Run News Intelligence Backend:
```powershell
cd "C:\lets do it\news-backend"
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
