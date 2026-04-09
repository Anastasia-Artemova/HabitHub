"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import Link from "next/link";
import {
  Bell,
  Clock3,
  Settings,
  Users,
  Plus,
  LogIn,
  UserMinus,
  X,
  Crown,
  ShieldCheck,
  Hash,
  Copy,
  Check,
  RefreshCw,
  Ban,
  UserX,
  AlertCircle,
} from "lucide-react";

type InviteCode = {
  code: string;
  expiresAt: Date; 
  status: "active" | "invalid" | "expired";
};

type TeamMember = {
  id: number;
  name: string;
  email: string;
  status: "active" | "kicked" | "left";
};

type OwnedTeam = {
  id: number;
  name: string;
  members: TeamMember[];
  inviteCodes: InviteCode[];
};

type JoinedTeam = {
  id: number;
  name: string;
  memberCount: number;
};

const initialOwnedTeams: OwnedTeam[] = [
  {
    id: 1,
    name: "Runners",
    members: [
      { id: 101, name: "Alice", email: "alice@gmail.com", status: "active" },
      { id: 102, name: "John", email: "john@wp.pl", status: "active" },
    ],
    inviteCodes: [
      { code: "RUN-4821", expiresAt: new Date(Date.now() + 7 * 86400000), status: "active" },
    ],
  },
  {
    id: 2,
    name: "Readers",
    members: [
      { id: 103, name: "Sarah", email: "sarah@gmail.com", status: "active" },
    ],
    inviteCodes: [],
  },
];

const initialJoinedTeams: JoinedTeam[] = [
  { id: 3, name: "Morning Warriors", memberCount: 12 },
  { id: 4, name: "Gym Bros", memberCount: 6 },
];

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } },
};

function NavButton({ href, label, active = false }: { href: string; label: string; active?: boolean }) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={[
          "group relative overflow-hidden rounded-2xl border px-5 py-2.5 text-sm font-medium backdrop-blur-md transition md:text-base",
          active
            ? "border-emerald-400/70 bg-emerald-400/10 text-white shadow-[0_0_24px_rgba(16,185,129,0.18)]"
            : "border-white/15 bg-white/5 text-white/80 hover:border-white/25 hover:bg-white/10 hover:text-white",
        ].join(" ")}
      >
        <span className="relative z-10">{label}</span>
        {active && <span className="absolute inset-x-4 bottom-1 h-[2px] rounded-full bg-emerald-400" />}
      </motion.div>
    </Link>
  );
}

function IconButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -2, scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-white/80 backdrop-blur-md transition hover:border-white/25 hover:bg-white/10 hover:text-white md:h-12 md:w-12"
      >
        {children}
      </motion.div>
    </Link>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_35%)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-white/90">{icon}</div>
      <div>
        <h2 className="text-xl font-semibold text-white md:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}
      </div>
    </div>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center gap-2 text-white/60">
        {icon}
        <span className="text-xs uppercase tracking-[0.16em]">{label}</span>
      </div>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function Modal({ open, onClose, title, subtitle, children }: {
  open: boolean; onClose: () => void; title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.25 }}
            className="fixed left-1/2 top-1/2 z-50 w-[92%] max-w-lg -translate-x-1/2 -translate-y-1/2"
          >
            <div className="rounded-[30px] border border-white/10 bg-[#0B1018]/95 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-sm text-white/50">{subtitle}</p>
                </div>
                <button onClick={onClose}
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function InviteCodeBadge({ inviteCode, onInvalidate }: { inviteCode: InviteCode; onInvalidate: () => void }) {
  const [copied, setCopied] = useState(false);
  const daysLeft = Math.max(0, Math.ceil((inviteCode.expiresAt.getTime() - Date.now()) / 86400000));

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inviteCode.status !== "active") return null;

  return (
    <div className="mt-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-emerald-400/70" />
          <span className="font-mono text-sm font-semibold text-emerald-300">{inviteCode.code}</span>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/40">{daysLeft}d left</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={onInvalidate}
            className="flex items-center gap-1.5 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-1.5 text-xs text-rose-300 transition hover:bg-rose-400/15">
            <Ban className="h-3.5 w-3.5" />
            Invalidate
          </button>
        </div>
      </div>
    </div>
  );
}

