const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Función para cargar datos
async function loadCountryData() {
    try {
        const dataPath = path.join(__dirname, 'public', 'data', 'data.json');
        const rawData = await fs.readFile(dataPath, 'utf8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error('Error loading country data:', error);
        return { countries: [] };
    }
}

// Rutas API
app.get('/api/countries', async (req, res) => {
    try {
        const data = await loadCountryData();
        res.json(data.countries);
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar los datos de países' });
    }
});

app.get('/api/country/:name', async (req, res) => {
    try {
        const data = await loadCountryData();
        const country = data.countries.find(c => 
            c.country.toLowerCase().includes(req.params.name.toLowerCase())
        );
        
        if (!country) {
            return res.status(404).json({ error: 'País no encontrado' });
        }
        
        res.json(country);
    } catch (error) {
        res.status(500).json({ error: 'Error al buscar el país' });
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
