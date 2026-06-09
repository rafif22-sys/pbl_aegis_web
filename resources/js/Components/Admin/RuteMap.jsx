// resources/js/Components/Admin/RuteMap.jsx
import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";

const getRouteColor = (_idx) => "#005EA4";

async function fetchOsrmRoute(coords) {
    if (coords.length < 2) return coords;

    const tryOsrm = async (profile) => {
        const waypoints = coords.map(([la, ln]) => `${ln},${la}`).join(";");
        const url = `https://router.project-osrm.org/route/v1/${profile}/${waypoints}` +
            `?overview=full&geometries=geojson&alternatives=false&steps=false&continue_straight=false`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error(`OSRM ${profile} error ${res.status}`);
        const data = await res.json();
        if (data.code !== "Ok" || !data.routes?.[0]) throw new Error("No route");
        return data.routes[0].geometry.coordinates.map(([ln, la]) => [la, ln]);
    };

    try {
        return await tryOsrm("driving");
    } catch {
        try {
            return await tryOsrm("foot");
        } catch {
            return coords;
        }
    }
}

export const RuteMap = forwardRef(function RuteMap({ rutes, activeRuteId }, ref) {
    const mapRef = useRef(null);
    const leafletRef = useRef(null);
    const activeLayerRef = useRef(null);
    const pendingRuteRef = useRef(null);

    const drawRoute = useCallback((ruteId) => {
        const map = leafletRef.current;
        const L = window.L;
        if (!map || !L) return;

        const prev = activeLayerRef.current;
        if (prev) {
            try { prev.polyline && map.removeLayer(prev.polyline); } catch { }
            (prev.markers ?? []).forEach(m => { try { map.removeLayer(m); } catch { } });
            activeLayerRef.current = null;
        }

        if (!ruteId) return;

        const ruteList = rutes ?? [];
        const ruteIndex = ruteList.findIndex(r => String(r.id) === String(ruteId));
        if (ruteIndex === -1) return;

        const rute = ruteList[ruteIndex];
        const color = getRouteColor(ruteIndex);

        const cps = (rute.checkpoint ?? [])
            .slice()
            .sort((a, b) => (a.pivot?.urutan ?? 0) - (b.pivot?.urutan ?? 0));

        const coords = cps
            .map(cp => {
                const lat = parseFloat(cp.latitude);
                const lng = parseFloat(cp.longitude);
                return (!isNaN(lat) && !isNaN(lng)) ? [lat, lng] : null;
            })
            .filter(Boolean);

        if (coords.length === 0) return;

        const validCoords = coords.filter(([la, ln]) =>
            la >= -11 && la <= 6 && ln >= 95 && ln <= 141
        );
        if (validCoords.length === 0) {
            console.warn("[RuteMap] Koordinat di luar range Indonesia:", coords);
            return;
        }

        const makeMarkers = (cpList) => cpList.map((cp, cpIdx) => {
            const lat = parseFloat(cp.latitude);
            const lng = parseFloat(cp.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;

            const num = cpIdx + 1;
            const icon = L.divIcon({
                html: `<svg width="34" height="48" viewBox="0 0 34 48" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <filter id="ds${ruteId}_${cpIdx}" x="-40%" y="-20%" width="180%" height="160%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2.5"
                          flood-color="${color}" flood-opacity="0.4"/>
                      </filter>
                    </defs>
                    <path d="M17 0C7.61 0 0 7.61 0 17c0 11.86 17 31 17 31s17-19.14 17-31C34 7.61 26.39 0 17 0z"
                      fill="${color}" filter="url(#ds${ruteId}_${cpIdx})"/>
                    <circle cx="17" cy="17" r="9" fill="white"/>
                    <text x="17" y="17" text-anchor="middle" dominant-baseline="central"
                      font-size="${num >= 10 ? 8 : 10}" font-weight="900"
                      font-family="Arial, sans-serif" fill="${color}">${num}</text>
                  </svg>`,
                iconSize: [34, 48],
                iconAnchor: [17, 48],
                className: "",
            });

            return L.marker([lat, lng], { icon })
                .addTo(map)
                .bindPopup(`
                    <div style="font-family:sans-serif;min-width:160px;padding:2px 0">
                        <p style="font-size:10px;color:${color};font-weight:700;margin:0 0 3px">
                            ${rute.nama_rute}
                        </p>
                        <p style="font-weight:700;color:#0F2A44;margin:0 0 2px;font-size:13px">${cp.nama}</p>
                        <p style="font-size:11px;color:#64748b;margin:0">
                            Checkpoint ke-<strong>${num}</strong> dari ${cps.length}
                        </p>
                    </div>
                `);
        }).filter(Boolean);

        const straightLine = L.polyline(validCoords, {
            color, weight: 3.5, opacity: 0.4, dashArray: "10 8",
        }).addTo(map);

        try {
            const bounds = L.latLngBounds(validCoords);
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
            }
        } catch { }

        const markers = makeMarkers(cps);
        activeLayerRef.current = { polyline: straightLine, markers, ruteId };

        let cancelled = false;
        fetchOsrmRoute(validCoords).then(roadCoords => {
            if (cancelled) return;
            if (!activeLayerRef.current || activeLayerRef.current.ruteId !== ruteId) return;

            try { map.removeLayer(straightLine); } catch { }

            const roadLine = L.polyline(roadCoords, {
                color, weight: 5, opacity: 0.92,
                lineJoin: "round", lineCap: "round",
            }).addTo(map);

            markers.forEach(m => { try { m.bringToFront && m.bringToFront(); } catch { } });

            try {
                const bounds = L.latLngBounds(validCoords);
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
                }
            } catch { }

            activeLayerRef.current = { polyline: roadLine, markers, ruteId };
        }).catch(() => {});

        return () => { cancelled = true; };
    }, [rutes]);

    useImperativeHandle(ref, () => ({
        focusRute(ruteId) { // updated to accept ruteId, although it mainly uses active markers
            if (!leafletRef.current || !activeLayerRef.current) return;
            try {
                const bounds = window.L.latLngBounds(
                    activeLayerRef.current.markers.map(m => m.getLatLng())
                );
                if (bounds.isValid())
                    leafletRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
            } catch { }
        },
    }));

    useEffect(() => {
        if (!document.getElementById("leaflet-css")) {
            const link = Object.assign(document.createElement("link"), {
                id: "leaflet-css", rel: "stylesheet",
                href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
            });
            document.head.appendChild(link);
        }

        const init = () => {
            if (!mapRef.current || leafletRef.current) return;
            const L = window.L;
            const map = L.map(mapRef.current, {
                center: [-7.0051, 110.4381],
                zoom: 14,
                scrollWheelZoom: true,
                locate: false,
            });
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap", maxZoom: 19,
            }).addTo(map);

            leafletRef.current = map;

            if (pendingRuteRef.current !== null) {
                drawRoute(pendingRuteRef.current);
                pendingRuteRef.current = null;
            }
        };

        if (window.L) {
            init();
        } else {
            const s = document.createElement("script");
            s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            s.onload = init;
            document.head.appendChild(s);
        }

        return () => {
            if (leafletRef.current) {
                leafletRef.current.remove();
                leafletRef.current = null;
                activeLayerRef.current = null;
            }
        };
    }, []); // eslint-disable-line

    useEffect(() => {
        if (!leafletRef.current) {
            pendingRuteRef.current = activeRuteId ?? null;
            return;
        }
        drawRoute(activeRuteId ?? null);
    }, [activeRuteId, drawRoute]);

    return (
        <div style={{ position: "relative", height: "100%", minHeight: 220 }}>
            <div ref={mapRef} style={{ height: "100%", borderRadius: 0, zIndex: 0 }} />
            {!activeRuteId && (
                <div style={{
                    position: "absolute", inset: 0, zIndex: 5,
                    display: "flex", alignItems: "flex-end", justifyContent: "center",
                    pointerEvents: "none", paddingBottom: 16,
                }}>
                    <div style={{
                        background: "rgba(15,42,68,0.78)", color: "white",
                        borderRadius: 12, padding: "8px 18px",
                        fontSize: 12, fontWeight: 600, letterSpacing: ".3px",
                        backdropFilter: "blur(4px)",
                    }}>
                        Klik card rute untuk melihat jalur di peta
                    </div>
                </div>
            )}
        </div>
    );
});
