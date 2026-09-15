"use client";

import { authClient } from "@/lib/auth-client";

function GoogleIcon() {
  return (
    <svg
      className="w-5 h-5 text-slate-200 group-hover:scale-110 transition-transform"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12.24 10.285V13.4h6.887C18.2 15.633 16.274 18 12.24 18c-3.321 0-6.02-2.709-6.02-6s2.699-6 6.02-6c1.482 0 2.83.546 3.87 1.433l2.425-2.425C17.066 3.632 14.805 2.8 12.24 2.8 7.152 2.8 3.02 6.924 3.02 12.012s4.132 9.212 9.22 9.212c5.32 0 8.847-3.743 8.847-9.004 0-.61-.065-1.19-.187-1.935H12.24z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      className="w-5 h-5 text-slate-200 group-hover:scale-110 transition-transform"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export default function SocialSignInButtons() {
  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/proyectos",
      errorCallbackURL: "/auth/login?error=social",
    });
  };

  const handleGitHubSignIn = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/proyectos",
      errorCallbackURL: "/auth/login?error=social",
    });
  };

  return (
    <div
      className="flex items-center justify-center gap-4"
      data-purpose="social-login-group"
    >
      {/* Google Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        title="Continuar con Google"
        aria-label="Continuar con Google"
        className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 hover:border-app-primary/50 hover:bg-[#1f2536] flex items-center justify-center text-white transition duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/50 cursor-pointer"
      >
        <GoogleIcon />
      </button>

      {/* GitHub Button */}
      <button
        type="button"
        onClick={handleGitHubSignIn}
        title="Continuar con GitHub"
        aria-label="Continuar con GitHub"
        className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 hover:border-app-primary/50 hover:bg-[#1f2536] flex items-center justify-center text-white transition duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/50 cursor-pointer"
      >
        <GitHubIcon />
      </button>
    </div>
  );
}
