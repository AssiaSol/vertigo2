import { useEffect, useMemo, useRef, useState } from "react";
import { getHomeInit } from "./api/home";
import { Link } from "react-router-dom";
import heroBag from "./assets/hero-bag.png";
import vertigoLogo from "./assets/vertigo-logo.png";
import mapMostaganem from "./assets/map-mostaganem.png";
import mapOran from "./assets/map-oran.png";
import mapSidiBelAbbes from "./assets/map-sidi-bel-abbes.png";
import communityIllustration from "./assets/community-illustration.png";

const categories = [
  {
    title: "Bakery Basket",
    description: "Fresh bread, pastries,\nand baked goods from\nlocal bakeries.",
    price: "From 350 DA",
    savings: "Save 60%",
    image:
      "https://images.unsplash.com/photo-1568254183919-78a4f43a2877?q=80&w=1469&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Food Basket",
    description: "Chef picks,\nready-to-eat meals,\nand daily specials.",
    price: "From 500 DA",
    savings: "Save 50%",
    image:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=70",
  },
  {
    title: "Grocery Basket",
    description: "A mix of fruits,\nvegetables, and\neveryday essentials.",
    price: "From 400 DA",
    savings: "Save 55%",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=70",
  },
  {
    title: "Dessert Basket",
    description: "Sweet treats,\nand seasonal surprises.",
    price: "From 250 DA",
    savings: "Save 65%",
    image:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=70",
  },
];

// ── Keys must exactly match the `title` field in categories above ──────────
const restaurantsByBasket = {
  "Bakery Basket": [
    { name: "Le Petit Four", rating: 4.8, distance: "0.3 km", tag: "Closes 9 PM" },
    { name: "Sunrise Bread Co.", rating: 4.5, distance: "0.7 km", tag: "2 baskets left" },
    { name: "Golden Crust", rating: 4.2, distance: "1.1 km", tag: "Closes 8 PM" },
  ],
  "Food Basket": [
    { name: "Casa Delicia", rating: 4.7, distance: "0.4 km", tag: "3 baskets left" },
    { name: "Chef's Table", rating: 4.5, distance: "0.6 km", tag: "Closes 10 PM" },
    { name: "Daily Bites", rating: 4.3, distance: "1.0 km", tag: "1 basket left" },
  ],
  "Grocery Basket": [
    { name: "FreshMart", rating: 4.6, distance: "0.5 km", tag: "3 baskets left" },
    { name: "Green Corner", rating: 4.3, distance: "0.9 km", tag: "Closes 10 PM" },
  ],
  "Dessert Basket": [
    { name: "Sweet Rescue", rating: 4.9, distance: "0.4 km", tag: "1 basket left" },
    { name: "Choco Heaven", rating: 4.7, distance: "0.8 km", tag: "Closes 9 PM" },
  ],
};

// ── Testimonials data ──────────────────────────────────────────────────────
const testimonials = [
  {
    name: "Amina B.",
    city: "Oran",
    quote: "I save almost 1 500 DA a week on groceries. The bakery baskets are always fresh and the app is super easy to use.",
    initial: "A",
  },
  {
    name: "Karim L.",
    city: "Mostaganem",
    quote: "As a restaurant owner, Vertigo helped me cut waste by 40 % and reach new customers I never would have found otherwise.",
    initial: "K",
  },
  {
    name: "Sara M.",
    city: "Sidi Bel Abbès",
    quote: "Love that I'm helping the planet and my wallet at the same time. The dessert baskets are an absolute treat!",
    initial: "S",
  },
];

