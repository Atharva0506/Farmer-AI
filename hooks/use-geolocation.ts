import { useState, useEffect } from 'react';

interface Location {
    latitude: number;
    longitude: number;
    error?: string;
    loading: boolean;
}

export function useGeolocation() {
    const [location, setLocation] = useState<Location>({
        latitude: 0,
        longitude: 0,
        loading: true,
    });

    useEffect(() => {
        if (!("geolocation" in navigator)) {
            setLocation((prev) => ({ ...prev, error: "Geolocation not supported", loading: false }));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    loading: false,
                });
            },
            (error) => {
                setLocation((prev) => ({ ...prev, error: error.message, loading: false }));
            }
        );
    }, []);

    return location;
}
