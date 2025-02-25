export const countryMapConfig = {
    mapboxToken: 'pk.eyJ1IjoiYW5kcmVzb29kIiwiYSI6ImNtNWNtMmd4dzJlZmQybXFyMGJuMDFxemsifQ.t4UlHVJhUi9ntjG5Tiq5_A',
    style: 'mapbox://styles/mapbox/light-v11', // Cambiado a estilo político
    initialView: {
        center: [0, 20], // Igual que en el mapa oscuro
        zoom: 2, // Mismo zoom que el mapa oscuro
        pitch: 0, // Sin inclinación como el mapa oscuro
        bearing: 0,
        minZoom: 1,
        maxZoom: 18,
        maxBounds: [[-180, -85], [180, 85]]
    }
}; 