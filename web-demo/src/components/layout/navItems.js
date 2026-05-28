import { BookOpen, Dumbbell, MessageSquare, Trophy, TrendingUp, User } from "lucide-react";

export const navItems = [
  { path: "/profile", label: "Profile", code: "01", icon: User },
  { path: "/challenge", label: "Challenge", code: "02", icon: Trophy },
  { path: "/exercises", label: "Exercises and Tools", code: "03", icon: Dumbbell },
  { path: "/progress", label: "Progress", code: "04", icon: TrendingUp },
  { path: "/tutorials", label: "Tutorials", code: "05", icon: BookOpen },
  { path: "/chatbot", label: "Chatbot", code: "06", icon: MessageSquare },
];
