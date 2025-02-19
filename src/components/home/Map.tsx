import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapProps {
    positions: { lat: number; lng: number }[];
    center: { lat: number; lng: number };
}

const containerStyle = {
    width: "100%",
    height: "100%",
};

export default function Map({ positions, center }: MapProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (!mapContainerRef.current) return;
        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: "https://maps.geo.us-east-1.amazonaws.com/maps/v0/maps/YourMapStyleId/style-json",
            center: [center.lng, center.lat],
            zoom: 14,
            attributionControl: false,
        });
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
        positions.forEach((pos) => {
            new maplibregl.Marker()
                .setLngLat([pos.lng, pos.lat])
                .addTo(map);
        });
        map.on("load", () => {
            map.addSource("route", {
                type: "geojson",
                data: {
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "LineString",
                        coordinates: positions.map((pos) => [pos.lng, pos.lat]),
                    },
                },
            });
            map.addLayer({
                id: "route-layer",
                type: "line",
                source: "route",
                layout: { "line-join": "round", "line-cap": "round" },
                paint: {
                    "line-color": "#000000",
                    "line-width": 3,
                    "line-opacity": 1,
                },
            });
        });
        return () => map.remove();
    }, [positions, center]);
    return (
        <div className="flex-1 relative rounded-lg overflow-hidden">
            <div ref={mapContainerRef} style={containerStyle} />
        </div>
    );
}