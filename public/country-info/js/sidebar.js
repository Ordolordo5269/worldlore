export class CountrySidebar {
    constructor() {
        this.sidebar = document.querySelector('.country-sidebar');
        this.resizeHandle = document.querySelector('.resize-handle');
        this.minWidth = 500;
        this.maxWidth = 1000;
        
        this.compareMode = false;
        this.selectedCountries = [];
        this.currentCountryData = null;
        
        this.initializeEventListeners();
        this.initializeResizing();
        this.initializeButtons();
    }

    initializeEventListeners() {
        // Añadir evento al botón de cierre
        const closeButton = this.sidebar.querySelector('.close-sidebar');
        closeButton.addEventListener('click', () => this.close());

        // Manejar secciones colapsables
        document.querySelectorAll('.section-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                toggle.classList.toggle('active');
                const content = toggle.nextElementSibling;
                if (toggle.classList.contains('active')) {
                    content.style.maxHeight = content.scrollHeight + "px";
                } else {
                    content.style.maxHeight = 0;
                }
            });
        });
    }

    initializeResizing() {
        let isResizing = false;

        this.resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', () => {
                isResizing = false;
                document.removeEventListener('mousemove', handleMouseMove);
            });
        });

        const handleMouseMove = (e) => {
            if (!isResizing) return;
            
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth >= this.minWidth && newWidth <= this.maxWidth) {
                this.sidebar.style.width = newWidth + 'px';
            }
        };
    }

    initializeButtons() {
        const compareBtn = this.sidebar.querySelector('.compare-button');
        const downloadBtn = this.sidebar.querySelector('.download-button');

        compareBtn.addEventListener('click', () => this.toggleCompareMode());
        downloadBtn.addEventListener('click', () => this.downloadCountryData());
    }

    toggleCompareMode() {
        const comparisonPanel = this.sidebar.querySelector('.comparison-panel');
        comparisonPanel.classList.toggle('active');
        
        if (comparisonPanel.classList.contains('active')) {
            this.initializeComparison();
        } else {
            this.resetComparison();
        }
    }

    initializeComparison() {
        const slots = this.sidebar.querySelectorAll('.country-slot');
        
        slots.forEach(slot => {
            slot.addEventListener('click', () => {
                if (!this.currentCountryData) return;
                
                const slotNumber = slot.dataset.slot;
                this.selectedCountries[slotNumber - 1] = this.currentCountryData;
                
                // Actualizar visual del slot
                slot.innerHTML = `
                    <div class="selected-country">
                        <img src="https://flagcdn.com/w160/${this.getCountryCode(this.currentCountryData.country)}.png" 
                             alt="${this.currentCountryData.country} flag">
                        <span>${this.currentCountryData.country}</span>
                    </div>
                `;
                slot.classList.add('selected');
                
                // Si ambos países están seleccionados, mostrar comparación
                if (this.selectedCountries.length === 2) {
                    this.showComparison();
                }
            });
        });
        
        // Añadir evento para cerrar comparación
        const closeBtn = this.sidebar.querySelector('.close-comparison');
        closeBtn.addEventListener('click', () => this.toggleCompareMode());
    }

    resetComparison() {
        this.selectedCountries = [];
        const slots = this.sidebar.querySelectorAll('.country-slot');
        
        slots.forEach(slot => {
            slot.innerHTML = `
                <div class="country-placeholder">
                    <i class="fas fa-plus"></i>
                    <span>Select Country</span>
                </div>
            `;
            slot.classList.remove('selected');
        });
        
        this.sidebar.querySelector('.comparison-content').innerHTML = '';
    }

    downloadCountryData() {
        const data = this.currentCountryData;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.country}_data.json`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    open() {
        this.sidebar.classList.add('open');
    }

    close() {
        this.sidebar.classList.remove('open');
        // Limpiar el contenido
        this.sidebar.querySelector('.country-flag').src = '';
        this.sidebar.querySelector('.country-title').textContent = '';
        document.querySelectorAll('.section-content').forEach(section => {
            section.innerHTML = '';
            section.style.maxHeight = '0';
        });
        document.querySelectorAll('.section-toggle').forEach(toggle => {
            toggle.classList.remove('active');
        });
        // Llamar al callback onClose si existe
        if (typeof this.onClose === 'function') {
            this.onClose();
        }
    }

    updateContent(countryData) {
        this.currentCountryData = countryData;

        if (this.compareMode) {
            if (this.selectedCountries.length < 2) {
                this.selectedCountries.push(countryData);
                if (this.selectedCountries.length === 2) {
                    this.showComparison();
                }
            }
            return;
        }

        // Actualizar bandera y título
        const countryCode = this.getCountryCode(countryData.country);
        const flagUrl = `https://flagcdn.com/w160/${countryCode}.png`;
        this.sidebar.querySelector('.country-flag').src = flagUrl;
        this.sidebar.querySelector('.country-title').textContent = 
            `${countryData.country} - ${countryData.continent}`;

        // Actualizar secciones
        this.updateSection('economy', countryData.economy);
        this.updateSection('politics', countryData.politics);
        this.updateSection('population', countryData.population);
        this.updateSection('diplomacy', countryData.diplomacy);

        // Crear gráficos
        const economyContent = this.sidebar.querySelector('[data-section="economy"] + .section-content');
        this.createExportsChart(countryData.economy["Major Exports"], economyContent);

        const populationContent = this.sidebar.querySelector('[data-section="population"] + .section-content');
        this.createPopulationDistributionChart(countryData.population, populationContent);
    }

    updateSection(sectionName, data) {
        const content = this.sidebar.querySelector(`[data-section="${sectionName}"] + .section-content`);
        content.innerHTML = '';

        Object.entries(data).forEach(([key, value]) => {
            if (key !== "Major Exports" && key !== "Major Imports") {
                const item = document.createElement('div');
                item.className = 'data-item';
                item.innerHTML = `
                    <span class="data-label">${key}</span>
                    <span class="data-value">${Array.isArray(value) ? value.join(', ') : value}</span>
                `;
                content.appendChild(item);
            }
        });
    }

    createExportsChart(exportsData, container) {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);
        container.appendChild(chartContainer);

        new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: exportsData.map(item => item.name),
                datasets: [{
                    data: exportsData.map(item => parseFloat(item.percentage)),
                    backgroundColor: [
                        '#4E79A7', '#F28E2B', '#E15759', 
                        '#76B7B2', '#59A14F', '#EDC949'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#dcdcdc' }
                    },
                    title: {
                        display: true,
                        text: 'Major Exports',
                        color: '#dcdcdc'
                    }
                }
            }
        });
    }

    createPopulationDistributionChart(populationData, container) {
        const [urban, rural] = populationData['Urban/Rural Distribution']
            .split(', ')
            .map(value => parseFloat(value));
        
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);
        container.appendChild(chartContainer);

        new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Urban', 'Rural'],
                datasets: [{
                    data: [urban, rural],
                    backgroundColor: ['#4E79A7', '#F28E2B']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#dcdcdc' }
                    },
                    title: {
                        display: true,
                        text: 'Urban/Rural Distribution',
                        color: '#dcdcdc'
                    }
                }
            }
        });
    }

    showComparison() {
        const [country1, country2] = this.selectedCountries;
        const comparisonContent = this.sidebar.querySelector('.comparison-content');
        comparisonContent.innerHTML = '';

        // Categorías a comparar
        const categories = {
            economy: {
                title: 'Economy',
                icon: 'fa-chart-line',
                fields: ['GDP', 'GDP per Capita', 'Inflation', 'Currency']
            },
            politics: {
                title: 'Politics',
                icon: 'fa-landmark',
                fields: ['Political System', 'Democracy Index']
            },
            population: {
                title: 'Population',
                icon: 'fa-users',
                fields: ['Population Density', 'Urban/Rural Distribution', 'HDI']
            },
            diplomacy: {
                title: 'Diplomacy',
                icon: 'fa-globe',
                fields: ['Key Allies', 'International Organizations', 'Rivals']
            }
        };

        // Crear tabla de comparación para cada categoría
        Object.entries(categories).forEach(([key, category]) => {
            const section = document.createElement('div');
            section.className = 'comparison-section';
            section.innerHTML = `
                <div class="comparison-section-header">
                    <i class="fas ${category.icon}"></i>
                    <h3>${category.title}</h3>
                </div>
                <div class="comparison-table">
                    <div class="comparison-row header">
                        <div class="comparison-cell">Indicator</div>
                        <div class="comparison-cell">${country1.country}</div>
                        <div class="comparison-cell">${country2.country}</div>
                    </div>
                    ${category.fields.map(field => `
                        <div class="comparison-row">
                            <div class="comparison-cell">${field}</div>
                            <div class="comparison-cell">${country1[key][field]}</div>
                            <div class="comparison-cell">${country2[key][field]}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            comparisonContent.appendChild(section);
        });
    }

    getCountryCode(countryName) {
        const countryMap = {
            'Spain': 'es',
            'United States of America': 'us',
            'China': 'cn',
            'Germany': 'de',
            'India': 'in',
            'Brazil': 'br',
            'Russia': 'ru',
            'Japan': 'jp',
            'Australia': 'au',
            'Canada': 'ca',
            'United Kingdom': 'gb',
            'France': 'fr',
            'Italy': 'it',
            'South Korea': 'kr',
            'Mexico': 'mx',
            'Indonesia': 'id',
            'Turkey': 'tr',
            'Saudi Arabia': 'sa',
            'Switzerland': 'ch',
            'Poland': 'pl',
            'Netherlands': 'nl',
            'Argentina': 'ar',
            'Thailand': 'th',
            'Sweden': 'se',
            'Belgium': 'be',
            'Nigeria': 'ng',
            'Austria': 'at',
            'Ireland': 'ie',
            'Israel': 'il',
            'Philippines': 'ph',
            'Singapore': 'sg',
            'Hong Kong': 'hk',
            'Denmark': 'dk',
            'Norway': 'no',
            'Finland': 'fi',
            'Greece': 'gr',
            'Vietnam': 'vn',
            'Bangladesh': 'bd',
            'Chile': 'cl',
            'Romania': 'ro',
            'Czech Republic': 'cz',
            'Portugal': 'pt',
            'Pakistan': 'pk',
            'Colombia': 'co',
            'Iraq': 'iq',
            'Peru': 'pe',
            'Kuwait': 'kw',
            'Kazakhstan': 'kz',
            // Añade más países según necesites
        };
        
        return countryMap[countryName] || 'un'; // 'un' para la bandera de Naciones Unidas como fallback
    }
} 