// ── Impact stats fallback (shown while loading or on error) ─────────────────
const FALLBACK_STATS = [
  { value: "—", label: "Food rescued" },
  { value: "120 kg", label: "CO₂ avoided" },
  { value: "—", label: "Partner stores" },
  { value: "—", label: "Départements" },
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

  // ── Mobile nav state ───────────────────────────────────────────────────────
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // ── Scrolled state for header ──────────────────────────────────────────────
  const [scrolled, setScrolled] = useState(false);

  // ── Active nav section ─────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState("home");

  // ── Dynamic impact stats from /home/init ──────────────────────────────────
  const [impactStats, setImpactStats] = useState(FALLBACK_STATS);

  useEffect(() => {
    getHomeInit()
      .then(({ stats }) => {
        setImpactStats([
          { value: stats.foodRescued, label: "Food rescued" },
          { value: "120 kg", label: "CO₂ avoided" },
          { value: String(stats.partnerCount), label: "Partner stores" },
          { value: String(stats.villesCount), label: "Départements" },
        ]);
      })
      .catch(() => {});
  }, []);

  const filteredBaskets = useMemo(() => {
    const q = basketSearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => {
      const haystack = `${c.title} ${c.description}`.toLowerCase().replace(/\n/g, " ");
      return haystack.includes(q);
    });
  }, [basketSearch]);

  const cities = [
    {
      name: "MOSTAGANEM",
      image: mapMostaganem,
      pins: [
        { x: 38, y: 44 },
        { x: 54, y: 40 },
        { x: 48, y: 56 },
        { x: 62, y: 48 },
      ],
    },
    {
      name: "ORAN",
      image: mapOran,
      pins: [
        { x: 34, y: 46 },
        { x: 50, y: 38 },
        { x: 44, y: 58 },
        { x: 58, y: 50 },
      ],
    },
    {
      name: "SIDI BEL ABBES",
      image: mapSidiBelAbbes,
      pins: [
        { x: 40, y: 46 },
        { x: 56, y: 42 },
        { x: 50, y: 58 },
        { x: 64, y: 48 },
      ],
    },
  ];

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

  const scrollCities = (dir) => {
    const el = cityRowRef.current;
    if (!el) return;
    const amount = el.clientWidth || 0;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  const navLinks = [
    { href: "#home", label: "Home", id: "home" },
    { href: "#community", label: "Community", id: "community" },
    { href: "#about", label: "About", id: "about" },
    { href: "#contact", label: "Contact", id: "contact" },
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
              <img src={vertigoLogo} alt="Vertigo" className="h-10 w-auto select-none" draggable="false" />
              <button
                onClick={() => setMobileNavOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 hover:bg-white/20 transition"
                aria-label="Close menu"
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
                Log in
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileNavOpen(false)}
                className="text-center rounded-xl bg-eco-coral py-2.5 text-sm font-semibold text-white hover:brightness-95 transition"
              >
                Sign up
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
          aria-label={`${selectedBasket.title} restaurants`}
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
                  Restaurants near you offering this basket
                </p>
              </div>
              <button
                onClick={() => setSelectedBasket(null)}
                className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-black/40 text-sm text-white transition hover:bg-black/60"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Restaurant list */}
            <ul className="max-h-72 divide-y divide-eco-green/10 overflow-y-auto">
              {(restaurantsByBasket[selectedBasket.title] ?? []).length === 0 ? (
                <li className="flex flex-col items-center px-5 py-8 text-center">
                  <span className="text-3xl mb-2">🛒</span>
                  <p className="font-heading text-sm font-semibold text-eco-green">No restaurants right now</p>
                  <p className="mt-1 text-xs text-eco-green/55">Check back soon — new baskets drop daily!</p>
                </li>
              ) : (
                (restaurantsByBasket[selectedBasket.title] ?? []).map((r, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between px-5 py-3.5 transition hover:bg-eco-green/5"
                  >
                    <div>
                      <p className="font-heading text-sm font-semibold text-eco-green">
                        {r.name}
                      </p>
                      <p className="mt-0.5 text-xs text-eco-green/55">
                        {r.distance} · {r.tag}
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
                        Reserve
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
                Close
              </button>
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
                alt="Vertigo"
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
              Log in
            </Link>
            <div className="hidden sm:block h-5 w-px bg-[#d6d1c4]" />
            <Link
              to="/signup"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-[#d6d1c4] bg-[#e8e1d3] px-4 py-2 text-xs font-semibold text-[#2f2d27] transition hover:bg-[#ddd5c5] sm:text-sm"
            >
              Sign up
              <ArrowIcon className="h-4 w-4" />
            </Link>
            {/* Mobile hamburger — only on small screens */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 hover:bg-white/20 transition md:hidden"
              aria-label="Open menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main id="home" className="relative pt-24 md:pt-28">
        <div className="mx-auto max-w-6xl px-4 pt-5 pb-1 md:pt-6 md:pb-2">
          <p className="mx-auto max-w-2xl text-center font-heading text-lg font-semibold italic leading-relaxed tracking-wide text-eco-coral sm:text-xl md:text-2xl">
            Save food. Save money. Save the planet.
          </p>
        </div>

        {/* ── Hero ─────────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-eco-softYellow/40 via-transparent to-transparent" />
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 py-10 md:grid-cols-2 md:gap-12 md:py-14 lg:py-16">
            <div>
              {/* FIX: Simplified headline with single accent color */}
              <h1 className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
                Rescue unsold food from{" "}
                <span className="text-eco-coral">local restaurants</span>{" "}
                at amazing prices.
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-eco-green/65 md:text-base max-w-md">
                Join thousands of Algerians cutting food waste and saving money — one basket at a time.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                {/* FIX: Corrected button text */}
                <a
                  href="#about"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-eco-coral px-6 py-3 text-sm font-semibold text-white shadow-lg ring-1 ring-black/5 hover:brightness-95"
                >
                  About us
                  <span className="grid h-7 w-7 place-items-center rounded-2xl bg-white/20">
                    <ArrowIcon className="h-4 w-4 text-white" />
                  </span>
                </a>
                {/* FIX: Points to real download section */}
                <a
                  href="#download"
                  className="group inline-flex items-center gap-2 rounded-2xl border border-eco-coral/40 bg-transparent px-6 py-3 text-sm font-semibold text-eco-green shadow-lg hover:bg-white/20"
                >
                  Download the app
                  <span className="grid h-7 w-7 place-items-center rounded-2xl border border-eco-coral/30 bg-white/30">
                    <ArrowIcon className="h-4 w-4 text-eco-green" />
                  </span>
                </a>
              </div>
            </div>

            <div ref={heroBagZoneRef} className="relative mx-auto w-full max-w-md md:max-w-lg">
              <div className="absolute -inset-6 rounded-[2.75rem] bg-white/20 blur-xl" />
              <img
                key={bagPlayTick}
                src={heroBag}
                alt="Grocery bag with fresh food"
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
          <div className="mb-6 md:mb-8">
            <p
              id="baskets-heading"
              className="font-heading text-xl font-extrabold leading-[1.65] tracking-tight md:text-4xl"
            >
              We offer a wide variety of food categories, all elegantly arranged in baskets.
            </p>
            {/* FIX: Removed dangling slash from Tailwind class */}
            <p className="mt-2 text-sm text-eco-green/70">
              Click a basket to see restaurants near you. Slide to explore more.
            </p>
          </div>

          <div className="mb-6 md:mb-8">
            <label htmlFor="basket-search" className="sr-only">
              Search baskets by name or type
            </label>
            <div className="relative flex items-center">
              {/* FIX: Using the existing SearchIcon SVG component instead of unicode glyph */}
              <SearchIcon className="absolute left-4 z-10 h-4 w-4 text-eco-green/50" />
              <input
                id="basket-search"
                type="search"
                autoComplete="off"
                placeholder="Search baskets (e.g. bakery, grocery, dessert…)"
                value={basketSearch}
                onChange={(e) => setBasketSearch(e.target.value)}
                className="w-full max-w-xl rounded-2xl border border-eco-green/15 bg-white/20 py-3.5 pl-12 pr-4 text-sm text-eco-green shadow-lg backdrop-blur-md placeholder:text-eco-green/40 focus:border-eco-coral/40 focus:outline-none focus:ring-2 focus:ring-eco-coral/25"
              />
            </div>
            {basketSearch.trim() ? (
              <p className="mt-2 text-center text-xs text-eco-green/55">
                {filteredBaskets.length === 0
                  ? "No matches"
                  : `${filteredBaskets.length} ${
                      filteredBaskets.length === 1 ? "basket" : "baskets"
                    } found`}
              </p>
            ) : null}
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -left-2 top-1/2 hidden -translate-y-1/2 md:block">
              <button
                type="button"
                aria-label="Previous"
                onClick={() => scrollBaskets(-1)}
                disabled={!canScrollLeft}
                className="pointer-events-auto grid h-10 w-10 place-items-center rounded-2xl border border-white/40 bg-white/30 shadow-lg backdrop-blur-md ring-1 ring-eco-green/10 transition active:scale-95 disabled:opacity-30"
              >
                <span className="text-xl leading-none">‹</span>
              </button>
            </div>
            <div className="pointer-events-none absolute -right-2 top-1/2 hidden -translate-y-1/2 md:block">
              <button
                type="button"
                aria-label="Next"
                onClick={() => scrollBaskets(1)}
                disabled={!canScrollRight}
                className="pointer-events-auto grid h-10 w-10 place-items-center rounded-2xl border border-white/40 bg-white/30 shadow-lg backdrop-blur-md ring-1 ring-eco-green/10 transition active:scale-95 disabled:opacity-30"
              >
                <span className="text-xl leading-none">›</span>
              </button>
            </div>

            <div
              ref={basketRowRef}
              className="no-scrollbar flex min-h-[12rem] snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-1"
            >
              {filteredBaskets.length === 0 ? (
                <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-eco-green/15 bg-white/30 px-6 py-10 text-center backdrop-blur-sm">
                  <p className="font-heading text-sm font-semibold text-eco-green">
                    No baskets match your search
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-eco-green/55">
                    Try &quot;bakery&quot;, &quot;grocery&quot;, or clear the field to see all baskets.
                  </p>
                </div>
              ) : (
                filteredBaskets.map((c, i) => (
                  // FIX: Changed div → button for keyboard accessibility
                  <button
                    key={`${c.title}-${basketPlayTick}`}
                    type="button"
                    onClick={() => setSelectedBasket(c)}
                    className={[
                      "relative w-[18rem] flex-none snap-start overflow-hidden rounded-2xl shadow-lg md:w-[20rem]",
                      "cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] text-left",
                      basketPlayTick > 0 ? "motion-safe:animate-basket-slide-in" : "",
                    ].join(" ")}
                    style={{
                      animationDelay: basketPlayTick > 0 ? `${i * 110}ms` : undefined,
                    }}
                    aria-label={`${c.title} — ${c.price}, ${c.savings}`}
                  >
                    {/* FIX: Removed blur-sm — images now sharp */}
                    <img
                      src={c.image}
                      alt=""
                      className="h-44 w-full object-cover md:h-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                    <div className="absolute inset-0 p-5">
                      <p className="font-heading text-xl font-bold text-white">{c.title}</p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/80">
                        {c.description}
                      </p>
                      {/* FIX: Price & savings badge */}
                      <div className="absolute bottom-4 left-5 flex items-center gap-2">
                        <span className="rounded-lg bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
                          {c.price}
                        </span>
                        <span className="rounded-lg bg-eco-coral/90 px-2 py-0.5 text-[11px] font-bold text-white">
                          {c.savings}
                        </span>
                      </div>
                      <p className="absolute bottom-4 right-4 text-[11px] font-semibold text-white/70">
                        Tap to explore ↗
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ── Community / Map ───────────────────────────────────────────────────── */}
        <section id="community" className="mx-auto max-w-6xl px-4 pt-2 pb-12 md:pb-16">
          <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-10 lg:gap-12">
            <div className="order-2 flex flex-col justify-start md:order-1 md:max-w-xl md:pr-2 lg:pr-4">
              <p className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-eco-coral">
                Your city
              </p>
              <h2 className="mt-2 font-heading text-2xl font-extrabold leading-[1.2] tracking-tight text-eco-green md:text-[1.65rem] lg:text-3xl">
                Discover where you can rescue delicious food in your city.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-eco-green/70 md:text-base">
                Join the mission to cut food waste — explore neighborhoods for restaurants and bakeries
                listing surplus meals at fair prices.
              </p>
              <div className="mt-8 flex w-full justify-center md:mt-10 md:justify-start">
                <img
                  src={communityIllustration}
                  alt="Earth and friend — together for less waste"
                  className="h-48 w-48 max-w-[min(22rem,88vw)] select-none object-contain md:h-64 md:w-64 lg:h-72 lg:w-72"
                  style={{ backgroundColor: "transparent" }}
                  draggable={false}
                />
              </div>
            </div>

            <div className="order-1 md:order-2">
              <div className="rounded-2xl border border-white/40 bg-white/35 p-5 shadow-lg shadow-eco-green/10 backdrop-blur-xl md:p-6">
                <div className="border-b border-eco-green/15 pb-3 md:pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-heading text-lg font-bold leading-tight text-eco-green md:text-xl">
                      Rescue map
                    </h3>
                    <div
                      className="shrink-0 rounded-full border border-white/35 bg-white/25 px-3 py-1.5 text-center text-xs font-semibold tabular-nums text-eco-green backdrop-blur-md"
                      aria-live="polite"
                    >
                      {activeCityIdx + 1} / {cities.length}
                    </div>
                  </div>
                  <p className="mt-2 font-heading text-[10px] font-bold uppercase tracking-[0.16em] text-eco-coral">
                    Community · live cities
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-eco-green/65">
                    Each map shows several rescue points. Swipe the carousel or use the arrows to
                    change city.
                  </p>
                </div>

                <div className="relative mt-4 md:mt-5">
                  <div className="rounded-xl border border-white/30 bg-gradient-to-b from-white/30 to-eco-softYellow/20 p-1 backdrop-blur-md ring-1 ring-eco-green/10">
                    <div className="relative aspect-[5/4] overflow-hidden rounded-lg md:aspect-[16/10]">
                      <div
                        ref={cityRowRef}
                        className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
                      >
                        {cities.map((city, idx) => (
                          <div key={city.name} className="relative h-full w-full flex-none snap-start">
                            <img
                              src={city.image}
                              alt={`Street map of ${city.name}`}
                              className="h-full w-full object-cover object-center"
                              loading="lazy"
                            />
                            <div
                              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.12] via-transparent to-black/[0.06]"
                              aria-hidden="true"
                            />
                            {activeCityIdx === idx
                              ? city.pins.map((pin, pi) => (
                                  <div
                                    key={`${city.name}-pin-${pi}-${activeCityIdx}`}
                                    className="absolute z-[1] motion-safe:animate-pin-drop cursor-pointer"
                                    style={{
                                      left: `${pin.x}%`,
                                      top: `${pin.y}%`,
                                      transform: "translate(-50%, -100%)",
                                      animationDelay: `${pi * 100}ms`,
                                    }}
                                    title={`Rescue spot in ${city.name}`}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Rescue spot ${pi + 1} in ${city.name}`}
                                  >
                                    <div className="flex flex-col items-center drop-shadow-lg">
                                      <div className="grid h-8 w-8 place-items-center rounded-full bg-eco-coral ring-[3px] ring-eco-beige/80 transition hover:scale-110 md:h-9 md:w-9">
                                        <PinIcon className="h-4 w-4 text-white md:h-[18px] md:w-[18px]" />
                                      </div>
                                      <span className="-mt-0.5 h-1.5 w-1.5 rounded-full bg-eco-coral/45 blur-[1px]" />
                                    </div>
                                  </div>
                                ))
                              : null}
                          </div>
                        ))}
                      </div>

                      <div
                        className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10"
                        aria-hidden="true"
                      />

                      <div className="pointer-events-none absolute inset-y-0 left-2 z-10 flex items-center md:left-3">
                        <button
                          type="button"
                          aria-label="Previous city"
                          onClick={() => scrollCities(-1)}
                          className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full border border-white/50 bg-white/45 text-eco-green shadow-md backdrop-blur-md transition hover:bg-white/60 active:scale-[0.97] md:h-10 md:w-10"
                        >
                          <span className="text-lg font-light leading-none">‹</span>
                        </button>
                      </div>
                      <div className="pointer-events-none absolute inset-y-0 right-2 z-10 flex items-center md:right-3">
                        <button
                          type="button"
                          aria-label="Next city"
                          onClick={() => scrollCities(1)}
                          className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full border border-white/50 bg-white/45 text-eco-green shadow-md backdrop-blur-md transition hover:bg-white/60 active:scale-[0.97] md:h-10 md:w-10"
                        >
                          <span className="text-lg font-light leading-none">›</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:mt-5">
                  <div className="min-w-0">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-eco-green/10 text-eco-coral">
                        <PinIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-heading text-base font-bold tracking-tight text-eco-green md:text-lg">
                          {cities[activeCityIdx].name}
                        </p>
                        <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-eco-green/50">
                          Algeria
                        </p>
                        <p className="mt-1.5 text-xs leading-snug text-eco-green/60">
                          {cities[activeCityIdx].pins.length} rescue spots on this map
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 rounded-full border border-white/35 bg-white/25 px-2 py-2 backdrop-blur-md sm:justify-end">
                    {cities.map((c, i) => (
                      <button
                        key={c.name}
                        type="button"
                        aria-label={`Show ${c.name}`}
                        aria-current={i === activeCityIdx ? "true" : undefined}
                        onClick={() => {
                          const el = cityRowRef.current;
                          if (!el) return;
                          el.scrollTo({ left: i * (el.clientWidth || 0), behavior: "smooth" });
                        }}
                        className={[
                          "h-2 rounded-full transition-all duration-300",
                          i === activeCityIdx
                            ? "w-8 bg-eco-coral"
                            : "w-2 bg-eco-green/20 hover:bg-eco-green/35",
                        ].join(" ")}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── About ────────────────────────────────────────────────────────────── */}
        <section id="about" className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-eco-coral">
            Our mission
          </p>
          <h2 className="mt-2 font-heading text-2xl font-extrabold text-eco-green md:text-3xl">
            About Vertigo
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-eco-green/70 md:text-base">
            Vertigo connects conscious consumers with local restaurants and stores to rescue surplus
            food — reducing waste, one basket at a time. We believe that good food should never go to
            waste, and that saving the planet can also save you money.
          </p>

          {/* FIX: Impact stat cards */}
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {impactStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-eco-green/10 bg-white/40 px-4 py-5 text-center backdrop-blur-sm shadow-sm"
              >
                <p className="font-heading text-2xl font-extrabold text-eco-coral md:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-medium text-eco-green/60 md:text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 pb-12 md:pb-16">
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-eco-coral mb-2">
            What people say
          </p>
          <h2 className="font-heading text-2xl font-extrabold text-eco-green md:text-3xl mb-8">
            Loved by our community
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-eco-green/10 bg-white/40 p-5 backdrop-blur-sm shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-eco-coral text-sm font-bold text-white">
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-eco-green">{t.name}</p>
                    <p className="text-xs text-eco-green/50">{t.city}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-eco-green/70">"{t.quote}"</p>
                <div className="mt-3 flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-eco-coral text-xs">★</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Stats banner ─────────────────────────────────────────────────────── */}
        <section className="bg-eco-green">
          <div className="mx-auto max-w-6xl px-4 py-5 md:py-6">
            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-[#2f472b] px-5 py-4 text-eco-beige shadow-lg md:flex-row md:gap-6 md:px-6 md:py-5">
              <div className="flex items-center gap-3 text-sm font-semibold">
                <LeafIcon className="h-5 w-5 text-eco-softYellow" />
                Available in <span className="text-eco-softYellow">20</span>{" "}
                départements and just getting started!
              </div>
              <div className="hidden h-5 w-px bg-white/20 md:block" />
              <div className="text-center text-sm font-semibold md:text-right">
                over{" "}
                <span className="font-extrabold text-eco-softYellow">200 kg</span>{" "}
                of perfectly good food given a second chance.
              </div>
            </div>
          </div>
        </section>

        {/* ── Download section ─────────────────────────────────────────────────── */}
        {/* FIX: Added missing download section that CTAs were pointing to */}
        <section id="download" className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="rounded-3xl bg-eco-green px-6 py-10 text-eco-beige text-center md:px-12 md:py-14">
            <p className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-eco-softYellow mb-2">
              Available now
            </p>
            <h2 className="font-heading text-2xl font-extrabold md:text-3xl">
              Get the Vertigo app
            </h2>
            <p className="mt-3 text-sm text-eco-beige/70 max-w-md mx-auto leading-relaxed">
              Browse baskets, reserve your food, and pick it up — all from your phone. Free to download.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#"
                className="inline-flex items-center gap-3 rounded-2xl bg-white/10 border border-white/20 px-5 py-3 hover:bg-white/20 transition"
                aria-label="Download on the App Store"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <p className="text-[10px] text-eco-beige/60">Download on the</p>
                  <p className="text-sm font-semibold">App Store</p>
                </div>
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-3 rounded-2xl bg-white/10 border border-white/20 px-5 py-3 hover:bg-white/20 transition"
                aria-label="Get it on Google Play"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.18 23.73c.28.15.6.15.9.01l12.4-7.16-2.79-2.79-10.51 9.94zM.5 1.27C.19 1.57 0 2.04 0 2.66v18.68c0 .62.19 1.09.51 1.39l.07.07 10.47-10.47v-.24L.57 1.2.5 1.27zM20.34 10.46l-2.97-1.72-3.13 3.13 3.13 3.13 2.99-1.73c.85-.49.85-1.29-.02-1.81zM3.18.27L15.58 7.4l-2.79 2.79L2.29.25c.28-.14.62-.12.89.02z"/>
                </svg>
                <div className="text-left">
                  <p className="text-[10px] text-eco-beige/60">Get it on</p>
                  <p className="text-sm font-semibold">Google Play</p>
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
                alt="Vertigo"
                className="h-12 w-auto select-none"
                draggable="false"
              />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-eco-beige/85">
                Rescue unsold food from local restaurants and stores — for less, with impact.
              </p>
            </div>

            <div>
              <p className="font-heading text-sm font-bold tracking-wide">Contact</p>
              <ul className="mt-4 space-y-2 text-sm text-eco-beige/85">
                <li>
                  <span className="font-semibold text-eco-beige">Email:</span>{" "}
                  <a className="hover:text-white" href="mailto:hello@vertigo.app">
                    hello@vertigo.app
                  </a>
                </li>
                {/* FIX: Removed placeholder phone number */}
                <li>
                  <span className="font-semibold text-eco-beige">City:</span> Sidi Bel Abbès, Algeria
                </li>
              </ul>
            </div>

            <div>
              <p className="font-heading text-sm font-bold tracking-wide">Social</p>
              <div className="mt-4 flex items-center gap-3">
                <a
                  href="#"
                  className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2f472b] shadow-lg ring-1 ring-white/10 hover:bg-[#2a4127] transition"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2f472b] shadow-lg ring-1 ring-white/10 hover:bg-[#2a4127] transition"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2f472b] shadow-lg ring-1 ring-white/10 hover:bg-[#2a4127] transition"
                  aria-label="X (Twitter)"
                >
                  <XIcon className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 h-px w-full bg-white/15" />
          <div className="mt-6 flex flex-col gap-2 text-xs text-eco-beige/75 md:flex-row md:items-center md:justify-between">
            <p>© {new Date().getFullYear()} Vertigo. All rights reserved.</p>
            <div className="flex gap-4">
              <a className="hover:text-white" href="#about">About</a>
              <a className="hover:text-white" href="#community">Community</a>
              <a className="hover:text-white" href="#download">Download</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}