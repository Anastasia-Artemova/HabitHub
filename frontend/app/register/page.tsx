"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [Username, setUserName] = useState('');

    async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try{
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password, Username })
                }
            );
            if (!response.ok){
                const message = await response.text();
                throw new Error(message || 'Registration failed');
            }
            const data = await response.json();

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data));

            router.push("/dashboard");
        }
        catch(err){
            setError(err instanceof Error ? err.message : 'Something went wrong');
        }
        finally{
            setLoading(false);
        }
    }
    return (
    <div className="h-screen bg-slate-100 flex items-center justify-center p-4 lg:p-6">
      <div className="h-[90vh] w-full max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-2xl grid lg:grid-cols-2">
        <div className="relative hidden lg:flex flex-col overflow-y-auto bg-[radial-gradient(circle_at_top_left,_#667eea_0%,_#4c5fd7_40%,_#2f3f9e_100%)] p-8">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -left-16 top-12 h-64 w-[120%] rounded-[50%] border-[18px] border-white/70 opacity-90" />
            <div className="absolute -left-8 top-32 h-72 w-[120%] rounded-[50%] border-[10px] border-indigo-200/70 opacity-80" />
            <div className="absolute -left-20 bottom-8 h-80 w-[125%] rounded-[50%] border-[22px] border-indigo-900/45 opacity-80" />
            <div className="absolute left-12 bottom-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          </div>

          <div className="relative z-10 max-w-md text-white">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-400 text-lg">
                ✓
              </div>
              <span className="text-sm font-medium tracking-wide">HabitHub</span>
            </div>

            <img
              src="/login.png"
              alt="Habit illustration"
              className="mb-6 w-full max-w-[420px] rounded-lg object-contain"
            />

            <h1 className="mt-6 text-4xl font-bold leading-tight">
              Start strong.
              <br />
              Stay consistent.
            </h1>
            <p className="mt-4 max-w-sm text-sm text-indigo-100">
              Create your HabitHub account and begin building routines that last.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center bg-slate-100 p-6 sm:p-8 lg:p-12 overflow-y-auto">
          <div className="w-full max-w-md rounded-[28px] bg-amber-400 px-8 py-10 shadow-xl sm:px-10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Create Account</h2>
              <p className="mt-2 text-sm text-slate-800/80">
                Join HabitHub and start tracking your goals today.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleRegister}>
              <div>
                <label htmlFor="userName" className="mb-2 block text-sm font-medium text-slate-900">
                  Username
                </label>
                <input
                  id="userName"
                  type="text"
                  placeholder="Enter your username"
                  value={Username}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full rounded-full border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-300 text-slate-900"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-900">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-full border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-300 text-slate-900"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-900">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-full border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-300 text-slate-900"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-900">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-full border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-300 text-slate-900"
                  required
                />
              </div>

              {error && <p className="text-sm font-medium text-red-700">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-indigo-900 px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-900/80">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-slate-950 hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}