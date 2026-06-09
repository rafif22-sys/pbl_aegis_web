// resources/js/Components/Admin/MapPicker.jsx

import { useRef, useEffect } from "react";

/** Inject Leaflet CSS & JS sekali via CDN jika belum ada. */
function ensureLeaflet(onReady) {
    if (!document.getElementById("leaflet-css")) {
        const link  = document.createElement("link");
        link.id     = "leaflet-css";
        link.rel    = "stylesheet";
        link.href   = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
    }

    if (window.L) { onReady(); return; }

    const script    = document.createElement("script");
    script.src      = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload   = onReady;
    document.head.appendChild(script);
}

/** Icon pin default AEGIS (biru). */
function makePinIcon(L) {
    return L.divIcon({
        html: `<div style="
            width:32px;height:32px;border-radius:50% 50% 50% 0;
            background:#005EA4;border:3px solid white;
            transform:rotate(-45deg);
            box-shadow:0 2px 8px rgba(0,94,164,0.5);
        "></div>`,
        iconSize:   [32, 32],
        iconAnchor: [16, 32],
        className:  "",
    });
}

/**
 * MapPicker — peta klik-untuk-pilih-koordinat.
 *
 * Props:
 *   lat, lng     — nilai koordinat saat ini (string | number)
 *   onPick       — callback(lat: string, lng: string) saat user klik peta
 *   height       — tinggi kontainer peta (default 240)
 *   interactive  — false = hanya tampilan, tidak bisa diklik
 */
export function MapPicker({ lat, lng, onPick, height = 240, interactive = true }) {
    const mapRef     = useRef(null);
    const leafletRef = useRef(null);
    const markerRef  = useRef(null);

    // ── Inisialisasi peta ──────────────────────────────────
    useEffect(() => {
        const hasInitCoord =
            lat && !isNaN(parseFloat(lat)) &&
            lng && !isNaN(parseFloat(lng));

        const initLat = hasInitCoord ? parseFloat(lat) : -7.0051;
        const initLng = hasInitCoord ? parseFloat(lng) : 110.4381;

        ensureLeaflet(() => {
            if (!mapRef.current || leafletRef.current) return;
            const L = window.L;

            const map = L.map(mapRef.current, {
                center:          [initLat, initLng],
                zoom:            17,
                zoomControl:     true,
                scrollWheelZoom: interactive,
                dragging:        interactive,
                doubleClickZoom: interactive,
                touchZoom:       interactive,
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap",
                maxZoom: 19,
            }).addTo(map);

            const pinIcon = makePinIcon(L);

            if (hasInitCoord) {
                // Mode edit — tampilkan marker di koordinat tersimpan
                markerRef.current = L.marker([initLat, initLng], { icon: pinIcon }).addTo(map);
            } else if (interactive && navigator.geolocation) {
                // Mode tambah — terbang ke lokasi device
                navigator.geolocation.getCurrentPosition(
                    (pos) => map.flyTo([pos.coords.latitude, pos.coords.longitude], 18, { duration: 1 }),
                    () => { /* izin ditolak → tetap di posisi default */ },
                    { timeout: 8000, maximumAge: 30000 }
                );
            }

            if (interactive && onPick) {
                map.on("click", (e) => {
                    const { lat: cLat, lng: cLng } = e.latlng;
                    if (markerRef.current) {
                        markerRef.current.setLatLng([cLat, cLng]);
                    } else {
                        markerRef.current = L.marker([cLat, cLng], { icon: pinIcon }).addTo(map);
                    }
                    onPick(cLat.toFixed(6), cLng.toFixed(6));
                });
            }

            leafletRef.current = map;
        });

        return () => {
            if (leafletRef.current) {
                leafletRef.current.remove();
                leafletRef.current = null;
                markerRef.current  = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Sinkronisasi marker jika koordinat berubah dari input manual ──
    useEffect(() => {
        if (!leafletRef.current || !window.L) return;
        const pLat = parseFloat(lat);
        const pLng = parseFloat(lng);
        if (isNaN(pLat) || isNaN(pLng)) return;

        const L       = window.L;
        const pinIcon = makePinIcon(L);

        if (markerRef.current) {
            markerRef.current.setLatLng([pLat, pLng]);
        } else {
            markerRef.current = L.marker([pLat, pLng], { icon: pinIcon }).addTo(leafletRef.current);
        }
        leafletRef.current.panTo([pLat, pLng]);
    }, [lat, lng]);

    return (
        <div
            ref={mapRef}
            style={{
                height,
                borderRadius:  "12px",
                overflow:      "hidden",
                border:        "1.5px solid #c7e8f8",
                zIndex:        0,
            }}
        />
    );
}