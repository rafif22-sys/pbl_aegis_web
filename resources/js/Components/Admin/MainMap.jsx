// resources/js/Components/Admin/MainMap.jsx


import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";

function ensureLeaflet(onReady) {
    if (!document.getElementById("leaflet-css")) {
        const link  = document.createElement("link");
        link.id     = "leaflet-css";
        link.rel    = "stylesheet";
        link.href   = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
    }
    if (window.L) { onReady(); return; }
    const script  = document.createElement("script");
    script.src    = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = onReady;
    document.head.appendChild(script);
}

/**
 * MainMap — peta baca-saja yang merender semua checkpoint sebagai marker bernomor.
 *
 * Props:
 *   checkpoints  — array checkpoint { id, nama, latitude, longitude }
 *
 * Ref API:
 *   mapRef.current.flyTo(lat, lng, cpId)
 *     → animasi terbang ke koordinat dan membuka popup marker
 */
export const MainMap = forwardRef(function MainMap({ checkpoints }, ref) {
    const mapDivRef  = useRef(null);
    const leafletRef = useRef(null);
    const markersRef = useRef({});   // { [cp.id]: L.Marker }

    // Ekspos flyTo ke parent
    useImperativeHandle(ref, () => ({
        flyTo(lat, lng, cpId) {
            if (!leafletRef.current) return;
            leafletRef.current.flyTo([lat, lng], 19, { duration: 0.8 });
            if (cpId != null && markersRef.current[cpId]) {
                setTimeout(() => markersRef.current[cpId]?.openPopup(), 850);
            }
        },
    }));

    useEffect(() => {
        ensureLeaflet(() => {
            if (!mapDivRef.current || leafletRef.current) return;
            const L = window.L;

            const first     = checkpoints?.[0];
            const centerLat = first ? parseFloat(first.latitude)  : -7.0051;
            const centerLng = first ? parseFloat(first.longitude) : 110.4381;

            const map = L.map(mapDivRef.current, {
                center:          [centerLat, centerLng],
                zoom:            17,
                scrollWheelZoom: true,
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap",
                maxZoom: 19,
            }).addTo(map);

            // Render marker bernomor untuk setiap checkpoint
            (checkpoints ?? []).forEach((cp, idx) => {
                const lat = parseFloat(cp.latitude);
                const lng = parseFloat(cp.longitude);
                if (isNaN(lat) || isNaN(lng)) return;

                const icon = L.divIcon({
                    html: `
                        <div style="position:relative;width:36px;height:52px;
                            display:flex;flex-direction:column;align-items:center;">
                            <svg width="36" height="52" viewBox="0 0 36 52" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 0 C8.06 0 0 8.06 0 18 C0 30 18 52 18 52
                                         C18 52 36 30 36 18 C36 8.06 27.94 0 18 0 Z"
                                      fill="#005EA4"/>
                                <circle cx="18" cy="18" r="8" fill="white"/>
                                <text x="18" y="22" text-anchor="middle"
                                      font-size="10" font-weight="800"
                                      font-family="sans-serif" fill="#005EA4">
                                    ${idx + 1}
                                </text>
                            </svg>
                        </div>`,
                    iconSize:   [36, 52],
                    iconAnchor: [18, 52],
                    className:  "",
                });

                const marker = L.marker([lat, lng], { icon })
                    .addTo(map)
                    .bindPopup(`
                        <div style="font-family:sans-serif;min-width:140px">
                            <p style="font-weight:700;color:#0F2A44;margin:0 0 2px">${cp.nama}</p>
                            <p style="font-size:11px;color:#64748b;margin:0">
                                No. ${idx + 1} &nbsp;|&nbsp; ${lat.toFixed(5)}, ${lng.toFixed(5)}
                            </p>
                        </div>
                    `);

                markersRef.current[cp.id] = marker;
            });

            leafletRef.current = map;
        });

        return () => {
            if (leafletRef.current) {
                leafletRef.current.remove();
                leafletRef.current = null;
                markersRef.current = {};
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkpoints]);

    return (
        <div
            ref={mapDivRef}
            style={{ height: "100%", minHeight: 220, borderRadius: 0, zIndex: 0 }}
        />
    );
});