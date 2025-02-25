export const conflictMapConfig = {
    mapboxToken: 'pk.eyJ1IjoiYW5kcmVzb29kIiwiYSI6ImNtNWNtMmd4dzJlZmQybXFyMGJuMDFxemsifQ.t4UlHVJhUi9ntjG5Tiq5_A',
    style: 'mapbox://styles/mapbox/dark-v11',
    initialView: {
        center: [0, 20],
        zoom: 2,
        minZoom: 2,
        maxZoom: 10,
        maxBounds: [[-180, -85], [180, 85]]  // Limita el mapa a coordenadas visibles
    }
};