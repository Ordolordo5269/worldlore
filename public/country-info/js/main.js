import { countryMapConfig } from './config.js';
import { CountrySidebar } from './sidebar.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        if (!countryMapConfig.mapboxToken) {
            throw new Error('Mapbox token no encontrado');
        }

        const mapContainer = document.getElementById('country-map');
        if (!mapContainer) {
            throw new Error('Contenedor del mapa no encontrado');
        }

        mapboxgl.accessToken = countryMapConfig.mapboxToken;

        const map = new mapboxgl.Map({
            container: 'country-map',
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [-10, 25],
            zoom: 2.5,
            pitch: 20,
            bearing: 0,
            minZoom: countryMapConfig.initialView.minZoom,
            maxZoom: countryMapConfig.initialView.maxZoom,
            maxBounds: countryMapConfig.initialView.maxBounds,
            projection: 'globe'
        });

        // Añadir controles de navegación
        map.addControl(new mapboxgl.NavigationControl());

        // Añadir efecto de atmósfera más sutil
        map.on('style.load', () => {
            map.setFog({
                'color': 'rgb(12, 18, 28)',
                'high-color': 'rgb(36, 92, 123)',
                'horizon-blend': 0.2,
                'space-color': 'rgb(2, 4, 8)',
                'star-intensity': 0.6
            });

            // Añadir efecto de iluminación 3D
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

            // Mejorar los bordes de países
            map.addLayer({
                'id': 'country-boundaries-glow',
                'type': 'line',
                'source': 'country-boundaries',
                'source-layer': 'country_boundaries',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': 'rgba(76, 161, 175, 0.3)',
                    'line-width': 2,
                    'line-blur': 1,
                    'line-opacity': 0.8
                }
            });

            // Añadir puntos de capitales
            map.addLayer({
                'id': 'capital-points',
                'type': 'circle',
                'source': {
                    'type': 'vector',
                    'url': 'mapbox://mapbox.mapbox-streets-v8'
                },
                'source-layer': 'place_label',
                'filter': ['==', ['get', 'class'], 'capital'],
                'paint': {
                    'circle-radius': 4,
                    'circle-color': '#4ca1af',
                    'circle-opacity': 0.7,
                    'circle-blur': 0.5
                }
            });

            // Añadir nombres de capitales
            map.addLayer({
                'id': 'capital-labels',
                'type': 'symbol',
                'source': {
                    'type': 'vector',
                    'url': 'mapbox://mapbox.mapbox-streets-v8'
                },
                'source-layer': 'place_label',
                'filter': ['==', ['get', 'class'], 'capital'],
                'layout': {
                    'text-field': ['get', 'name'],
                    'text-size': 12,
                    'text-offset': [0, 2],
                    'text-anchor': 'top'
                },
                'paint': {
                    'text-color': 'rgba(255, 255, 255, 0.7)',
                    'text-halo-color': 'rgba(0, 0, 0, 0.5)',
                    'text-halo-width': 1
                }
            });

            // Añadir capa de países con bordes más definidos
            map.addSource('country-boundaries', {
                type: 'vector',
                url: 'mapbox://mapbox.country-boundaries-v1'
            });

            map.addLayer({
                'id': 'country-boundaries',
                'type': 'line',
                'source': 'country-boundaries',
                'source-layer': 'country_boundaries',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': 'rgba(255, 255, 255, 0.3)',
                    'line-width': 1,
                    'line-opacity': 0.5
                }
            });
        });

        // Añadir funcionalidad al botón de retorno
        const returnButton = document.getElementById('return-home');
        returnButton.addEventListener('click', () => {
            window.location.href = '../../index.html';
        });

        const sidebar = new CountrySidebar();
        let selectedCountryId = null;
        let originalZoom = null;
        let originalCenter = null;

        // Inicializar búsqueda de países
        const searchInput = document.getElementById('country-search');
        const searchResults = document.querySelector('.search-results');
        let countryList = []; // Lista de países disponibles

        // Cargar lista de países
        fetch('/data/data.json')
            .then(response => response.json())
            .then(data => {
                countryList = data.countries.map(country => ({
                    name: country.country,
                    code: sidebar.getCountryCode(country.country)
                }));
            });

        // Función para mostrar resultados de búsqueda
        function showSearchResults(results) {
            searchResults.innerHTML = '';
            results.forEach(country => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `
                    <img src="https://flagcdn.com/w40/${country.code}.png" 
                         alt="${country.name} flag">
                    <span>${country.name}</span>
                `;
                resultItem.addEventListener('click', async () => {
                    try {
                        const response = await fetch(
                            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(country.name)}.json?access_token=${mapboxgl.accessToken}&types=country`
                        );
                        const data = await response.json();
                        
                        if (data.features && data.features.length > 0) {
                            // Obtener el ID del país de la capa de países
                            const countryFeatures = map.querySourceFeatures('countries', {
                                sourceLayer: 'country_boundaries',
                                filter: ['==', ['get', 'name_en'], country.name]
                            });

                            if (countryFeatures.length > 0) {
                                // Limpiar selección anterior
                                if (selectedCountryId) {
                                    map.setFeatureState(
                                        { 
                                            source: 'countries', 
                                            sourceLayer: 'country_boundaries',
                                            id: selectedCountryId 
                                        },
                                        { selected: false }
                                    );
                                }

                                // Establecer nueva selección
                                selectedCountryId = countryFeatures[0].id;
                                map.setFeatureState(
                                    { 
                                        source: 'countries', 
                                        sourceLayer: 'country_boundaries',
                                        id: selectedCountryId 
                                    },
                                    { selected: true }
                                );
                            }

                            // Enfocar el país usando el bbox de la API de geocodificación
                            const feature = {
                                bbox: data.features[0].bbox,
                                geometry: data.features[0].geometry
                            };
                            focusCountry(feature);

                            // Cargar datos y actualizar sidebar
                            const countryResponse = await fetch('/data/data.json');
                            const countryData = await countryResponse.json();
                            const countryInfo = countryData.countries.find(c => c.country === country.name);
                            
                            if (countryInfo) {
                                sidebar.updateContent(countryInfo);
                                sidebar.open();

                                // Actualizar aliados y rivales
                                map.setPaintProperty('allies-layer', 'fill-opacity', 0);
                                map.setPaintProperty('rivals-layer', 'fill-opacity', 0);

                                if (countryInfo.diplomacy['Key Allies']) {
                                    const alliesFilter = ['in', 'name_en'].concat(countryInfo.diplomacy['Key Allies']);
                                    map.setFilter('allies-layer', alliesFilter);
                                    map.setPaintProperty('allies-layer', 'fill-opacity', 0.3);
                                }

                                if (countryInfo.diplomacy['Rivals']) {
                                    const rivalsFilter = ['in', 'name_en'].concat(countryInfo.diplomacy['Rivals']);
                                    map.setFilter('rivals-layer', rivalsFilter);
                                    map.setPaintProperty('rivals-layer', 'fill-opacity', 0.3);
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error al buscar el país:', error);
                    }
                    
                    // Limpiar búsqueda
                    searchInput.value = '';
                    searchResults.classList.remove('active');
                });
                searchResults.appendChild(resultItem);
            });
            searchResults.classList.toggle('active', results.length > 0);
        }

        // Evento de input para búsqueda
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            if (searchTerm.length < 2) {
                searchResults.classList.remove('active');
                return;
            }

            const results = countryList.filter(country => 
                country.name.toLowerCase().includes(searchTerm)
            );
            showSearchResults(results);
        });

        // Cerrar resultados al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.remove('active');
            }
        });

        // Función para enfocar un país
        function focusCountry(feature) {
            try {
                const bounds = new mapboxgl.LngLatBounds();
                
                // Si recibimos un bbox de la API de geocodificación
                if (feature.bbox) {
                    bounds.extend([feature.bbox[0], feature.bbox[1]]); // SW
                    bounds.extend([feature.bbox[2], feature.bbox[3]]); // NE
                } 
                // Si recibimos una geometría completa
                else if (feature.geometry) {
                    if (feature.geometry.type === 'Point') {
                        const [lng, lat] = feature.geometry.coordinates;
                        bounds.extend([lng - 5, lat - 5]);
                        bounds.extend([lng + 5, lat + 5]);
                    } else if (feature.geometry.type === 'MultiPolygon' || feature.geometry.type === 'Polygon') {
                        // Simplificar la geometría para países grandes
                        const coords = feature.geometry.type === 'MultiPolygon' ? 
                            feature.geometry.coordinates[0][0] : // Tomar el primer anillo del primer polígono
                            feature.geometry.coordinates[0];     // Tomar el primer anillo

                        // Tomar puntos a intervalos para reducir la complejidad
                        const step = Math.ceil(coords.length / 1000); // Reducir a máximo 1000 puntos
                        for (let i = 0; i < coords.length; i += step) {
                            bounds.extend(coords[i]);
                        }
                    }
                }

                // Verificar que los límites son válidos
                if (bounds.isEmpty()) {
                    throw new Error('No se pudieron determinar los límites del país');
                }

                map.fitBounds(bounds, {
                    padding: 50,
                    duration: 1000,
                    maxZoom: 5
                });
            } catch (error) {
                console.error('Error al enfocar el país:', error);
                // Fallback: usar el centro del país
                if (feature.geometry && feature.geometry.coordinates) {
                    const center = feature.geometry.type === 'Point' ? 
                        feature.geometry.coordinates :
                        feature.geometry.coordinates[0][0][0]; // Tomar el primer punto del primer anillo
                    
                    map.flyTo({
                        center: center,
                        zoom: 4,
                        duration: 1000
                    });
                }
            }
        }

        // Función para restaurar la vista original
        function resetView() {
            map.flyTo({
                center: originalCenter,
                zoom: originalZoom,
                duration: 1000
            });
        }

        // Función para resetear todo el estado del mapa
        function resetMapState() {
            // Limpiar selección del país
            if (selectedCountryId) {
                map.setFeatureState(
                    { 
                        source: 'countries', 
                        sourceLayer: 'country_boundaries',
                        id: selectedCountryId 
                    },
                    { selected: false }
                );
                selectedCountryId = null;
            }

            // Limpiar aliados y rivales
            map.setPaintProperty('allies-layer', 'fill-opacity', 0);
            map.setPaintProperty('rivals-layer', 'fill-opacity', 0);
            map.setFilter('allies-layer', ['==', 'name_en', '']); 
            map.setFilter('rivals-layer', ['==', 'name_en', '']);

            // Restaurar vista original
            map.flyTo({
                center: originalCenter,
                zoom: originalZoom,
                pitch: 20,
                bearing: 0,
                duration: 1000
            });

            // Ocultar capa HDI si está visible
            if (document.getElementById('hdi-toggle').classList.contains('active')) {
                map.setPaintProperty('hdi-layer', 'fill-opacity', 0);
                document.getElementById('hdi-toggle').classList.remove('active');
                document.getElementById('hdi-toggle').innerHTML = '<i class="fas fa-chart-line"></i>HDI';
            }
        }

        map.on('load', () => {
            // Primero definimos los índices
            const indices = {
                hdi: {
                    id: 'hdi-layer',
                    field: 'population.HDI',
                    colors: {
                        low: '#ff4e50',    // Rojo
                        mid: '#ffeb3b',    // Amarillo
                        high: '#4caf50'    // Verde
                    }
                },
                democracy: {
                    id: 'democracy-layer',
                    field: 'politics.Democracy Index',
                    colors: {
                        low: '#9c27b0',    // Púrpura
                        mid: '#e1bee7',    // Lila
                        high: '#2196f3'    // Azul
                    }
                },
                inflation: {
                    id: 'inflation-layer',
                    field: 'economy.Inflation',
                    colors: {
                        low: '#4caf50',    // Verde (mejor)
                        mid: '#ffc107',    // Ámbar
                        high: '#f44336'    // Rojo (peor)
                    }
                },
                gdp: {
                    id: 'gdp-layer',
                    field: 'economy.GDP per Capita',
                    colors: {
                        low: '#795548',    // Marrón
                        mid: '#ffd700',    // Dorado
                        high: '#00bcd4'    // Cian
                    }
                }
            };

            // Añadir fuente de países
            map.addSource('countries', {
                type: 'vector',
                url: 'mapbox://mapbox.country-boundaries-v1'
            });

            // Añadir las capas de índices
            Object.entries(indices).forEach(([key, index]) => {
                map.addLayer({
                    'id': index.id,
                    'type': 'fill',
                    'source': 'countries',
                    'source-layer': 'country_boundaries',
                    'paint': {
                        'fill-color': '#000000',
                        'fill-opacity': 0
                    }
                });
            });

            // Guardar valores iniciales
            originalZoom = map.getZoom();
            originalCenter = map.getCenter();

            // Modificar la capa de países
            map.addLayer({
                'id': 'country-layer',
                'type': 'fill',
                'source': 'countries',
                'source-layer': 'country_boundaries',
                'paint': {
                    'fill-color': [
                        'case',
                        ['boolean', ['feature-state', 'selected'], false],
                        '#4ca1af', // Color para país seleccionado
                        'rgba(255, 255, 255, 0.1)'  // Color base neutral para todos los países
                    ],
                    'fill-opacity': [
                        'case',
                        ['boolean', ['feature-state', 'selected'], false],
                        0.6,
                        ['boolean', ['feature-state', 'hover'], false],
                        0.3,
                        0.1
                    ]
                }
            });

            // Añadir una capa de borde para el país seleccionado
            map.addLayer({
                'id': 'selected-country-border',
                'type': 'line',
                'source': 'countries',
                'source-layer': 'country_boundaries',
                'paint': {
                    'line-color': '#4ca1af',
                    'line-width': [
                        'case',
                        ['boolean', ['feature-state', 'selected'], false],
                        3,
                        0
                    ],
                    'line-opacity': 0.8
                }
            });

            // Añadir capas para aliados y rivales
            map.addSource('allies-rivals', {
                type: 'vector',
                url: 'mapbox://mapbox.country-boundaries-v1'
            });

            // Capa para aliados
            map.addLayer({
                'id': 'allies-layer',
                'type': 'fill',
                'source': 'allies-rivals',
                'source-layer': 'country_boundaries',
                'paint': {
                    'fill-color': '#4caf50',
                    'fill-opacity': 0
                }
            });

            // Capa para rivales
            map.addLayer({
                'id': 'rivals-layer',
                'type': 'fill',
                'source': 'allies-rivals',
                'source-layer': 'country_boundaries',
                'paint': {
                    'fill-color': '#af4c4c',
                    'fill-opacity': 0
                }
            });

            // Añadir capa HDI (inicialmente invisible)
            map.addLayer({
                'id': 'hdi-layer',
                'type': 'fill',
                'source': 'countries',
                'source-layer': 'country_boundaries',
                'paint': {
                    'fill-color': '#000000',  // Color inicial (no importa porque opacity es 0)
                    'fill-opacity': 0
                }
            });

            // Función para manejar los índices
            async function toggleIndex(indexKey) {
                const index = indices[indexKey];
                const button = document.getElementById(`${indexKey}-toggle`);
                const isActive = button.classList.contains('active');

                // Desactivar otros índices
                Object.keys(indices).forEach(key => {
                    if (key !== indexKey) {
                        const otherButton = document.getElementById(`${key}-toggle`);
                        otherButton.classList.remove('active');
                        map.setPaintProperty(indices[key].id, 'fill-opacity', 0);
                    }
                });

                if (!isActive) {
                    try {
                        const response = await fetch('/data/data.json');
                        const data = await response.json();
                        
                        // Crear un objeto que mapee países a sus valores
                        const valueMap = {};
                        data.countries.forEach(country => {
                            const [section, field] = index.field.split('.');
                            let value = country[section][field];
                            if (typeof value === 'string') {
                                value = value.replace(/[%$,]/g, '');
                            }
                            let mapboxName = country.country === 'United States of America' ? 'United States' : country.country;
                            valueMap[mapboxName] = parseFloat(value);
                        });

                        const values = Object.values(valueMap).filter(v => !isNaN(v));
                        const min = Math.min(...values);
                        const max = Math.max(...values);

                        // Ajustar punto medio según el índice
                        let midPoint;
                        switch(indexKey) {
                            case 'inflation':
                                midPoint = 5; // 5% como punto medio
                                break;
                            case 'hdi':
                                midPoint = 0.7; // Punto medio típico para HDI
                                break;
                            default:
                                midPoint = (min + max) / 2;
                        }

                        map.setPaintProperty(index.id, 'fill-color', [
                            'case',
                            ['has', ['get', 'name_en'], ['literal', valueMap]],
                            [
                                'interpolate',
                                ['linear'],
                                ['to-number', ['get', ['get', 'name_en'], ['literal', valueMap]]],
                                min, index.colors.low,
                                midPoint, index.colors.mid,
                                max, index.colors.high
                            ],
                            'rgba(0, 0, 0, 0)'
                        ]);
                        
                        map.setPaintProperty(index.id, 'fill-opacity', 0.7);
                        button.classList.add('active');
                    } catch (error) {
                        console.error(`Error loading ${indexKey} data:`, error);
                    }
                } else {
                    map.setPaintProperty(index.id, 'fill-opacity', 0);
                    button.classList.remove('active');
                }
            }

            // Añadir eventos a los botones
            Object.keys(indices).forEach(indexKey => {
                document.getElementById(`${indexKey}-toggle`).addEventListener('click', () => toggleIndex(indexKey));
            });

            // Asegurarse de que las capas estén en el orden correcto
            map.moveLayer('country-layer');
            map.moveLayer('selected-country-border');
            map.moveLayer('allies-layer');
            map.moveLayer('rivals-layer');

            // Modificar el evento de clic
            map.on('click', 'country-layer', (e) => {
                if (e.features.length > 0) {
                    const feature = e.features[0];
                    const countryName = feature.properties.name_en;
                    
                    // Limpiar selección anterior
                    if (selectedCountryId) {
                        map.setFeatureState(
                            { 
                                source: 'countries', 
                                sourceLayer: 'country_boundaries',
                                id: selectedCountryId 
                            },
                            { selected: false }
                        );
                    }

                    // Establecer nueva selección
                    selectedCountryId = feature.id;
                    map.setFeatureState(
                        { 
                            source: 'countries', 
                            sourceLayer: 'country_boundaries',
                            id: selectedCountryId 
                        },
                        { selected: true }
                    );

                    // Enfocar el país seleccionado
                    focusCountry(feature);
                    
                    fetch('/data/data.json')
                        .then(response => response.json())
                        .then(data => {
                            const countryData = data.countries.find(c => c.country === countryName);
                            if (countryData) {
                                sidebar.updateContent(countryData);
                                sidebar.open();

                                // Limpiar colores anteriores de aliados/rivales
                                map.setPaintProperty('allies-layer', 'fill-opacity', 0);
                                map.setPaintProperty('rivals-layer', 'fill-opacity', 0);

                                // Colorear aliados
                                if (countryData.diplomacy['Key Allies']) {
                                    const alliesFilter = ['in', 'name_en'].concat(countryData.diplomacy['Key Allies']);
                                    map.setFilter('allies-layer', alliesFilter);
                                    map.setPaintProperty('allies-layer', 'fill-opacity', 0.3);
                                }

                                // Colorear rivales
                                if (countryData.diplomacy['Rivals']) {
                                    const rivalsFilter = ['in', 'name_en'].concat(countryData.diplomacy['Rivals']);
                                    map.setFilter('rivals-layer', rivalsFilter);
                                    map.setPaintProperty('rivals-layer', 'fill-opacity', 0.3);
                                }
                            }
                        })
                        .catch(error => console.error('Error cargando datos del país:', error));
                }
            });

            // Efectos hover en países
            let hoveredStateId = null;

            map.on('mousemove', 'country-layer', (e) => {
                if (e.features.length > 0) {
                    if (hoveredStateId) {
                        map.setFeatureState(
                            { 
                                source: 'countries', 
                                sourceLayer: 'country_boundaries',
                                id: hoveredStateId 
                            },
                            { hover: false }
                        );
                    }
                    hoveredStateId = e.features[0].id;
                    map.setFeatureState(
                        { 
                            source: 'countries', 
                            sourceLayer: 'country_boundaries',
                            id: hoveredStateId 
                        },
                        { hover: true }
                    );
                }
            });

            map.on('mouseleave', 'country-layer', () => {
                if (hoveredStateId) {
                    map.setFeatureState(
                        { 
                            source: 'countries', 
                            sourceLayer: 'country_boundaries',
                            id: hoveredStateId 
                        },
                        { hover: false }
                    );
                }
                hoveredStateId = null;
            });

            // Modificar el método onClose del sidebar
            sidebar.onClose = () => {
                resetMapState();
            };
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