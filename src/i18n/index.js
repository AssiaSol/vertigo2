import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { common } from "./translations/common";
import { home } from "./translations/home";
import { login } from "./translations/login";
import { signup } from "./translations/signup";
import { deals } from "./translations/deals";
import { orders } from "./translations/orders";
import { restaurantOrders } from "./translations/restaurantOrders";
import { becomeMerchant } from "./translations/becomeMerchant";
import { adminApprovals } from "./translations/adminApprovals";
import { favorites } from "./translations/favorites";
import { restaurantDetail } from "./translations/restaurantDetail";
import { profile } from "./translations/profile";
import { chatbot } from "./translations/chatbot";
import { rescueMap } from "./translations/rescueMap";

const dictionaries = {
  common,
  home,
  login,
  signup,
  deals,
  orders,
  restaurantOrders,
  becomeMerchant,
  adminApprovals,
  favorites,
  restaurantDetail,
  profile,
  chatbot,
  rescueMap,
};

export const SUPPORTED_LANGS = [
  { code: "en", label: "English", flag: "🇬🇧", dir: "ltr" },
  { code: "fr", label: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "ar", label: "العربية", flag: "🇩🇿", dir: "rtl" },
];

const STORAGE_KEY = "vertigo.lang";

function detectInitialLang() {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGS.some((l) => l.code === stored)) return stored;
  const nav = (window.navigator.language || "en").slice(0, 2).toLowerCase();
  if (nav === "fr") return "fr";
  if (nav === "ar") return "ar";
  return "en";
}

const I18nContext = createContext(null);

function resolveKey(dict, path) {
  if (!dict) return undefined;
  return path
    .split(".")
    .reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), dict);
}

function format(template, vars) {
  if (typeof template !== "string" || !vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLang);

  const setLang = useCallback((next) => {
    if (!SUPPORTED_LANGS.some((l) => l.code === next)) return;
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  useEffect(() => {
    const meta = SUPPORTED_LANGS.find((l) => l.code === lang) || SUPPORTED_LANGS[0];
    if (typeof document !== "undefined") {
      document.documentElement.lang = meta.code;
      document.documentElement.dir = meta.dir;
    }
  }, [lang]);

  const value = useMemo(() => {
    const t = (path, vars) => {
      const [ns, ...rest] = path.split(".");
      const subPath = rest.join(".");
      const dict = dictionaries[ns];
      if (!dict) return path;
      const langDict = dict[lang] || dict.en;
      const fallback = dict.en;
      const found = resolveKey(langDict, subPath);
      const value = found !== undefined ? found : resolveKey(fallback, subPath);
      if (value === undefined) return path;
      return format(value, vars);
    };
    const dir = (SUPPORTED_LANGS.find((l) => l.code === lang) || SUPPORTED_LANGS[0]).dir;
    return { lang, setLang, t, dir };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      lang: "en",
      setLang: () => {},
      dir: "ltr",
      t: (k) => k,
    };
  }
  return ctx;
}

export function useT() {
  return useI18n().t;
}

function GlobeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3 12h18M12 3c2.6 2.8 4 6 4 9s-1.4 6.2-4 9c-2.6-2.8-4-6-4-9s1.4-6.2 4-9Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const SHORT_LABELS = { en: "EN", fr: "FR", ar: "ع" };

export function LanguageSwitcher({ className = "", variant = "default" }) {
  const { lang, setLang } = useI18n();
  const isDark = variant === "dark";
  const color = isDark ? "text-eco-beige hover:text-white" : "text-eco-green hover:text-eco-coral";
  return (
    <label
      className={`relative inline-flex items-center gap-1 cursor-pointer transition ${color} ${className}`}
    >
      <span className="sr-only">Language</span>
      <GlobeIcon className="h-5 w-5" />
      <span className="text-[11px] font-bold tracking-wide">{SHORT_LABELS[lang] || lang.toUpperCase()}</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-label="Select language"
      >
        {SUPPORTED_LANGS.map((l) => (
          <option key={l.code} value={l.code} className="text-eco-green">
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
