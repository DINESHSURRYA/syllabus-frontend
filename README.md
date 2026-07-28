# 🎓 Syllabus AI - Frontend Web Application

An AI-powered academic curriculum & syllabus engineering platform built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **TanStack Query**.

---

## ✨ Features

- 📑 **Syllabus Extraction & Parsing**: Upload PDF/DOCX syllabi for AI structure extraction.
- 🎯 **AI CO-PO Matrix Mapping**: Automatic generation & alignment of Course Outcomes (COs) to Program Outcomes (POs).
- 💡 **Pedagogy Recommendation Engine**: Smart pedagogical strategy suggestions with interactive category breakdowns.
- 📅 **Timeline & Lecture Planner**: Unit-wise and weekly teaching plan allocation.
- 📊 **Curriculum Analytics**: Comprehensive analytics dashboard visualizing syllabus coverage, credit distribution, and bloom taxonomy levels.
- 📚 **Syllabus Repository**: Centralized syllabus management with version history & archiving capabilities.
- 📝 **MCQ & Assessment Generator**: AI-assisted question generation and evaluator workflows.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State & Data Fetching**: [TanStack Query (React Query v5)](https://tanstack.com/query) & [Zustand](https://zustand-demo.pmnd.rs/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [Lucide Icons](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have **Node.js 18+** installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/DINESHSURRYA/syllabus-frontend.git
   cd syllabus-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) or [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server |
| `npm run build` | Builds the application for production |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint checks |

---

## 📂 Project Structure

```
syllabus-frontend/
├── src/
│   ├── app/             # Next.js App Router pages (syllabus, copo, timeline, analytics, etc.)
│   ├── components/      # UI & Feature components
│   ├── hooks/           # Custom React hooks
│   └── lib/             # API client & utility functions
├── public/              # Static assets
├── tailwind.config.ts   # Tailwind CSS configuration
└── package.json
```
