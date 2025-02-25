// Archivo requerido por el HTML, aunque esté vacío por ahora
export const layers = {};

export const conflictLayers = {
    colors: {
        nato: '#4A90E2',
        eu: '#003399',
        brics: '#10B981',
        un: '#60A5FA',
        mercosur: '#8B5CF6'
    },

    initializeLayers: (map) => {
        map.on('load', () => {
            // Añadir la fuente de países
            map.addSource('countries', {
                type: 'geojson',
                data: 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'
            });

            // Capa base de países
            map.addLayer({
                id: 'countries-base',
                type: 'line',
                source: 'countries',
                paint: {
                    'line-color': '#4ca1af',
                    'line-width': 1,
                    'line-opacity': 0.3
                }
            });

            // Capa para organizaciones
            map.addLayer({
                id: 'organization-layer',
                type: 'fill',
                source: 'countries',
                paint: {
                    'fill-color': '#4ca1af',
                    'fill-opacity': 0
                }
            });

            // Añadir fuentes para zonas de conflicto
            map.addSource('conflict-zones', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });

            // Configuración de la animación más sutil
            const pulseAnimation = {
                duration: 3000, // Más lento
                animate: true
            };

            function animateCircle(timestamp) {
                // Cálculo más sutil para la animación
                const progress = (timestamp % pulseAnimation.duration) / pulseAnimation.duration;
                const radius = 25 + Math.sin(progress * Math.PI * 2) * 15; // Menor rango de pulsación
                const opacity = 0.4 - Math.sin(progress * Math.PI * 2) * 0.1; // Menor variación de opacidad

                // Animar zonas de guerra
                if (map.getLayoutProperty('war-zones', 'visibility') === 'visible') {
                    map.setPaintProperty('war-zones', 'circle-radius', [
                        'interpolate',
                        ['linear'],
                        ['get', 'intensity'],
                        0.4, radius * 0.8,
                        0.9, radius * 1.2
                    ]);
                    map.setPaintProperty('war-zones', 'circle-opacity', opacity);
                }

                // Animar zonas warm
                if (map.getLayoutProperty('warm-zones', 'visibility') === 'visible') {
                    map.setPaintProperty('warm-zones', 'circle-radius', [
                        'interpolate',
                        ['linear'],
                        ['get', 'intensity'],
                        0.4, radius * 0.8,
                        0.9, radius * 1.2
                    ]);
                    map.setPaintProperty('warm-zones', 'circle-opacity', opacity);
                }

                if (pulseAnimation.animate) {
                    requestAnimationFrame(animateCircle);
                }
            }

            // Única capa animada para zonas de guerra
            map.addLayer({
                id: 'war-zones',
                type: 'circle',
                source: 'conflict-zones',
                paint: {
                    'circle-radius': 40,
                    'circle-color': '#ef4444',
                    'circle-opacity': 0.4,
                    'circle-stroke-color': '#ef4444',
                    'circle-stroke-width': 2,
                    'circle-stroke-opacity': 0.8
                },
                filter: ['==', ['get', 'type'], 'war'],
                layout: {
                    'visibility': 'none'
                }
            });

            // Única capa animada para zonas warm
            map.addLayer({
                id: 'warm-zones',
                type: 'circle',
                source: 'conflict-zones',
                paint: {
                    'circle-radius': 40,
                    'circle-color': '#f59e0b',
                    'circle-opacity': 0.4,
                    'circle-stroke-color': '#f59e0b',
                    'circle-stroke-width': 2,
                    'circle-stroke-opacity': 0.8
                },
                filter: ['==', ['get', 'type'], 'warm'],
                layout: {
                    'visibility': 'none'
                }
            });

            // Capa para puntos estratégicos
            map.addLayer({
                id: 'trade-gates',
                type: 'circle',
                source: 'conflict-zones',
                paint: {
                    'circle-radius': 8,
                    'circle-color': '#3b82f6',
                    'circle-opacity': 0.3,
                    'circle-stroke-color': '#3b82f6',
                    'circle-stroke-width': 2,
                    'circle-stroke-opacity': 0.8
                },
                filter: ['==', ['get', 'type'], 'trade_gate'],
                layout: {
                    'visibility': 'none'
                }
            });

            // Cargar datos desde data.json
            fetch('../../data/data.json')
                .then(response => response.json())
                .then(data => {
                    const features = [
                        ...data.conflict_zones.war_zones.map(zone => ({
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: zone.coordinates
                            },
                            properties: {
                                ...zone
                            }
                        })),
                        ...data.conflict_zones.warm_zones.map(zone => ({
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: zone.coordinates
                            },
                            properties: {
                                ...zone
                            }
                        })),
                        ...data.strategic_points.trade_gates.map(point => ({
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: point.coordinates
                            },
                            properties: {
                                ...point
                            }
                        }))
                    ];

                    map.getSource('conflict-zones').setData({
                        type: 'FeatureCollection',
                        features: features
                    });
                })
                .catch(error => console.error('Error loading conflict zones:', error));

            // Inicializar listeners
            conflictLayers.initializeOrganizationListeners(map);
            conflictLayers.initializeConflictListeners(map);

            // Iniciar animación
            requestAnimationFrame(animateCircle);
        });
    },

    /**
     * Inicializa los event listeners para las organizaciones internacionales
     * @param {Object} map - Instancia del mapa de Mapbox
     * Permite mostrar/ocultar países miembros de cada organización
     */
    initializeOrganizationListeners: (map) => {
        let activeOrganization = null;

        const toggleOrganization = async (organization) => {
            try {
                const indicator = document.querySelector(`.indicator.${organization}`);
                const isActive = !indicator.classList.contains('active');

                // Desactivar organización anterior
                if (activeOrganization) {
                    const prevIndicator = document.querySelector(`.indicator.${activeOrganization}`);
                    prevIndicator?.classList.remove('active');
                    map.setPaintProperty('organization-layer', 'fill-opacity', 0);
                }

                if (isActive) {
                    try {
                        // Ruta a data.json
                        const response = await fetch('../../data/data.json');
                        if (!response.ok) {
                            console.error('Error HTTP:', response.status);
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        const data = await response.json();
                        const members = data.countries
                            .filter(country => 
                                country.diplomacy["International Organizations"]
                                    .includes(organization.toUpperCase())
                            )
                            .map(country => country.country);

                        if (members.length > 0) {
                            map.setPaintProperty('organization-layer', 'fill-color', conflictLayers.colors[organization]);
                            map.setPaintProperty('organization-layer', 'fill-opacity', 0.3);
                            map.setFilter('organization-layer', ['in', ['get', 'ADMIN'], ['literal', members]]);
                            
                            indicator.classList.add('active');
                            activeOrganization = organization;
                            console.log(`Activada organización ${organization} con ${members.length} miembros`);
                        } else {
                            console.warn(`No se encontraron miembros para ${organization}`);
                        }
                    } catch (fetchError) {
                        console.error('Error al cargar data.json:', fetchError);
                        console.error('Ruta intentada:', '../../data/data.json');
                    }
                } else {
                    indicator.classList.remove('active');
                    activeOrganization = null;
                    map.setPaintProperty('organization-layer', 'fill-opacity', 0);
                }
            } catch (error) {
                console.error('Error en toggleOrganization:', error);
            }
        };

        // Agregar listeners
        ['nato', 'eu', 'brics', 'un', 'mercosur'].forEach(org => {
            const element = document.querySelector(`.indicator.${org}`);
            if (element) {
                element.addEventListener('click', () => toggleOrganization(org));
            }
        });
    },

    /**
     * Inicializa los event listeners para las zonas de conflicto y puntos estratégicos
     * @param {Object} map - Instancia del mapa de Mapbox
     * Gestiona la visualización de zonas de guerra, tensión y puntos comerciales
     */
    initializeConflictListeners: (map) => {
        // Event listener para zonas de guerra
        const warIndicator = document.querySelector('.indicator.war');
        warIndicator?.addEventListener('click', () => {
            const isActive = warIndicator.classList.toggle('active');
            map.setLayoutProperty('war-zones', 'visibility', isActive ? 'visible' : 'none');
        });

        // Event listener para zonas de tensión
        const warmIndicator = document.querySelector('.indicator.warm');
        warmIndicator?.addEventListener('click', () => {
            const isActive = warmIndicator.classList.toggle('active');
            map.setLayoutProperty('warm-zones', 'visibility', isActive ? 'visible' : 'none');
        });

        // Event listener para trade gates
        const tradeIndicator = document.querySelector('.indicator.trade-gate');
        tradeIndicator?.addEventListener('click', () => {
            const isActive = tradeIndicator.classList.toggle('active');
            map.setLayoutProperty('trade-gates', 'visibility', isActive ? 'visible' : 'none');
        });
    }
};