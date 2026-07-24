import type { NavItem } from "@/components/shared/app-sidebar";

const CANDIDATE_NAV_ITEMS: NavItem[] = [
  { href: "/candidate", label: "Dashboard", icon: "dashboard" },
  { href: "/jobs", label: "Jobs", icon: "jobs" },
  { href: "/candidate/applications", label: "Aplicaciones", icon: "applications" },
  { href: "/candidate/coach", label: "Career Coach", icon: "coach", badge: "Nuevo" },
  { href: "/candidate/passport", label: "Career Passport", icon: "passport" },
  { href: "/candidate/roadmap", label: "Roadmap", icon: "roadmap" },
];

const RECRUITER_NAV_ITEMS: NavItem[] = [
  { href: "/recruiter", label: "Dashboard", icon: "dashboard" },
  { href: "/recruiter/jobs", label: "Jobs", icon: "jobs" },
  { href: "/recruiter/company", label: "Mi compañía", icon: "company" },
];

export { CANDIDATE_NAV_ITEMS, RECRUITER_NAV_ITEMS };
