import { useEffect, useMemo, useRef, useState } from "react";
import { getHomeInit } from "./api/home";
import { RescueMap } from "./components/RescueMap";
import { Link } from "react-router-dom";
import { LanguageSwitcher, useT } from "./i18n";
import heroBag from "./assets/hero-bag.png";
import vertigoLogo from "./assets/vertigo-logo.png";

// ── Category metadata (stable, language-agnostic) ──────────────────────────
const categoryMeta = [
  {
    id: "bakery",
    priceAmount: "350",
    savePercent: "60",
    image:
      "https://images.unsplash.com/photo-1568254183919-78a4f43a2877?q=80&w=1469&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "food",
    priceAmount: "500",
    savePercent: "50",
    image:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=70",
  },
  {
    id: "grocery",
    priceAmount: "400",
    savePercent: "55",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=70",
  },
  {
    id: "dessert",
    priceAmount: "250",
    savePercent: "65",
    image:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=70",
  },
];

// ── Restaurants per basket id; tag uses a translation key ──────────────────
const restaurantsByBasket = {
  bakery: [
    { name: "Le Petit Four", rating: 4.8, distance: "0.3 km", tagKey: "home.tags.closes9pm" },
    { name: "Sunrise Bread Co.", rating: 4.5, distance: "0.7 km", tagKey: "home.tags.basketsLeftMany", tagVars: { count: 2 } },
    { name: "Golden Crust", rating: 4.2, distance: "1.1 km", tagKey: "home.tags.closes8pm" },
  ],
  food: [
    { name: "Casa Delicia", rating: 4.7, distance: "0.4 km", tagKey: "home.tags.basketsLeftMany", tagVars: { count: 3 } },
    { name: "Chef's Table", rating: 4.5, distance: "0.6 km", tagKey: "home.tags.closes10pm" },
    { name: "Daily Bites", rating: 4.3, distance: "1.0 km", tagKey: "home.tags.basketsLeftOne" },
  ],
  grocery: [
    { name: "FreshMart", rating: 4.6, distance: "0.5 km", tagKey: "home.tags.basketsLeftMany", tagVars: { count: 3 } },
    { name: "Green Corner", rating: 4.3, distance: "0.9 km", tagKey: "home.tags.closes10pm" },
  ],
  dessert: [
    { name: "Sweet Rescue", rating: 4.9, distance: "0.4 km", tagKey: "home.tags.basketsLeftOne" },
    { name: "Choco Heaven", rating: 4.7, distance: "0.8 km", tagKey: "home.tags.closes9pm" },
  ],
};

// ── Testimonials data — stable ids, copy comes from translations ───────────
const testimonialMeta = [
  { id: "amina", initial: "A" },
  { id: "karim", initial: "K" },
  { id: "sara", initial: "S" },
];

function ArrowIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
      <path
        d="M13.2 5.6 19.6 12l-6.4 6.4M19 12H4.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
      <path
        d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 11.5a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M15.8 15.8 21 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LeafIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
      <path
        d="M20 4s-6.5-.7-11 3.8S5.2 19 5.2 19s6.4.8 10.9-3.7S20 4 20 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M7 17c3.5-6 7-8.8 11-11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
      <path
        d="M7.5 2.8h9A4.7 4.7 0 0 1 21.2 7.5v9A4.7 4.7 0 0 1 16.5 21.2h-9A4.7 4.7 0 0 1 2.8 16.5v-9A4.7 4.7 0 0 1 7.5 2.8Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 16.3A4.3 4.3 0 1 0 12 7.7a4.3 4.3 0 0 0 0 8.6Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M17.4 6.6h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
      <path
        d="M13.5 22v-9H11V10h2.5V7.7C13.5 5 15.2 3.5 18 3.5H20V6h-2c-1.2 0-1.5.6-1.5 1.5V10H20l-.6 3h-2.9v9h-3Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
      <path
        d="M5 5h4.7l4.1 5.6L18.6 5H21l-6.1 7.8L21.3 19H16.6l-4.5-6.1L7.2 19H4.8l6.4-8.2L5 5Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function MenuIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HomePage() {
  const t = useT();

  // ── Translated, derived collections (re-evaluated on language change) ─────
  const categories = useMemo(
    () =>
      categoryMeta.map((c) => ({
        id: c.id,
        title: t(`home.categories.${c.id}.title`),
        description: t(`home.categories.${c.id}.description`),
        price: t("home.baskets.priceFrom", { amount: c.priceAmount, currency: t("common.currency") }),
        savings: t("home.baskets.savePercent", { percent: c.savePercent }),
        image: c.image,
      })),
    [t]
  );

  const testimonials = useMemo(
    () =>
      testimonialMeta.map((tm) => ({
        id: tm.id,
        name: t(`home.testimonials.${tm.id}.name`),
        city: t(`home.testimonials.${tm.id}.city`),
        quote: t(`home.testimonials.${tm.id}.quote`),
        initial: tm.initial,
      })),
    [t]
  );

  const basketRowRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const cityRowRef = useRef(null);
  const [activeCityIdx, setActiveCityIdx] = useState(0);

  const heroBagZoneRef = useRef(null);
  const [bagPlayTick, setBagPlayTick] = useState(0);
  const heroBagEnteredRef = useRef(false);

  const basketsSectionRef = useRef(null);
  const [basketPlayTick, setBasketPlayTick] = useState(0);
  const basketsEnteredRef = useRef(false);

  const [basketSearch, setBasketSearch] = useState("");

  // ── Modal state ────────────────────────────────────────────────────────────
  const [selectedBasket, setSelectedBasket] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // ── Mobile nav state ───────────────────────────────────────────────────────
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // ── Scrolled state for header ──────────────────────────────────────────────
  const [scrolled, setScrolled] = useState(false);

  // ── Active nav section ─────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState("home");

  // ── Dynamic impact stats from /home/init ──────────────────────────────────
  // Store raw values + label keys; labels are translated at render time.
  const [impactStatsRaw, setImpactStatsRaw] = useState([
    { value: "—", labelKey: "home.about.statFoodRescued" },
    { value: "120 kg", labelKey: "home.about.statCo2" },
    { value: "—", labelKey: "home.about.statPartners" },
    { value: "—", labelKey: "home.about.statDepartments" },
  ]);

  useEffect(() => {
    getHomeInit()
      .then(({ stats }) => {
        setImpactStatsRaw([
          { value: stats.foodRescued, labelKey: "home.about.statFoodRescued" },
          { value: "120 kg", labelKey: "home.about.statCo2" },
          { value: String(stats.partnerCount), labelKey: "home.about.statPartners" },
          { value: String(stats.villesCount), labelKey: "home.about.statDepartments" },
        ]);
      })
      .catch(() => {});
  }, []);

  const impactStats = useMemo(
    () => impactStatsRaw.map((s) => ({ value: s.value, label: t(s.labelKey) })),
    [impactStatsRaw, t]
  );

  // Filter chips by stable id; matching is language-independent.
  const filterChips = useMemo(
    () => [
      { id: "all", label: t("home.baskets.chipAll") },
      { id: "bakery", label: t("home.baskets.chipBakery") },
      { id: "food", label: t("home.baskets.chipFood") },
      { id: "grocery", label: t("home.baskets.chipGrocery") },
      { id: "dessert", label: t("home.baskets.chipDessert") },
    ],
    [t]
  );
  const [activeChipId, setActiveChipId] = useState("all");

  const filteredBaskets = useMemo(() => {
    // If a category chip is active, filter by stable id.
    if (activeChipId !== "all") {
      const byId = categories.filter((c) => c.id === activeChipId);
      if (basketSearch.trim() === "") return byId;
      const q = basketSearch.trim().toLowerCase();
      return byId.filter((c) =>
        `${c.title} ${c.description}`.toLowerCase().replace(/\n/g, " ").includes(q)
      );
    }
    const q = basketSearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => {
      const haystack = `${c.title} ${c.description}`.toLowerCase().replace(/\n/g, " ");
      return haystack.includes(q);
    });
  }, [basketSearch, activeChipId, categories]);

  const cities = useMemo(
    () => [
      {
        id: "mostaganem",
        name: t("home.cities.mostaganem"),
        lat: 35.9359,
        lng: 0.0892,
        zoom: 13,
        partnerCount: t("home.community.partnerCount", { count: 12 }),
        restaurants: [
          { name: "Café du Port", cuisine: t("home.cuisine.cafe"), lat: 35.9395, lng: 0.0915 },
          { name: "La Bonne Mie", cuisine: t("home.cuisine.bakery"), lat: 35.9330, lng: 0.0860 },
          { name: "Saveurs de la Mer", cuisine: t("home.cuisine.seafood"), lat: 35.9408, lng: 0.0830 },
          { name: "Pâtisserie Amine", cuisine: t("home.cuisine.pastry"), lat: 35.9300, lng: 0.0945 },
        ],
      },
      {
        id: "oran",
        name: t("home.cities.oran"),
        lat: 35.6969,
        lng: -0.6331,
        zoom: 13,
        partnerCount: t("home.community.partnerCount", { count: 12 }),
        restaurants: [
          { name: "Oran Bakery", cuisine: t("home.cuisine.bakery"), lat: 35.6975, lng: -0.6310 },
          { name: "Café Riviera", cuisine: t("home.cuisine.cafe"), lat: 35.7002, lng: -0.6400 },
          { name: "Pizza Roma", cuisine: t("home.cuisine.italian"), lat: 35.6920, lng: -0.6250 },
          { name: "Le Petit Four", cuisine: t("home.cuisine.pastry"), lat: 35.6955, lng: -0.6350 },
          { name: "Couscous Royal", cuisine: t("home.cuisine.algerian"), lat: 35.6880, lng: -0.6400 },
          { name: "Sushi Oran", cuisine: t("home.cuisine.japanese"), lat: 35.7050, lng: -0.6200 },
          { name: "Burger House", cuisine: t("home.cuisine.burgers"), lat: 35.6933, lng: -0.6300 },
          { name: "Green Garden", cuisine: t("home.cuisine.vegetarian"), lat: 35.6900, lng: -0.6450 },
        ],
      },
      {
        id: "sidiBelAbbes",
        name: t("home.cities.sidiBelAbbes"),
        lat: 35.1878,
        lng: -0.6306,
        zoom: 13,
        partnerCount: t("home.community.partnerCount", { count: 6 }),
        restaurants: [
          { name: "Boulangerie Centrale", cuisine: t("home.cuisine.bakery"), lat: 35.1910, lng: -0.6280 },
          { name: "Chez Malik", cuisine: t("home.cuisine.algerian"), lat: 35.1850, lng: -0.6350 },
          { name: "Café des Arts", cuisine: t("home.cuisine.cafe"), lat: 35.1895, lng: -0.6325 },
          { name: "Délices Sucrés", cuisine: t("home.cuisine.pastry"), lat: 35.1840, lng: -0.6285 },
        ],
      },
    ],
    [t]
  );

  // ── Scroll listener for header style + active section ─────────────────────
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      const sections = ["home", "baskets", "community", "about", "download", "contact"];
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 100) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = basketRowRef.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft < max - 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const el = basketRowRef.current;
    if (!el) return;
    if (typeof el.scrollTo === "function") {
      el.scrollTo({ left: 0, behavior: "auto" });
    } else {
      el.scrollLeft = 0;
    }
    requestAnimationFrame(() => {
      const max = el.scrollWidth - el.clientWidth;
      setCanScrollLeft(false);
      setCanScrollRight(max > 0);
    });
  }, [basketSearch, filteredBaskets.length]);

  useEffect(() => {
    const el = heroBagZoneRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        const vis = e.isIntersecting && e.intersectionRatio >= 0.22;
        if (vis) {
          if (!heroBagEnteredRef.current) {
            heroBagEnteredRef.current = true;
            setBagPlayTick((t) => t + 1);
          }
        } else {
          heroBagEnteredRef.current = false;
        }
      },
      { threshold: [0, 0.15, 0.22, 0.35] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = basketsSectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        const vis = e.isIntersecting && e.intersectionRatio >= 0.12;
        if (vis) {
          if (!basketsEnteredRef.current) {
            basketsEnteredRef.current = true;
            setBasketPlayTick((t) => t + 1);
          }
        } else {
          basketsEnteredRef.current = false;
        }
      },
      { threshold: [0, 0.08, 0.12, 0.2] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ── Close modal & mobile nav on Escape ────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        setSelectedBasket(null);
        setMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Lock body scroll when modal or mobile nav is open ─────────────────────
  useEffect(() => {
    document.body.style.overflow = (selectedBasket || mobileNavOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedBasket, mobileNavOpen]);

  const scrollBaskets = (dir) => {
    const el = basketRowRef.current;
    if (!el) return;
    const amount = Math.max(280, Math.floor(el.clientWidth * 0.85));
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  useEffect(() => {
    const el = cityRowRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth || 1;
      const idx = Math.round(el.scrollLeft / w);
      const clamped = Math.max(0, Math.min(cities.length - 1, idx));
      setActiveCityIdx(clamped);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navLinks = [
    { href: "#home", label: t("home.nav.home"), id: "home" },
    { href: "#community", label: t("home.nav.community"), id: "community" },
    { href: "#about", label: t("home.nav.about"), id: "about" },
    { href: "#contact", label: t("home.nav.contact"), id: "contact" },
  ];

  return (
    <div className="min-h-screen bg-eco-beige text-eco-green">

      {/* ── Mobile Nav Drawer ─────────────────────────────────────────────────── */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-72 bg-eco-green text-eco-beige shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
              <img src={vertigoLogo} alt={t("common.appName")} className="h-10 w-auto select-none" draggable="false" />
              <button
                onClick={() => setMobileNavOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 hover:bg-white/20 transition"
                aria-label={t("home.nav.closeMenu")}
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col px-5 py-6 gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={[
                    "rounded-xl px-4 py-3 text-sm font-medium transition",
                    activeSection === link.id
                      ? "bg-eco-coral text-white"
                      : "text-eco-beige/80 hover:bg-white/10 hover:text-eco-beige",
                  ].join(" ")}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="px-5 border-t border-white/10 pt-5 flex flex-col gap-3">
              <Link
                to="/login"
                onClick={() => setMobileNavOpen(false)}
                className="text-center rounded-xl border border-white/20 py-2.5 text-sm font-medium text-eco-beige/80 hover:bg-white/10 transition"
              >
                {t("common.nav.login")}
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileNavOpen(false)}
                className="text-center rounded-xl bg-eco-coral py-2.5 text-sm font-semibold text-white hover:brightness-95 transition"
              >
                {t("common.nav.signup")}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Restaurant Modal ─────────────────────────────────────────────────── */}
      {selectedBasket && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedBasket(null)}
          role="dialog"
          aria-modal="true"
          aria-label={t("home.modal.ariaLabel", { title: selectedBasket.title })}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal image header */}
            <div className="relative h-36">
              <img
                src={selectedBasket.image}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
              <div className="absolute bottom-4 left-5 right-10">
                <p className="font-heading text-lg font-bold text-white">
                  {selectedBasket.title}
                </p>
                <p className="text-xs text-white/75">
                  {t("home.modal.subtitle")}
                </p>
              </div>
              <button
                onClick={() => setSelectedBasket(null)}
                className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-black/40 text-sm text-white transition hover:bg-black/60"
                aria-label={t("home.modal.closeAria")}
              >
                ✕
              </button>
            </div>

            {/* Restaurant list */}
            <ul className="max-h-72 divide-y divide-eco-green/10 overflow-y-auto">
              {(restaurantsByBasket[selectedBasket.id] ?? []).length === 0 ? (
                <li className="flex flex-col items-center px-5 py-8 text-center">
                  <span className="text-3xl mb-2">🛒</span>
                  <p className="font-heading text-sm font-semibold text-eco-green">{t("home.modal.emptyTitle")}</p>
                  <p className="mt-1 text-xs text-eco-green/55">{t("home.modal.emptyHint")}</p>
                </li>
              ) : (
                (restaurantsByBasket[selectedBasket.id] ?? []).map((r, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between px-5 py-3.5 transition hover:bg-eco-green/5"
                  >
                    <div>
                      <p className="font-heading text-sm font-semibold text-eco-green">
                        {r.name}
                      </p>
                      <p className="mt-0.5 text-xs text-eco-green/55">
                        {r.distance} · {t(r.tagKey, r.tagVars)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-xl bg-eco-green/10 px-2.5 py-1">
                        <span className="text-xs font-bold text-eco-coral">★</span>
                        <span className="text-xs font-semibold text-eco-green">
                          {r.rating}
                        </span>
                      </div>
                      <Link
                        to="/signup"
                        className="rounded-xl bg-eco-coral px-3 py-1 text-xs font-semibold text-white hover:brightness-95 transition"
                      >
                        {t("home.modal.reserve")}
                      </Link>
                    </div>
                  </li>
                ))
              )}
            </ul>

            {/* Close button */}
            <div className="border-t border-eco-green/10 px-5 py-3">
              <button
                onClick={() => setSelectedBasket(null)}
                className="w-full rounded-xl bg-eco-coral py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
              >
                {t("home.modal.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Auth Modal ───────────────────────────────────────────────────────── */}
      {authModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setAuthModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t("home.modal.authAriaLabel")}
        >
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-eco-green/10 text-sm text-eco-green transition hover:bg-eco-green/20"
              aria-label={t("home.modal.closeAria")}
            >
              ✕
            </button>

            <div className="px-6 pt-8 pb-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-eco-coral/15 text-eco-coral">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3 className="mt-4 font-heading text-xl font-extrabold text-eco-green">
                {t("home.modal.authTitle")}
              </h3>
              <p className="mt-1 text-sm text-eco-green/60">
                {t("home.modal.authDescription")}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 px-6 pb-6">
              <Link
                to="/login"
                onClick={() => setAuthModalOpen(false)}
                className="w-full rounded-xl bg-eco-green py-2.5 text-center text-sm font-semibold text-eco-beige transition hover:brightness-[1.05]"
              >
                {t("common.nav.login")}
              </Link>
              <Link
                to="/signup"
                onClick={() => setAuthModalOpen(false)}
                className="w-full rounded-xl border border-eco-green/20 bg-white py-2.5 text-center text-sm font-semibold text-eco-green transition hover:bg-eco-green/5"
              >
                {t("common.nav.signup")}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header
        className={[
          "fixed inset-x-0 top-0 z-50 text-eco-beige transition-all duration-300",
          scrolled
            ? "bg-eco-green/95 shadow-lg backdrop-blur-md"
            : "bg-eco-green shadow-lg",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="inline-flex">
              <img
                src={vertigoLogo}
                alt={t("common.appName")}
                className="h-12 w-auto select-none md:h-14"
                draggable="false"
              />
            </Link>
          </div>

          {/* Desktop nav with active state */}
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                className={[
                  "transition-all",
                  activeSection === link.id
                    ? "text-eco-softYellow font-semibold"
                    : "opacity-75 hover:opacity-100",
                ].join(" ")}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center px-3 py-2 text-xs font-medium text-eco-beige/80 transition hover:text-eco-beige sm:text-sm"
            >
              {t("common.nav.login")}
            </Link>
            <div className="hidden sm:block h-5 w-px bg-[#d6d1c4]" />
            <Link
              to="/signup"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-eco-coral px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-95 sm:text-sm"
            >
              {t("common.nav.signup")}
              <ArrowIcon className="h-4 w-4" />
            </Link>
            <LanguageSwitcher variant="dark" />
            {/* Mobile hamburger — only on small screens */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 hover:bg-white/20 transition md:hidden"
              aria-label={t("home.nav.openMenu")}
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main id="home" className="relative pt-24 md:pt-28">
        <div className="mx-auto max-w-6xl px-4 pt-5 pb-1 md:pt-6 md:pb-2">
          <p className="mx-auto max-w-2xl text-center font-heading text-lg font-semibold italic leading-relaxed tracking-wide text-eco-coral sm:text-xl md:text-2xl">
            {t("home.hero.tagline")}
          </p>
        </div>

        {/* ── Hero ─────────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-eco-softYellow/40 via-transparent to-transparent" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 py-10 md:grid-cols-2 md:gap-12 md:py-14 lg:py-16">
            <div>
              {/* FIX: Simplified headline with single accent color */}
              <h1 className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
                {t("home.hero.titlePart1")}{" "}
                <span className="text-eco-coral">{t("home.hero.titleAccent")}</span>{" "}
                {t("home.hero.titlePart2")}
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-eco-green/65 md:text-base max-w-md">
                {t("home.hero.description")}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#about"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("about")
                      ?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
                  }}
                  className="group inline-flex items-center gap-2 rounded-2xl bg-eco-coral px-6 py-3 text-sm font-semibold text-white shadow-lg ring-1 ring-black/5 hover:brightness-95"
                >
                  {t("home.hero.aboutCta")}
                  <span className="grid h-7 w-7 place-items-center rounded-2xl bg-white/20">
                    <ArrowIcon className="h-4 w-4 text-white" />
                  </span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("download");
                    if (el) {
                      const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
                      window.scrollTo({ top: y, behavior: "smooth" });
                    }
                  }}
                  className="group inline-flex items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-6 py-3 text-sm font-semibold text-eco-green shadow-[0_10px_24px_-12px_rgba(63,93,58,0.25)] ring-1 ring-eco-green/[0.04] backdrop-blur-xl transition hover:bg-white/90 active:scale-[0.98] cursor-pointer"
                >
                  {t("home.hero.downloadCta")}
                  <span className="grid h-7 w-7 place-items-center rounded-2xl border border-eco-coral/30 bg-white/30">
                    <ArrowIcon className="h-4 w-4 text-eco-green" />
                  </span>
                </button>
              </div>
            </div>

            <div ref={heroBagZoneRef} className="relative mx-auto w-full max-w-md md:max-w-lg">
              <div className="absolute -inset-6 rounded-[2.75rem] bg-white/20 blur-xl" />
              <img
                key={bagPlayTick}
                src={heroBag}
                alt={t("home.hero.bagAlt")}
                className={[
                  "relative mx-auto w-[88%] rounded-2xl object-contain drop-shadow-2xl md:w-full",
                  bagPlayTick > 0 ? "motion-safe:animate-slide-in-right" : "",
                ].join(" ")}
              />
            </div>
          </div>
        </section>

        {/* ── Baskets ──────────────────────────────────────────────────────────── */}
        <section
          id="baskets"
          ref={basketsSectionRef}
          className="mx-auto max-w-6xl px-4 pt-4 pb-12 md:pt-6 md:pb-16"
          aria-labelledby="baskets-heading"
        >
          {/* Centered iOS App Store-style header */}
          <div className="mb-8 flex flex-col items-center text-center md:mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-eco-coral/10 px-3 py-1 ring-1 ring-eco-coral/15">
              <span className="h-1.5 w-1.5 rounded-full bg-eco-coral" />
              <p className="font-heading text-[10px] font-bold uppercase tracking-[0.24em] text-eco-coral">
                {t("home.baskets.eyebrow")}
              </p>
            </div>

            <h2
              id="baskets-heading"
              className="mt-4 max-w-2xl font-heading text-[1.9rem] font-extrabold leading-[1.05] tracking-[-0.02em] text-eco-green md:text-[2.5rem] lg:text-[2.85rem]"
            >
              {t("home.baskets.headingPart1")}{" "}
              <span className="relative inline-block">
                <span className="relative z-[1]">{t("home.baskets.headingAccent")}</span>
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 h-[6px] w-full rounded-full bg-eco-softYellow/70"
                />
              </span>
              {t("home.baskets.headingPart2")}
            </h2>

            <p className="mt-4 max-w-md text-[14px] leading-[1.65] text-eco-green/60 md:text-[15px]">
              {t("home.baskets.subheading")}
            </p>
          </div>

          {/* Centered search + filter chips */}
          <div className="mb-8 flex flex-col items-center gap-4 md:mb-10">
            <label htmlFor="basket-search" className="sr-only">
              {t("home.baskets.searchLabel")}
            </label>

            {/* Premium search pill — centered, iOS Spotlight vibe */}
            <div className="relative w-full max-w-lg">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-[1px] rounded-full bg-gradient-to-b from-white/80 via-white/30 to-transparent opacity-70 blur-[1px]"
              />
              <div className="relative flex items-center">
                <span className="absolute left-2.5 z-10 grid h-9 w-9 place-items-center rounded-full bg-eco-green/[0.06] text-eco-green/75">
                  <SearchIcon className="h-[15px] w-[15px]" />
                </span>
                <input
                  id="basket-search"
                  type="search"
                  autoComplete="off"
                  placeholder={t("home.baskets.searchPlaceholder")}
                  value={basketSearch}
                  onChange={(e) => setBasketSearch(e.target.value)}
                  className="w-full rounded-full border border-white/60 bg-white/60 py-4 pl-14 pr-14 text-center text-[14px] font-medium text-eco-green shadow-[0_14px_34px_-16px_rgba(63,93,58,0.28),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl ring-1 ring-eco-green/[0.04] transition placeholder:text-eco-green/40 hover:bg-white/70 focus:border-eco-coral/40 focus:bg-white/85 focus:outline-none focus:ring-4 focus:ring-eco-coral/15"
                />
                {basketSearch.trim() ? (
                  <button
                    type="button"
                    onClick={() => setBasketSearch("")}
                    aria-label={t("home.baskets.clearSearch")}
                    className="absolute right-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-eco-green/[0.08] text-eco-green/60 transition hover:bg-eco-green/[0.15] hover:text-eco-green active:scale-95"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
                      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </button>
                ) : (
                  <kbd className="absolute right-4 z-10 hidden items-center gap-1 rounded-md border border-eco-green/15 bg-white/70 px-1.5 py-0.5 font-heading text-[10px] font-semibold text-eco-green/55 shadow-sm backdrop-blur-md sm:inline-flex">
                    ⌘K
                  </kbd>
                )}
              </div>
            </div>

            {/* Filter chips — iOS category strip */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {filterChips.map((chip) => {
                const active = activeChipId === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      setActiveChipId(chip.id);
                      setBasketSearch("");
                    }}
                    className={[
                      "rounded-full px-4 py-1.5 font-heading text-[12px] font-bold tracking-tight transition-all duration-200 active:scale-95",
                      active
                        ? "bg-eco-green text-eco-beige shadow-[0_10px_24px_-12px_rgba(63,93,58,0.55)]"
                        : "border border-white/60 bg-white/60 text-eco-green/70 backdrop-blur-md hover:bg-white/80 hover:text-eco-green",
                    ].join(" ")}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* Result count */}
            {basketSearch.trim() || activeChipId !== "all" ? (
              <p className="text-[11px] font-semibold tracking-tight text-eco-green/55">
                {filteredBaskets.length === 0
                  ? t("home.baskets.noMatches")
                  : filteredBaskets.length === 1
                    ? t("home.baskets.resultsOne", { count: filteredBaskets.length })
                    : t("home.baskets.resultsMany", { count: filteredBaskets.length })}
              </p>
            ) : null}
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -left-2 top-1/2 hidden -translate-y-1/2 md:block">
              <button
                type="button"
                aria-label={t("home.baskets.prev")}
                onClick={() => scrollBaskets(-1)}
                disabled={!canScrollLeft}
                className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-white/60 bg-white/70 text-eco-green shadow-[0_10px_24px_-12px_rgba(63,93,58,0.3)] backdrop-blur-md transition hover:bg-white active:scale-95 disabled:opacity-30"
              >
                <span className="text-xl leading-none">‹</span>
              </button>
            </div>
            <div className="pointer-events-none absolute -right-2 top-1/2 hidden -translate-y-1/2 md:block">
              <button
                type="button"
                aria-label={t("home.baskets.next")}
                onClick={() => scrollBaskets(1)}
                disabled={!canScrollRight}
                className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-white/60 bg-white/70 text-eco-green shadow-[0_10px_24px_-12px_rgba(63,93,58,0.3)] backdrop-blur-md transition hover:bg-white active:scale-95 disabled:opacity-30"
              >
                <span className="text-xl leading-none">›</span>
              </button>
            </div>

            <div
              ref={basketRowRef}
              className="no-scrollbar flex min-h-[12rem] snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-1"
            >
              {filteredBaskets.length === 0 ? (
                <div className="flex w-full flex-col items-center justify-center px-6 py-10 text-center">
                  <p className="font-heading text-sm font-semibold text-eco-green">
                    {t("home.baskets.noResultsTitle")}
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-eco-green/55">
                    {t("home.baskets.noResultsHint")}
                  </p>
                </div>
              ) : (
                filteredBaskets.map((c, i) => (
                  <button
                    key={`${c.id}-${basketPlayTick}`}
                    type="button"
                    onClick={() => setSelectedBasket(c)}
                    className={[
                      "group relative flex w-[18rem] flex-none snap-start flex-col overflow-hidden rounded-[26px] text-left md:w-[20rem]",
                      "border border-white/60 bg-white/85 ring-1 ring-eco-green/[0.04] backdrop-blur-xl",
                      "shadow-[0_14px_34px_-16px_rgba(63,93,58,0.28)] hover:shadow-[0_24px_44px_-18px_rgba(63,93,58,0.4)]",
                      "transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.985]",
                      basketPlayTick > 0 ? "motion-safe:animate-basket-slide-in" : "",
                    ].join(" ")}
                    style={{
                      animationDelay: basketPlayTick > 0 ? `${i * 110}ms` : undefined,
                    }}
                    aria-label={t("home.baskets.cardAriaLabel", { title: c.title, price: c.price, savings: c.savings })}
                  >
                    {/* Glass top-edge highlight */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
                    />

                    {/* Image block — inset with nested rounding */}
                    <div className="relative m-2 h-40 overflow-hidden rounded-[20px] bg-eco-beige/60 ring-1 ring-black/5">
                      <img
                        src={c.image}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.04]"
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"
                      />

                      {/* Savings pill — coral gradient */}
                      <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-gradient-to-b from-eco-coral to-[#d85048] px-2.5 py-1 font-heading text-[10px] font-bold tracking-tight text-white shadow-[0_8px_20px_-6px_rgba(242,108,99,0.7)] ring-1 ring-white/30">
                        {c.savings}
                      </span>

                      {/* Price chip — iOS-style frosted white */}
                      <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold tracking-tight text-eco-green shadow-sm backdrop-blur-md">
                        {c.price}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 flex-col gap-1.5 px-4 pb-4 pt-2">
                      <h3 className="font-heading text-[17px] font-bold leading-tight tracking-tight text-eco-green">
                        {c.title}
                      </h3>
                      <p className="line-clamp-2 whitespace-pre-line text-[12px] leading-relaxed text-eco-green/60">
                        {c.description}
                      </p>

                      <div className="mt-auto flex items-center justify-between pt-3">
                        <span className="font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-eco-coral">
                          {t("home.baskets.explore")}
                        </span>
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-eco-green text-eco-beige shadow-[0_8px_20px_-8px_rgba(63,93,58,0.6)] transition-transform duration-300 group-hover:translate-x-0.5">
                          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ── Community / Map ───────────────────────────────────────────────────── */}
        <section id="community" className="mx-auto max-w-6xl px-4 pt-2 pb-12 md:pb-16">
          <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 md:gap-10 lg:gap-12">
            <div className="order-2 flex flex-col md:order-1 md:max-w-xl md:pr-2 lg:pr-4">
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-eco-coral/10 px-3 py-1 ring-1 ring-eco-coral/15">
                <span className="h-1.5 w-1.5 rounded-full bg-eco-coral" />
                <p className="font-heading text-[10px] font-bold uppercase tracking-[0.24em] text-eco-coral">
                  {t("home.community.eyebrow")}
                </p>
              </div>

              {/* Tight, confident headline */}
              <h2 className="mt-3 font-heading text-3xl font-extrabold leading-[1.08] tracking-[-0.02em] text-eco-green md:text-[2.25rem] lg:text-[2.65rem]">
                {t("home.community.headingLine1")}
                <br />
                <span className="text-eco-green/85">{t("home.community.headingLine2")}</span>
              </h2>

              {/* Supporting description */}
              <p className="mt-5 max-w-md text-[15px] leading-[1.65] text-eco-green/65">
                {t("home.community.description")}
              </p>

              {/* Dark green pill CTA with arrow icon — iOS style */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="#baskets"
                  className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-b from-eco-green to-[#324a2d] px-5 py-3 font-heading text-[13px] font-bold tracking-tight text-eco-beige shadow-[0_14px_32px_-12px_rgba(63,93,58,0.55)] transition hover:brightness-[1.08] active:scale-[0.98]"
                >
                  {t("home.community.exploreBaskets")}
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-eco-beige/20 text-eco-beige transition-transform duration-300 group-hover:translate-x-0.5">
                    <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </a>
                <a
                  href="#about"
                  className="inline-flex items-center gap-2 text-[13px] font-bold tracking-tight text-eco-green/70 underline-offset-4 transition hover:text-eco-green hover:underline"
                >
                  {t("home.community.learnMore")}
                </a>
              </div>

              {/* Stat strip — aligned to the bottom of the rescue map */}
              <div className="relative mt-10 md:mt-auto md:pt-8">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-2 rounded-[28px] bg-gradient-to-br from-eco-softYellow/25 via-white/15 to-eco-coral/10 blur-2xl"
                />
                <div className="relative overflow-hidden rounded-[24px] border border-white/60 bg-white/60 shadow-[0_16px_36px_-18px_rgba(63,93,58,0.25)] ring-1 ring-white/30 backdrop-blur-xl">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent"
                  />
                  <div className="flex items-center justify-around px-4 py-5 md:px-6 md:py-6">
                    <div className="text-center">
                      <p className="font-heading text-xl font-extrabold tracking-tight text-eco-green tabular-nums md:text-2xl">
                        200<span className="ml-0.5 text-[11px] font-bold text-eco-green/55">kg</span>
                      </p>
                      <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-eco-green/50">
                        {t("home.community.statRescued")}
                      </p>
                    </div>
                    <span className="h-8 w-px bg-eco-green/10" aria-hidden="true" />
                    <div className="text-center">
                      <p className="font-heading text-xl font-extrabold tracking-tight text-eco-green tabular-nums md:text-2xl">
                        35+
                      </p>
                      <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-eco-green/50">
                        {t("home.community.statPartners")}
                      </p>
                    </div>
                    <span className="h-8 w-px bg-eco-green/10" aria-hidden="true" />
                    <div className="text-center">
                      <p className="font-heading text-xl font-extrabold tracking-tight text-eco-green tabular-nums md:text-2xl">
                        3
                      </p>
                      <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-eco-green/50">
                        {t("home.community.statCities")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <div className="overflow-hidden rounded-[28px] border border-white/50 bg-white/40 shadow-[0_24px_48px_-16px_rgba(63,93,58,0.22)] backdrop-blur-2xl ring-1 ring-white/20">
                {/* Card header — iOS-style minimal */}
                <div className="flex items-center justify-between px-5 pt-5 md:px-6 md:pt-6">
                  <div className="min-w-0">
                    <p className="font-heading text-[10px] font-bold uppercase tracking-[0.24em] text-eco-green/50">
                      {t("home.community.mapEyebrow")}
                    </p>
                    <h3 className="mt-1 font-heading text-[1.375rem] font-bold leading-tight tracking-tight text-eco-green">
                      {cities[activeCityIdx].name.charAt(0) + cities[activeCityIdx].name.slice(1).toLowerCase()}
                    </h3>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 ring-1 ring-emerald-500/20">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">{t("home.community.live")}</span>
                  </div>
                </div>

                {/* Map */}
                <div className="px-5 pt-4 md:px-6 md:pt-5">
                  <div className="overflow-hidden rounded-2xl ring-1 ring-black/5 shadow-inner">
                    <RescueMap cities={cities} activeIndex={activeCityIdx} />
                  </div>
                </div>

                {/* iOS segmented control */}
                <div className="px-5 pt-4 md:px-6">
                  <div
                    role="tablist"
                    className="relative flex rounded-[14px] bg-eco-green/[0.06] p-1 ring-1 ring-eco-green/10"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute top-1 bottom-1 rounded-[10px] bg-white shadow-sm ring-1 ring-black/5 transition-all duration-300 ease-out"
                      style={{
                        width: `calc((100% - 0.5rem) / ${cities.length})`,
                        left: `calc(0.25rem + ${activeCityIdx} * ((100% - 0.5rem) / ${cities.length}))`,
                      }}
                    />
                    {cities.map((c, idx) => (
                      <button
                        key={c.id}
                        type="button"
                        role="tab"
                        aria-selected={idx === activeCityIdx}
                        onClick={() => setActiveCityIdx(idx)}
                        className={[
                          "relative z-[1] flex-1 rounded-[10px] px-3 py-2 text-[11px] font-bold capitalize tracking-tight transition-colors",
                          idx === activeCityIdx ? "text-eco-green" : "text-eco-green/55 hover:text-eco-green/80",
                        ].join(" ")}
                      >
                        {c.name.charAt(0) + c.name.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Footer info */}
                <div className="flex items-center justify-between gap-3 border-t border-eco-green/10 px-5 py-4 md:px-6 md:py-5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-eco-coral/15 text-eco-coral">
                      <PinIcon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-eco-green">
                        {cities[activeCityIdx].partnerCount}
                      </p>
                      <p className="text-[11px] text-eco-green/50">{t("home.community.country")}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="shrink-0 rounded-full bg-eco-green px-3.5 py-1.5 text-[11px] font-bold text-eco-beige shadow-sm transition hover:brightness-[1.05] active:scale-[0.98]"
                  >
                    {t("home.community.explore")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── About ────────────────────────────────────────────────────────────── */}
        <section id="about" className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-eco-coral/10 px-3 py-1 ring-1 ring-eco-coral/15">
            <span className="h-1.5 w-1.5 rounded-full bg-eco-coral" />
            <p className="font-heading text-[10px] font-bold uppercase tracking-[0.24em] text-eco-coral">
              {t("home.about.eyebrow")}
            </p>
          </div>
          <h2 className="mt-2 font-heading text-2xl font-extrabold text-eco-green md:text-3xl">
            {t("home.about.heading")}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-eco-green/70 md:text-base">
            {t("home.about.description")}
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {impactStats.map((stat) => (
              <div
                key={stat.label}
                className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 px-4 py-5 text-center shadow-[0_10px_24px_-12px_rgba(63,93,58,0.18)] ring-1 ring-eco-green/[0.04] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-16px_rgba(63,93,58,0.28)]"
              >
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                <p className="font-heading text-2xl font-extrabold tracking-tight text-eco-coral tabular-nums md:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-eco-green/55 md:text-[11px]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 pb-12 md:pb-16">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-eco-coral/10 px-3 py-1 ring-1 ring-eco-coral/15">
            <span className="h-1.5 w-1.5 rounded-full bg-eco-coral" />
            <p className="font-heading text-[10px] font-bold uppercase tracking-[0.24em] text-eco-coral">
              {t("home.testimonials.eyebrow")}
            </p>
          </div>
          <h2 className="font-heading text-2xl font-extrabold text-eco-green md:text-3xl mb-8">
            {t("home.testimonials.heading")}
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {testimonials.map((tm) => (
              <div
                key={tm.id}
                className="relative overflow-hidden rounded-[24px] border border-white/60 bg-white/75 p-6 shadow-[0_14px_32px_-16px_rgba(63,93,58,0.22)] ring-1 ring-eco-green/[0.04] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_22px_40px_-18px_rgba(63,93,58,0.3)]"
              >
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

                {/* Decorative quote glyph */}
                <span aria-hidden="true" className="absolute -top-2 right-4 font-heading text-[84px] leading-none text-eco-coral/15">
                  &ldquo;
                </span>

                <div className="relative">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-b from-eco-coral to-[#d85048] text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgba(242,108,99,0.6)] ring-1 ring-white/40">
                      {tm.initial}
                    </div>
                    <div>
                      <p className="font-heading text-sm font-bold tracking-tight text-eco-green">{tm.name}</p>
                      <p className="text-[11px] text-eco-green/50">{tm.city}</p>
                    </div>
                  </div>

                  <p className="text-[13.5px] leading-[1.65] text-eco-green/75">
                    &ldquo;{tm.quote}&rdquo;
                  </p>

                  <div className="mt-4 flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-eco-softYellow" aria-hidden="true">
                        <path d="M12 2.5l2.76 6.92 7.44.54-5.65 4.87 1.76 7.27L12 18.3l-6.31 3.8 1.76-7.27L1.8 9.96l7.44-.54L12 2.5z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Stats banner ─────────────────────────────────────────────────────── */}
        <section className="bg-eco-green">
          <div className="mx-auto max-w-6xl px-4 py-5 md:py-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#32492d] via-[#2f472b] to-[#273b24] px-5 py-4 text-eco-beige shadow-[0_14px_32px_-12px_rgba(0,0,0,0.3)] ring-1 ring-white/10 md:px-6 md:py-5">
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <div className="relative flex flex-col items-center justify-between gap-4 md:flex-row md:gap-6">
                <div className="flex items-center gap-3 text-sm font-semibold">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-white/15">
                    <LeafIcon className="h-4 w-4 text-eco-softYellow" />
                  </span>
                  {t("home.statsBanner.availableInPart1")} <span className="text-eco-softYellow">20</span>{" "}
                  {t("home.statsBanner.availableInPart2")}
                </div>
                <div className="hidden h-5 w-px bg-white/20 md:block" />
                <div className="text-center text-sm font-semibold md:text-right">
                  {t("home.statsBanner.overPart1")}{" "}
                  <span className="font-heading font-extrabold tracking-tight text-eco-softYellow">200 kg</span>{" "}
                  {t("home.statsBanner.overPart2")}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Download section ─────────────────────────────────────────────────── */}
        {/* FIX: Added missing download section that CTAs were pointing to */}
        <section id="download" className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="rounded-3xl bg-eco-green px-6 py-10 text-eco-beige text-center md:px-12 md:py-14">
            <p className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-eco-softYellow mb-2">
              {t("home.download.eyebrow")}
            </p>
            <h2 className="font-heading text-2xl font-extrabold md:text-3xl">
              {t("home.download.heading")}
            </h2>
            <p className="mt-3 text-sm text-eco-beige/70 max-w-md mx-auto leading-relaxed">
              {t("home.download.description")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://apps.apple.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 rounded-2xl bg-white/10 border border-white/20 px-5 py-3 hover:bg-white/20 transition"
                aria-label={t("home.download.appStoreLabel")}
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <p className="text-[10px] text-eco-beige/60">{t("home.download.appStoreTop")}</p>
                  <p className="text-sm font-semibold">{t("home.download.appStoreName")}</p>
                </div>
              </a>
              <a
                href="https://play.google.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 rounded-2xl bg-white/10 border border-white/20 px-5 py-3 hover:bg-white/20 transition"
                aria-label={t("home.download.googlePlayLabel")}
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.18 23.73c.28.15.6.15.9.01l12.4-7.16-2.79-2.79-10.51 9.94zM.5 1.27C.19 1.57 0 2.04 0 2.66v18.68c0 .62.19 1.09.51 1.39l.07.07 10.47-10.47v-.24L.57 1.2.5 1.27zM20.34 10.46l-2.97-1.72-3.13 3.13 3.13 3.13 2.99-1.73c.85-.49.85-1.29-.02-1.81zM3.18.27L15.58 7.4l-2.79 2.79L2.29.25c.28-.14.62-.12.89.02z"/>
                </svg>
                <div className="text-left">
                  <p className="text-[10px] text-eco-beige/60">{t("home.download.googlePlayTop")}</p>
                  <p className="text-sm font-semibold">{t("home.download.googlePlayName")}</p>
                </div>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer id="contact" className="bg-eco-green text-eco-beige">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <img
                src={vertigoLogo}
                alt={t("common.appName")}
                className="h-12 w-auto select-none"
                draggable="false"
              />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-eco-beige/85">
                {t("home.footer.tagline")}
              </p>
            </div>

            <div>
              <p className="font-heading text-sm font-bold tracking-wide">{t("home.footer.contact")}</p>
              <ul className="mt-4 space-y-2 text-sm text-eco-beige/85">
                <li>
                  <span className="font-semibold text-eco-beige">{t("home.footer.email")}</span>{" "}
                  <a className="hover:text-white" href="mailto:hello@vertigo.app">
                    hello@vertigo.app
                  </a>
                </li>
                {/* FIX: Removed placeholder phone number */}
                <li>
                  <span className="font-semibold text-eco-beige">{t("home.footer.city")}</span> {t("home.footer.cityValue")}
                </li>
              </ul>
            </div>

            <div>
              <p className="font-heading text-sm font-bold tracking-wide">{t("home.footer.social")}</p>
              <div className="mt-4 flex items-center gap-3">
                <a
                  href="#"
                  className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2f472b] shadow-lg ring-1 ring-white/10 hover:bg-[#2a4127] transition"
                  aria-label={t("home.footer.instagram")}
                >
                  <InstagramIcon className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2f472b] shadow-lg ring-1 ring-white/10 hover:bg-[#2a4127] transition"
                  aria-label={t("home.footer.facebook")}
                >
                  <FacebookIcon className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2f472b] shadow-lg ring-1 ring-white/10 hover:bg-[#2a4127] transition"
                  aria-label={t("home.footer.twitter")}
                >
                  <XIcon className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 h-px w-full bg-white/15" />
          <div className="mt-6 flex flex-col gap-2 text-xs text-eco-beige/75 md:flex-row md:items-center md:justify-between">
            <p>{t("home.footer.copyright", { year: new Date().getFullYear() })}</p>
            <div className="flex gap-4">
              <a className="hover:text-white" href="#about">{t("home.footer.about")}</a>
              <a className="hover:text-white" href="#community">{t("home.footer.community")}</a>
              <a className="hover:text-white" href="#download">{t("home.footer.download")}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}