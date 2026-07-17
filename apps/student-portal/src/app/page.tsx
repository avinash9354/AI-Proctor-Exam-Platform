import Link from 'next/link';
import { GraduationCap, Shield, Clock, CheckCircle, ArrowRight, Lock, Eye, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* ── Navbar ── */}
      <nav className="glass sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4c7ef3] to-[#7c3aed] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">ExamGuard</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-ghost text-sm">Sign In</Link>
            <Link href="/auth/signup" className="btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 badge-blue mb-8 py-1.5 px-4 text-sm">
          <Zap className="w-3.5 h-3.5" />
          AI-Powered Secure Examinations
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight text-balance">
          Exams You Can{' '}
          <span className="gradient-text">Trust</span>
        </h1>

        <p className="text-lg text-[#8892b0] max-w-2xl mb-10 text-balance">
          Enterprise-grade proctoring with consent-first monitoring, AI risk analysis,
          and human-reviewed evidence — so results mean something.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/auth/signup" className="btn-primary gap-2 px-8 py-3 text-base">
            Start Your Exam <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/auth/login" className="btn-secondary px-8 py-3 text-base">
            Sign In
          </Link>
        </div>

        {/* ── Feature Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl w-full text-left">
          {[
            {
              icon: <Lock className="w-6 h-6 text-[#4c7ef3]" />,
              title: 'Consent-First Monitoring',
              desc: 'Camera and microphone recording only starts after you read and agree to the proctoring policy.',
            },
            {
              icon: <Eye className="w-6 h-6 text-[#7c3aed]" />,
              title: 'Human Review Required',
              desc: 'Every AI alert is reviewed by a proctor before any action is taken. No automatic penalties.',
            },
            {
              icon: <CheckCircle className="w-6 h-6 text-[#10b981]" />,
              title: 'Fair & Transparent',
              desc: 'Post-exam, you can see a full summary of any flagged events and what the proctor decided.',
            },
          ].map((f, i) => (
            <div key={i} className="card-glow p-6">
              <div className="w-12 h-12 rounded-xl bg-[#0f1629] border border-[#1e2d50] flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-bold text-[#e8eaf6] mb-2">{f.title}</h3>
              <p className="text-sm text-[#8892b0]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#1e2d50] py-8 text-center text-sm text-[#4a5568]">
        © {new Date().getFullYear()} ExamGuard Platform. All rights reserved.
      </footer>
    </main>
  );
}