function OwnedTeamCard({ team, onGenerateCode, onInvalidateCode, onKickMember, onDeleteTeam }: {
  team: OwnedTeam;
  onGenerateCode: (id: number) => void;
  onInvalidateCode: (id: number, code: string) => void;
  onKickMember: (teamId: number, memberId: number) => void;
  onDeleteTeam: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const activeCode = team.inviteCodes.find((c) => c.status === "active");
  const activeMembers = team.members.filter((m) => m.status === "active");

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }} whileHover={{ y: -2 }}
      className="rounded-[24px] border border-white/10 bg-white/5 p-5">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{team.name}</h3>
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/20">
              owner
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/65">
            <span className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
              <Users className="h-4 w-4" />{activeMembers.length} member{activeMembers.length !== 1 ? "s" : ""}
            </span>
            {activeCode && (
              <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-400/5 px-3 py-2 text-emerald-300/70">
                <Hash className="h-4 w-4" />Invite active
              </span>
            )}
          </div>

          {activeCode && (
            <InviteCodeBadge
              inviteCode={activeCode}
              onInvalidate={() => onInvalidateCode(team.id, activeCode.code)}
            />
          )}

          {!activeCode && (
            <button onClick={() => onGenerateCode(team.id)}
              className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white">
              <RefreshCw className="h-4 w-4" />Generate Invite Code
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 xl:w-auto xl:flex-col">
          <button onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white">
            <Users className="h-4 w-4" />{expanded ? "Hide Members" : "View Members"}
          </button>
          <button onClick={() => onDeleteTeam(team.id)}
            className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2.5 text-sm font-medium text-rose-300 transition hover:bg-rose-400/15">
            <UserX className="h-4 w-4" />Delete Team
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-4 space-y-2 border-t border-white/8 pt-4">
              <p className="mb-3 text-xs uppercase tracking-[0.16em] text-white/40">Active Members</p>
              {activeMembers.length === 0 ? (
                <p className="text-sm text-white/40">No members yet — share the invite code to get started.</p>
              ) : (
                activeMembers.map((member) => (
                  <div key={member.id}
                    className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{member.name}</p>
                      <p className="text-xs text-white/40">{member.email}</p>
                    </div>
                    <button onClick={() => onKickMember(team.id, member.id)}
                      className="flex items-center gap-1.5 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-1.5 text-xs text-rose-300 transition hover:bg-rose-400/15">
                      <UserMinus className="h-3.5 w-3.5" />Kick
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function JoinedTeamCard({ team, onLeave }: { team: JoinedTeam; onLeave: (id: number) => void }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }} whileHover={{ y: -2 }}
      className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{team.name}</h3>
            <span className="rounded-full bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-300 ring-1 ring-indigo-400/20">
              member
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/65">
            <span className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
              <Users className="h-4 w-4" />{team.memberCount} members
            </span>
          </div>
        </div>
        <button onClick={() => onLeave(team.id)}
          className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2.5 text-sm font-medium text-rose-300 transition hover:bg-rose-400/15">
          <UserMinus className="h-4 w-4" />Leave
        </button>
      </div>
    </motion.div>
  );
}

export default function TeamsPage() {
  const [ownedTeams, setOwnedTeams] = useState<OwnedTeam[]>(initialOwnedTeams);
  const [joinedTeams, setJoinedTeams] = useState<JoinedTeam[]>(initialJoinedTeams);
  const [activeTab, setActiveTab] = useState<"myteams" | "memberships">("myteams");

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [createError, setCreateError] = useState("");
  const [joinError, setJoinError] = useState("");

  const handleCreateTeam = () => {
    if (!createName.trim()) { setCreateError("Please enter a team name."); return; }
    setOwnedTeams((prev) => [
      { id: Date.now(), name: createName.trim(), members: [], inviteCodes: [] },
      ...prev,
    ]);
    setCreateName(""); setCreateError(""); setCreateOpen(false);
  };

  const handleGenerateCode = (teamId: number) => {
    const prefix = ownedTeams.find((t) => t.id === teamId)?.name.toUpperCase().slice(0, 3) ?? "INV";
    const code = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCode: InviteCode = {
      code,
      expiresAt: new Date(Date.now() + 10 * 86400000), 
      status: "active",
    };
    setOwnedTeams((prev) =>
      prev.map((t) => t.id === teamId ? { ...t, inviteCodes: [...t.inviteCodes, newCode] } : t)
    );
  };

  const handleInvalidateCode = (teamId: number, code: string) => {
    setOwnedTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? { ...t, inviteCodes: t.inviteCodes.map((c) => c.code === code ? { ...c, status: "invalid" as const } : c) }
          : t
      )
    );
  };

  const handleKickMember = (teamId: number, memberId: number) => {
    setOwnedTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? { ...t, members: t.members.map((m) => m.id === memberId ? { ...m, status: "kicked" as const } : m) }
          : t
      )
    );
  };

  const handleDeleteTeam = (teamId: number) => {
    setOwnedTeams((prev) => prev.filter((t) => t.id !== teamId));
  };

  const handleJoinTeam = () => {
    if (!inviteCode.trim()) { setJoinError("Please enter an invite code."); return; }
    const upper = inviteCode.trim().toUpperCase();
    const ownedCode = ownedTeams.some((t) => t.inviteCodes.some((c) => c.code === upper));
    if (ownedCode) { setJoinError("You cannot join a team you already own."); return; }
    setJoinedTeams((prev) => [
      { id: Date.now(), name: "Team " + upper, memberCount: Math.floor(3 + Math.random() * 10) },
      ...prev,
    ]);
    setInviteCode(""); setJoinError(""); setJoinOpen(false);
  };

  const handleLeaveTeam = (teamId: number) => {
    setJoinedTeams((prev) => prev.filter((t) => t.id !== teamId));
  };

  const totalActiveMembers = ownedTeams.reduce(
    (acc, t) => acc + t.members.filter((m) => m.status === "active").length, 0
  );
  const activeCodesCount = ownedTeams.reduce(
    (acc, t) => acc + t.inviteCodes.filter((c) => c.status === "active").length, 0
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#07090F] px-4 py-6 text-white sm:px-6 md:px-8 md:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(244,63,94,0.10),transparent_22%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <motion.div
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative mx-auto max-w-7xl rounded-[36px] border border-white/10 bg-black/35 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-5 md:rounded-[42px] md:p-7"
      >
        <header className="flex flex-col gap-5 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/70">HabitHub</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">Teams</h1>
              <p className="mt-2 text-sm text-white/50">
                Create teams, generate invite codes, manage members, and join others.
              </p>
            </div>
            <nav className="flex flex-wrap gap-3">
              <NavButton href="/dashboard" label="Home" />
              <NavButton href="/teams" label="Teams" active />
              <NavButton href="/habits" label="Habits" />
              <NavButton href="/progress" label="Progress" />
            </nav>
          </div>
          <div className="flex items-center gap-3 self-start lg:self-auto">
            <IconButton href="/notifications"><Bell className="h-5 w-5" /></IconButton>
            <IconButton href="/sessions"><Clock3 className="h-5 w-5" /></IconButton>
            <IconButton href="/settings"><Settings className="h-5 w-5" /></IconButton>
          </div>
        </header>

        <motion.section variants={containerVariants} initial="hidden" animate="show"
          className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_2fr]">

          <motion.div variants={itemVariants}>
            <Card>
              <SectionTitle icon={<Users className="h-5 w-5" />} title="Team Overview"
                subtitle="A snapshot of your teams and memberships" />

              <div className="grid gap-4 sm:grid-cols-2">
                <StatPill icon={<Crown className="h-4 w-4" />} label="My Teams" value={ownedTeams.length} />
                <StatPill icon={<ShieldCheck className="h-4 w-4" />} label="Memberships" value={joinedTeams.length} />
                <StatPill icon={<Users className="h-4 w-4" />} label="Total Members" value={totalActiveMembers} />
                <StatPill icon={<Hash className="h-4 w-4" />} label="Active Codes" value={activeCodesCount} />
              </div>

              <div className="mt-5 space-y-3">
                <button onClick={() => setCreateOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01]">
                  <Plus className="h-4 w-4" />Create New Team
                </button>
                <button onClick={() => setJoinOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white">
                  <LogIn className="h-4 w-4" />Join a Team
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.02] p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-white/30" />
                  <p className="text-xs leading-relaxed text-white/35">
                    Invite codes expire after <span className="text-white/50">10 days</span>.
                    Only Team Creators can generate and invalidate codes or kick members.
                    Team Creators cannot leave their own team.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <SectionTitle icon={<Users className="h-5 w-5" />} title="Team Management"
                subtitle="Manage teams you own, members, invite codes, and memberships" />

              <div className="mb-5 flex flex-wrap gap-3">
                <button onClick={() => setActiveTab("myteams")}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === "myteams"
                      ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}>
                  Your Teams
                </button>
                <button onClick={() => setActiveTab("memberships")}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === "memberships"
                      ? "bg-indigo-400/15 text-indigo-300 ring-1 ring-indigo-400/30"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}>
                  Your Memberships
                </button>
              </div>

              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {activeTab === "myteams" && (
                    ownedTeams.length > 0 ? (
                      ownedTeams.map((team) => (
                        <OwnedTeamCard key={team.id} team={team}
                          onGenerateCode={handleGenerateCode}
                          onInvalidateCode={handleInvalidateCode}
                          onKickMember={handleKickMember}
                          onDeleteTeam={handleDeleteTeam} />
                      ))
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="rounded-[24px] border border-dashed border-white/12 bg-white/[0.03] px-6 py-10 text-center">
                        <p className="text-lg font-medium text-white/80">No teams yet</p>
                        <p className="mt-2 text-sm text-white/45">Create a new team to get started.</p>
                      </motion.div>
                    )
                  )}

                  {activeTab === "memberships" && (
                    joinedTeams.length > 0 ? (
                      joinedTeams.map((team) => (
                        <JoinedTeamCard key={team.id} team={team} onLeave={handleLeaveTeam} />
                      ))
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="rounded-[24px] border border-dashed border-white/12 bg-white/[0.03] px-6 py-10 text-center">
                        <p className="text-lg font-medium text-white/80">No memberships yet</p>
                        <p className="mt-2 text-sm text-white/45">Join a team using an invite code.</p>
                      </motion.div>
                    )
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
        </motion.section>
      </motion.div>

      <Modal open={createOpen}
        onClose={() => { setCreateOpen(false); setCreateName(""); setCreateError(""); }}
        title="Create a Team"
        subtitle="Enter a name. You can generate an invite code from your team card after creation.">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-white/65">Team Name</label>
            <input value={createName}
              onChange={(e) => { setCreateName(e.target.value); setCreateError(""); }}
              placeholder="e.g. Morning Warriors"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-emerald-400/40"
              onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()} />
            {createError && <p className="mt-2 text-sm text-rose-400">{createError}</p>}
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button onClick={() => { setCreateOpen(false); setCreateName(""); setCreateError(""); }}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white">
              Cancel
            </button>
            <button onClick={handleCreateTeam}
              className="rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01]">
              Create Team
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={joinOpen}
        onClose={() => { setJoinOpen(false); setInviteCode(""); setJoinError(""); }}
        title="Join a Team"
        subtitle="Enter the invite code shared by the team creator. Codes are valid for 10 days.">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-white/65">Invite Code</label>
            <input value={inviteCode}
              onChange={(e) => { setInviteCode(e.target.value); setJoinError(""); }}
              placeholder="e.g. RUN-4821"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-white outline-none transition placeholder:font-sans placeholder:text-white/30 focus:border-emerald-400/40"
              onKeyDown={(e) => e.key === "Enter" && handleJoinTeam()} />
            {joinError && <p className="mt-2 text-sm text-rose-400">{joinError}</p>}
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button onClick={() => { setJoinOpen(false); setInviteCode(""); setJoinError(""); }}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white">
              Cancel
            </button>
            <button onClick={handleJoinTeam}
              className="rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01]">
              Join Team
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}