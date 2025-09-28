"use client";

import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation"; // 👈 import router

// ---------- helpers ----------
const toE164 = (raw: string) => {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return `+${digits}`;
};

function createFreshRecaptcha(containerId = "recaptcha-container") {
  if (typeof window === "undefined") return null;
  const w = window as any;

  let el = document.getElementById(containerId);
  if (!el) {
    el = document.createElement("div");
    el.id = containerId;
    el.style.visibility = "hidden";
    document.body.appendChild(el);
  }

  if (w.__recaptchaVerifier) {
    try {
      w.__recaptchaVerifier.clear();
    } catch {}
    w.__recaptchaVerifier = null;
  }

  w.__recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  return w.__recaptchaVerifier as RecaptchaVerifier;
}

// ---------- page ----------
export default function LoginPage() {
  const router = useRouter(); // 👈 init router
  const [tab, setTab] = useState<"phone" | "email">("phone");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(0);
  const confirmRef = useRef<ConfirmationResult | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [useEmailOtp, setUseEmailOtp] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // complete email magic-link if returning via link
  useEffect(() => {
    if (typeof window === "undefined") return;
    const completeEmailLink = async () => {
      if (!isSignInWithEmailLink(auth, window.location.href)) return;
      let stored = window.localStorage.getItem("emailForSignIn") || "";
      if (!stored) stored = window.prompt("Confirm your email to complete sign-in") || "";
      if (!stored) return;
      toast.loading("Completing email OTP…");
      try {
        await signInWithEmailLink(auth, stored, window.location.href);
        window.localStorage.removeItem("emailForSignIn");
        toast.success("Email OTP verified — you’re in!");
        router.push("/"); // 👈 redirect to home
      } catch (e: any) {
        toast.error(e?.message || "Email OTP verification failed");
      } finally {
        toast.dismiss();
      }
    };
    completeEmailLink();
  }, [router]);

  // phone: send OTP
  const sendPhoneOtp = async () => {
    const normalized = toE164(phone);
    if (!/^\+\d{10,15}$/.test(normalized)) return toast.error("Enter a valid phone number");
    toast.loading("Preparing verification…");
    try {
      const verifier = createFreshRecaptcha();
      const conf = await signInWithPhoneNumber(auth, normalized, verifier!);
      confirmRef.current = conf;
      setCooldown(60);
      toast.success("OTP sent to your phone");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send OTP");
    } finally {
      toast.dismiss();
    }
  };

  // phone: verify
  const verifyPhoneOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) return toast.error("Enter the 6-digit code");
    if (!confirmRef.current) return toast.error("Session expired. Please resend OTP.");
    toast.loading("Verifying code…");
    try {
      await confirmRef.current.confirm(code);
      toast.success("Phone verified — you’re in!");
      router.push("/"); // 👈 redirect to home
    } catch (e: any) {
      toast.error(e?.message || "Invalid or expired OTP");
    } finally {
      toast.dismiss();
    }
  };

  // email: password
  const emailPasswordSignIn = async () => {
    if (!email || !password) return toast.error("Enter email and password");
    toast.loading("Signing in…");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      toast.success("Signed in successfully");
      router.push("/"); // 👈 redirect to home
    } catch (e: any) {
      toast.error(e?.message || "Sign-in failed");
    } finally {
      toast.dismiss();
    }
  };

  // email: OTP (magic link)
  const emailOtpSignIn = async () => {
    if (!email) return toast.error("Enter your email");
    const actionCodeSettings = {
      url: process.env.NEXT_PUBLIC_EMAIL_LINK_URL || window.location.origin + "/(auth)/login",
      handleCodeInApp: true,
    };
    toast.loading("Sending secure sign-in link…");
    try {
      await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email.trim());
      toast.success("Check your inbox for the sign-in link");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send link");
    } finally {
      toast.dismiss();
    }
  };

  const setOtpBox = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const copy = [...otp];
    copy[i] = v;
    setOtp(copy);
    if (v && i < 5) (document.getElementById(`otp-${i + 1}`) as HTMLInputElement | null)?.focus();
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Sign in with your phone or email.</p>

        {/* tabs */}
        <div className="mb-5 grid grid-cols-2 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-800">
          <button
            onClick={() => setTab("phone")}
            className={`py-2 text-sm font-medium ${
              tab === "phone"
                ? "bg-gray-900 text-white dark:bg-white dark:text-black"
                : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200"
            }`}
          >
            Phone
          </button>
          <button
            onClick={() => setTab("email")}
            className={`py-2 text-sm font-medium ${
              tab === "email"
                ? "bg-gray-900 text-white dark:bg-white dark:text-black"
                : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200"
            }`}
          >
            Email
          </button>
        </div>

        {tab === "phone" && (
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Mobile Number
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. 9876543210"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>

            {/* Invisible reCAPTCHA target */}
            <div id="recaptcha-container" />

            <button
              onClick={sendPhoneOtp}
              className="w-full rounded-xl py-2 font-medium bg-gray-900 text-white dark:bg-white dark:text-black"
            >
              Send OTP
            </button>

            <div className="mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Enter the 6-digit code sent to <b>{phone ? toE164(phone) : "your number"}</b>.
              </p>
              <div className="flex gap-2">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    className="w-12 h-14 text-center text-lg rounded-xl border border-gray-300 dark:border-slate-700 bg-transparent"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => setOtpBox(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otp[i] && i > 0) {
                        (document.getElementById(`otp-${i - 1}`) as HTMLInputElement | null)?.focus();
                      }
                    }}
                  />
                ))}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={verifyPhoneOtp}
                  className="rounded-xl px-4 py-2 font-medium bg-gray-900 text-white dark:bg-white dark:text-black"
                >
                  Verify & Continue
                </button>
                <button
                  disabled={cooldown > 0}
                  onClick={sendPhoneOtp}
                  className="text-sm underline disabled:no-underline disabled:text-gray-400"
                >
                  Resend {cooldown > 0 ? `(${cooldown})` : ""}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "email" && (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useEmailOtp}
                onChange={(e) => setUseEmailOtp(e.target.checked)}
              />
              Use email OTP (magic link) instead of password
            </label>

            <label className="block text-sm font-medium">
              Email
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            {!useEmailOtp && (
              <label className="block text-sm font-medium">
                Password
                <input
                  className="mt-1 w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}

            {useEmailOtp ? (
              <button
                onClick={emailOtpSignIn}
                className="w-full rounded-xl py-2 font-medium bg-gray-900 text-white dark:bg-white dark:text-black"
              >
                Send sign-in link
              </button>
            ) : (
              <button
                onClick={emailPasswordSignIn}
                className="w-full rounded-xl py-2 font-medium bg-gray-900 text-white dark:bg-white dark:text-black"
              >
                Sign in
              </button>
            )}

            {useEmailOtp && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                We’ll email you a secure link. Open it on this device to complete login.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
