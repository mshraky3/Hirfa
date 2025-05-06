// src/components/DraggableLocationMap.jsx
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const DraggableLocationMap = ({ initialPosition, onLocationChange }) => {
    const [position, setPosition] = useState(initialPosition);

    const handleMarkerDragEnd = (e) => {
        const { lat, lng } = e.target.getLatLng();
        const newPosition = { lat, lng };
        setPosition(newPosition);
        onLocationChange(newPosition); // Update parent component
    };

    return (
        <MapContainer
            center={initialPosition}
            zoom={13}
            style={{ height: '250px', width: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            />
            <Marker
                position={position}
                icon={defaultIcon}
                draggable={true}
                eventHandlers={{
                    dragend: handleMarkerDragEnd,
                }}
            >
                <Popup>يمكنك سحب العلامة لتغيير الموقع</Popup>
            </Marker>
        </MapContainer>
    );
};

export default DraggableLocationMap;