import { conflictMapConfig } from './config.js';
import { conflictLayers } from './layers.js';
import { NewsFeed } from './newsFeed.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        if (!conflictMapConfig.mapboxToken) {
            throw new Error('Mapbox token no encontrado');
        }

        const mapContainer = document.getElementById('conflict-map');
        if (!mapContainer) {
            throw new Error('Contenedor del mapa no encontrado');
        }

        mapboxgl.accessToken = conflictMapConfig.mapboxToken;

        const map = new mapboxgl.Map({
            container: 'conflict-map',
            style: conflictMapConfig.style,
            center: conflictMapConfig.initialView.center,
            zoom: conflictMapConfig.initialView.zoom,
            pitch: conflictMapConfig.initialView.pitch,
            bearing: conflictMapConfig.initialView.bearing,
            minZoom: conflictMapConfig.initialView.minZoom,
            maxZoom: conflictMapConfig.initialView.maxZoom,
            maxBounds: conflictMapConfig.initialView.maxBounds,
            projection: conflictMapConfig.initialView.projection
        });

        // Añadir controles de navegación
        map.addControl(new mapboxgl.NavigationControl());

        // Añadir efecto de atmósfera y luz cuando el estilo se carga
        map.on('style.load', () => {
            // Configurar la atmósfera
            map.setFog({
                'color': 'rgb(12, 18, 28)',
                'high-color': 'rgb(36, 92, 123)',
                'horizon-blend': 0.2,
                'space-color': 'rgb(2, 4, 8)',
                'star-intensity': 0.6
            });

            // Configurar la iluminación 3D
            map.setLight({
                'anchor': 'viewport',
                'color': 'white',
                'intensity': 0.35,
                'position': [1.5, 90, 70]
            });

            // Añadir capa de agua con efecto brillante
            map.addLayer({
                'id': 'water-effect',
                'type': 'fill',
                'source': {
                    'type': 'vector',
                    'url': 'mapbox://mapbox.mapbox-streets-v8'
                },
                'source-layer': 'water',
                'paint': {
                    'fill-color': '#0c1832',
                    'fill-opacity': 0.8
                }
            }, 'country-layer');

            // Añadir capa de brillos en el agua
            map.addLayer({
                'id': 'water-highlights',
                'type': 'fill',
                'source': {
                    'type': 'vector',
                    'url': 'mapbox://mapbox.mapbox-streets-v8'
                },
                'source-layer': 'water',
                'paint': {
                    'fill-pattern': 'sparkles',
                    'fill-opacity': 0.1
                }
            });
        });

        // Inicializar las capas cuando el mapa esté listo
        conflictLayers.initializeLayers(map);

        // Inicializar News Feed
        const newsFeed = new NewsFeed();

        // Añadir funcionalidad al botón de retorno
        const returnButton = document.getElementById('return-home');
        returnButton.addEventListener('click', () => {
            window.location.href = '../../index.html';
        });

        // Añadir efecto de rotación suave al inicio
        setTimeout(() => {
            map.easeTo({
                bearing: 5,
                pitch: 25,
                duration: 8000,
                easing: (t) => t
            });
        }, 1000);

    } catch (error) {
        console.error('Error al inicializar el mapa:', error);
    }
});
