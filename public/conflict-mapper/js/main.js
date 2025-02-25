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
            minZoom: conflictMapConfig.initialView.minZoom,
            maxZoom: conflictMapConfig.initialView.maxZoom,
            maxBounds: conflictMapConfig.initialView.maxBounds
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

    } catch (error) {
        console.error('Error al inicializar el mapa:', error);
    }
});
