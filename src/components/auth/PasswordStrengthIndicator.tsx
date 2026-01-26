"use client";

import { useMemo } from "react";

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
  { label: "One special character (!@#$%^&*...)", test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

interface PasswordStrengthIndicatorProps {
  password: string;
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { passed, strength, strengthLabel, strengthColor } = useMemo(() => {
    const passedCount = requirements.filter((req) => req.test(password)).length;
    const total = requirements.length;

    let label: string;
    let color: string;

    if (password.length === 0) {
      label = "";
      color = "bg-[#404040]";
    } else if (passedCount <= 1) {
      label = "Weak";
      color = "bg-red-500";
    } else if (passedCount <= 2) {
      label = "Fair";
      color = "bg-orange-500";
    } else if (passedCount <= 3) {
      label = "Good";
      color = "bg-yellow-500";
    } else if (passedCount <= 4) {
      label = "Strong";
      color = "bg-lime-500";
    } else {
      label = "Very Strong";
      color = "bg-green-500";
    }

    return {
      passed: passedCount,
      strength: passedCount / total,
      strengthLabel: label,
      strengthColor: color,
    };
  }, [password]);

  return (
    <div className="space-y-3">
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-[#A3A3A3]">Password strength</span>
          {strengthLabel && (
            <span className={`text-xs font-medium ${
              strengthLabel === "Weak" ? "text-red-400" :
              strengthLabel === "Fair" ? "text-orange-400" :
              strengthLabel === "Good" ? "text-yellow-400" :
              strengthLabel === "Strong" ? "text-lime-400" :
              "text-green-400"
            }`}>
              {strengthLabel}
            </span>
          )}
        </div>
        <div className="h-1.5 w-full bg-[#262626] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strengthColor}`}
            style={{ width: `${strength * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1.5">
        {requirements.map((req, index) => {
          const isPassed = password.length > 0 && req.test(password);
          return (
            <div
              key={index}
              className={`flex items-center gap-2 text-xs transition-colors ${
                password.length === 0
                  ? "text-[#737373]"
                  : isPassed
                    ? "text-green-400"
                    : "text-[#737373]"
              }`}
            >
              {isPassed ? (
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="9" strokeWidth={2} />
                </svg>
              )}
              <span>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { requirements };
