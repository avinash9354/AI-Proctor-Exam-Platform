# Netlify Deployment Guide & Architecture (Hindi + English)

Ye guide aapko batayega ki **Vercel ke bajay Netlify pe** is monorepo (`exam-platform`) ko kaise deploy karna hai, kis app ko kahan deploy karna hai, aur **Environment Variables (.env)** kaise set karne hain.

---

## 1. Architecture Setup (Netlify vs Backend Cloud)

Ek important baat samajh lijiye:
Our monorepo (`exam-platform`) has **3 layers**:
1. **Frontend Layer (Next.js Apps)**: `student-portal` (Students ke liye) aur `admin-dashboard` (Teachers & Admins ke liye).
2. **Backend Services (Node.js & WebSockets)**: `auth-service`, `exam-service`, `streaming-service` (WebRTC camera feed), `notification-service`, `report-service`.
3. **AI Engine (Python FastAPI + YOLOv11 + PyTorch)**: `ai-service`.

> [!IMPORTANT]
> **Netlify kis liye hai?**
> Netlify **Next.js frontend applications** ke liye best hai. Lekin Netlify par persistent WebSockets (`streaming-service`) aur heavy Python GPU/OpenCV models (`ai-service`) run nahi ho sakte kyunki Netlify serverless functions 10 second me timeout ho jaate hain.
> 
> **Best Production Architecture:**
> - **Student Portal (`apps/student-portal`)** ➔ **Deploy on Netlify** (Site 1: e.g. `student-exam.netlify.app`)
> - **Admin Dashboard (`apps/admin-dashboard`)** ➔ **Deploy on Netlify** (Site 2: e.g. `admin-exam.netlify.app`)
> - **Backend Services & AI Server (`services/*`)** ➔ **Deploy on Render / Railway / AWS / DigitalOcean VPS** (jahan permanent Docker containers aur WebSockets chal sakein).
> - **Database (PostgreSQL & Redis)** ➔ **Supabase / Neon / Upstash**.

---

## 2. Netlify Pe Deploy Karne Ke Steps (Step-by-Step)

Aapko Netlify par **do alag sites** banani hain, dono same GitHub repository se connected hongi.

### Step 1: Repository Ko GitHub Pe Push Karein
Agar aapne abhi tak code GitHub pe push nahi kiya hai:
```bash
git add .
git commit -m "Add Netlify configuration files and env templates"
git push origin main
```

---

### Step 2: Student Portal Ko Netlify Pe Deploy Karein (`student-portal`)

1. Go to [app.netlify.com](https://app.netlify.com/) and click **"Add new site"** ➔ **"Import an existing project"**.
2. Select **GitHub** and choose your repository (`exam-platform` or `AI-Proctor-Exam-Platform`).
3. Under **Site settings (Build settings)**, enter exactly this:
   - **Base directory:** `apps/student-portal`
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
4. **Environment Variables set karein:**
   Click **"Add environment variables"** (ya Site configuration me jaake) aur `.env.production.sample` (`apps/student-portal/.env.production.sample`) wale variables daalein:
   ```env
   NEXT_PUBLIC_API_URL = "https://your-backend-api.onrender.com/auth"
   NEXT_PUBLIC_EXAM_API_URL = "https://your-backend-api.onrender.com/exam"
   NEXT_PUBLIC_WS_URL = "wss://your-backend-api.onrender.com/notifications"
   NEXT_PUBLIC_STREAMING_URL = "wss://your-backend-api.onrender.com/streaming"
   NEXT_PUBLIC_ADMIN_DASHBOARD_URL = "https://admin-exam.netlify.app"
   ```
5. Click **"Deploy student-portal"**. Netlify `@netlify/plugin-nextjs` automatically install karke aapka app live kar dega!

---

### Step 3: Admin Dashboard Ko Netlify Pe Deploy Karein (`admin-dashboard`)

1. Netlify Dashboard me wapas aayein aur click **"Add new site"** ➔ **"Import an existing project"** ➔ Same GitHub repository select karein.
2. Under **Build settings**, enter exactly this:
   - **Base directory:** `apps/admin-dashboard`
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
3. **Environment Variables set karein:** (`apps/admin-dashboard/.env.production.sample` se):
   ```env
   NEXT_PUBLIC_API_URL = "https://your-backend-api.onrender.com/auth"
   NEXT_PUBLIC_EXAM_API_URL = "https://your-backend-api.onrender.com/exam"
   NEXT_PUBLIC_WS_URL = "wss://your-backend-api.onrender.com/notifications"
   NEXT_PUBLIC_STREAMING_URL = "wss://your-backend-api.onrender.com/streaming"
   NEXT_PUBLIC_STUDENT_PORTAL_URL = "https://student-exam.netlify.app"
   ```
4. Click **"Deploy admin-dashboard"**.

---

## 3. Netlify CLI Se Local Se Terminal Se Kaise Deploy Karein (Optional)

Agar aap Netlify CLI se directly terminal se deploy karna chahte hain:

```bash
# 1. Netlify CLI install karein (agar nahi hai)
npm install -g netlify-cli

# 2. Netlify me login karein
netlify login

# 3. Student portal deploy karein
cd apps/student-portal
netlify init
# (Select: Create & configure a new site -> Team -> Site name)
netlify deploy --build --prod

# 4. Admin dashboard deploy karein
cd ../admin-dashboard
netlify init
netlify deploy --build --prod
```

---

## 4. Configuration Summary Table

| App | Netlify Base Directory | Build Command | Publish Directory | Config File |
|---|---|---|---|---|
| **Student Portal** | `apps/student-portal` | `npm run build` | `.next` (`apps/student-portal/.next`) | `apps/student-portal/netlify.toml` |
| **Admin Dashboard** | `apps/admin-dashboard` | `npm run build` | `.next` (`apps/admin-dashboard/.next`) | `apps/admin-dashboard/netlify.toml` |

---

> [!TIP]
> **Checklist Done:**
> - Both `apps/student-portal/netlify.toml` and `apps/admin-dashboard/netlify.toml` are created with `@netlify/plugin-nextjs` enabled.
> - Both `.env.production.sample` files are ready so you can easily copy-paste them into Netlify Site Settings!
