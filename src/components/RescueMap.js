import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { useT } from "../i18n";

// Green restaurant pin
const restaurantPin = L.divIcon({
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
  html: `
    <div style="
      width:22px;height:22px;border-radius:9999px;
      background:#fff;
      display:grid;place-items:center;
      box-shadow:0 0 0 2px #3F5D3A, 0 4px 10px -2px rgba(63,93,58,0.5);">
      <div style="width:10px;height:10px;border-radius:9999px;background:#3F5D3A;"></div>
    </div>
  `,
});

function FlyToActive({ city }) {
  const map = useMap();
  useEffect(() => {
    if (!city) return;
    map.flyTo([city.lat, city.lng], city.zoom ?? 13, { duration: 1.1 });
  }, [city, map]);
  return null;
}

export function RescueMap({ cities, activeIndex, onSelect }) {
  const t = useT();
  const active = cities[activeIndex];
  const activeRestaurants = active?.restaurants ?? [];

  return (
    <div className="relative aspect-[5/4] overflow-hidden rounded-lg md:aspect-[16/10]">
      <MapContainer
        center={[active.lat, active.lng]}
        zoom={active.zoom ?? 13}
        scrollWheelZoom={false}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
        />

        {/* Small restaurant pins — only for the active city. Clicking opens Google Maps. */}
        {activeRestaurants.map((r, i) => {
          const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}(${encodeURIComponent(r.name)})`;
          return (
            <Marker
              key={`${active.name}-${i}`}
              position={[r.lat, r.lng]}
              icon={restaurantPin}
              eventHandlers={{
                click: () => {
                  // If a handler is provided (e.g. open the deal page), use it;
                  // otherwise fall back to opening Google Maps.
                  if (onSelect) onSelect(r);
                  else window.open(gmapsUrl, "_blank", "noopener,noreferrer");
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
                  <div style={{ fontWeight: 700, color: "#3F5D3A", fontSize: 12 }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(63,93,58,0.6)" }}>
                    {onSelect
                      ? (r.cuisine ? `${r.cuisine} · ${t("rescueMap.openDealHint")}` : t("rescueMap.openDealHint"))
                      : (r.cuisine ? t("rescueMap.cuisineClickHint", { cuisine: r.cuisine }) : t("rescueMap.clickHint"))}
                  </div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        <FlyToActive city={active} />
      </MapContainer>
    </div>
  );
}
