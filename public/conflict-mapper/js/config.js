export const conflictMapConfig = {
    mapboxToken: 'pk.eyJ1IjoiYW5kcmVzb29kIiwiYSI6ImNtNWNtMmd4dzJlZmQybXFyMGJuMDFxemsifQ.t4UlHVJhUi9ntjG5Tiq5_A',
    style: 'mapbox://styles/mapbox/dark-v11',
    initialView: {
        center: [-10, 25],
        zoom: 2.5,
        pitch: 20,
        bearing: 0,
        minZoom: 1,
        maxZoom: 18,
        maxBounds: [[-180, -85], [180, 85]],
        projection: 'globe'  // Añadido para habilitar el globo
    }
};