# FieldFlow CRM - System Blueprint

## Section 1: Overview
FieldFlow is a comprehensive Jobber-style Field Service CRM. It connects the office to the field, handling the full lifecycle:
**Lead -> Quote -> Schedule -> Job -> Invoice -> Payment**.

### Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts, Lucide Icons.
- **Architecture**: Single Page Application (SPA).
- **Data**: Mock Service Layer (Simulates Supabase/SQL).

## Section 4: API Specification (Blueprint)

The following endpoints are simulated in `store.ts`:

### JOBS
- `GET /jobs`: List all jobs.
- `POST /jobs`: Create new job.
- `PATCH /jobs/:id/status`: Update status (e.g., Technician marks 'On My Way').
- `POST /jobs/:id/photos`: Upload job site photos.

### INVOICES
- `POST /invoices`: Generate invoice from job.
- `POST /invoices/:id/pay`: Record payment.

## Section 6: Scheduling Engine Logic
The scheduler (`pages/Schedule.tsx`) uses a resource-based approach:
1.  **Input**: List of Technicians (Columns) + Time Slots (Rows).
2.  **Collision Detection**: Checks if `Job.start < NewJob.end` and `Job.end > NewJob.start`.
3.  **Rendering**: Calculates absolute positioning based on `(Hour - StartHour) * pixelHeight`.

## Section 11: Deployment

### Vercel
1.  Push code to GitHub.
2.  Import project into Vercel.
3.  Framework Preset: Create React App (or Vite).
4.  Deploy.

### Database (Supabase)
To go live, replace `mockData.ts` with `@supabase/supabase-js` client calls matching the interfaces in `types.ts`.

## Section 12: Features Included
- **Admin Portal**: Dashboard, Schedule, Client List.
- **Tech App**: Job Details, Checklist, Status Updates, "On My Way".
- **Finance**: Invoice tracking.
- **Role Switching**: Toggle between Admin and Tech views instantly.
