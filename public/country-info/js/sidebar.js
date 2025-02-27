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
        this.updateIndicesSection(countryData);
        this.updateDetailedIndices(countryData);

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
            'United States': 'us',
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

    updateIndicesSection(data) {
        const content = this.sidebar.querySelector('[data-section="indices"] + .section-content');
        content.innerHTML = `
            <div class="methodology-note">
                <h3>Sobre el Índice Elcano de Presencia Global</h3>
                <p>Este índice mide la proyección exterior de los países en tres dimensiones:</p>
                <div class="dimension-explanation">
                    <div class="dimension">
                        <span class="dimension-title">Presencia Económica (43%)</span>
                        <span class="dimension-desc">Incluye exportaciones de energía, bienes primarios, manufacturas, servicios e inversiones.</span>
                    </div>
                    <div class="dimension">
                        <span class="dimension-title">Presencia Militar (21%)</span>
                        <span class="dimension-desc">Mide tropas internacionales y equipamiento militar estratégico.</span>
                    </div>
                    <div class="dimension">
                        <span class="dimension-title">Presencia Blanda (36%)</span>
                        <span class="dimension-desc">Evalúa migraciones, turismo, deportes, cultura, información, tecnología, ciencia, educación y clima.</span>
                    </div>
                </div>
            </div>
            <div class="indices-grid">
                <div class="index-card">
                    <div class="index-title">Índice Económico</div>
                    <div class="index-value">${data.indices.economico.toFixed(2)}</div>
                    <div class="index-rank">Ranking: ${data.rankings.economico}</div>
                    <div class="participation-bar">
                        <div class="participation-fill" style="width: ${data.participacion.economica * 100}%"></div>
                    </div>
                </div>
                <div class="index-card">
                    <div class="index-title">Índice Militar</div>
                    <div class="index-value">${data.indices.militar.toFixed(2)}</div>
                    <div class="index-rank">Ranking: ${data.rankings.militar}</div>
                    <div class="participation-bar">
                        <div class="participation-fill" style="width: ${data.participacion.militar * 100}%"></div>
                    </div>
                </div>
                <div class="index-card">
                    <div class="index-title">Índice Blando</div>
                    <div class="index-value">${data.indices.blando.toFixed(2)}</div>
                    <div class="index-rank">Ranking: ${data.rankings.blando}</div>
                    <div class="participation-bar">
                        <div class="participation-fill" style="width: ${data.participacion.blanda * 100}%"></div>
                    </div>
                </div>
                <div class="index-card">
                    <div class="index-title">Índice Global</div>
                    <div class="index-value">${data.indices.global.toFixed(2)}</div>
                    <div class="index-rank">Ranking: ${data.rankings.global}</div>
                    <div class="percentile-indicator">
                        <div class="percentile-dot"></div>
                        <span>Percentil: ${(data.percentil_global * 100).toFixed(3)}%</span>
                    </div>
                    <div class="participation-bar">
                        <div class="participation-fill" style="width: ${data.participacion.global * 100}%"></div>
                    </div>
                </div>
            </div>
            <div class="indices-credits">
                Datos proporcionados por el <a href="https://www.realinstitutoelcano.org" target="_blank">Real Instituto Elcano</a>
                <button class="methodology-toggle">
                    <i class="fas fa-info-circle"></i>
                    Ver metodología
                </button>
            </div>
        `;

        // Añadir evento para mostrar/ocultar la nota metodológica
        const methodologyNote = content.querySelector('.methodology-note');
        const methodologyToggle = content.querySelector('.methodology-toggle');
        methodologyToggle.addEventListener('click', () => {
            methodologyNote.classList.toggle('visible');
            methodologyToggle.classList.toggle('active');
        });
    }

    updateDetailedIndices(data) {
        const content = this.sidebar.querySelector('[data-section="detailed-indices"] + .section-content');
        
        // Crear contenedor principal
        content.innerHTML = `
            <div class="detailed-analysis">
                <div class="dimension-section">
                    <div class="dimension-header">
                        <h3>Presencia Económica</h3>
                        <span class="dimension-value">${data.indices.economico.toFixed(2)}</span>
                    </div>
                    <div class="dimension-content">
                        <div class="indicator-grid">
                            ${this.createIndicatorCards(data.indices.desglose.economica)}
                        </div>
                        <div class="radar-chart-container">
                            <canvas id="economic-radar"></canvas>
                        </div>
                    </div>
                </div>

                <div class="dimension-section">
                    <div class="dimension-header">
                        <h3>Presencia Militar</h3>
                        <span class="dimension-value">${data.indices.militar.toFixed(2)}</span>
                    </div>
                    <div class="dimension-content">
                        <div class="indicator-grid">
                            ${this.createIndicatorCards(data.indices.desglose.militar)}
                        </div>
                        <div class="radar-chart-container">
                            <canvas id="military-radar"></canvas>
                        </div>
                    </div>
                </div>

                <div class="dimension-section">
                    <div class="dimension-header">
                        <h3>Presencia Blanda</h3>
                        <span class="dimension-value">${data.indices.blando.toFixed(2)}</span>
                    </div>
                    <div class="dimension-content">
                        <div class="indicator-grid">
                            ${this.createIndicatorCards(data.indices.desglose.blanda)}
                        </div>
                        <div class="radar-chart-container">
                            <canvas id="soft-radar"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Crear gráficos de barras
        this.createBarCharts(data.indices.desglose);
    }

    createIndicatorCards(dimensionData) {
        return Object.entries(dimensionData)
            .filter(([key]) => key !== 'contribucion')
            .map(([key, value]) => `
                <div class="indicator-card">
                    <div class="indicator-name">${this.formatIndicatorName(key)}</div>
                    <div class="indicator-value">${value.toFixed(4)}</div>
                    <div class="contribution-bar">
                        <div class="contribution-fill" style="width: ${dimensionData.contribucion[key] * 100}%"></div>
                    </div>
                    <div class="contribution-value">
                        Contribución: ${(dimensionData.contribucion[key] * 100).toFixed(2)}%
                    </div>
                </div>
            `).join('');
    }

    formatIndicatorName(key) {
        return key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    createBarCharts(desglose) {
        // Crear gráficos de barras para cada dimensión
        this.createBarChart('economic-radar', desglose.economica);
        this.createBarChart('military-radar', desglose.militar);
        this.createBarChart('soft-radar', desglose.blanda);
    }

    createBarChart(canvasId, data) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        const labels = Object.keys(data).filter(key => key !== 'contribucion');
        const values = labels.map(key => data[key]);
        const contributions = labels.map(key => data.contribucion[key] * 100);

        // Definir descripciones para cada tipo de indicador
        const descriptions = {
            // Económicos
            energia: "Exportaciones de combustibles y electricidad",
            bienes_primarios: "Exportaciones de productos agrícolas, minerales y otros recursos naturales",
            manufacturas: "Exportaciones de productos industriales y manufacturados",
            servicios: "Exportaciones de servicios comerciales, financieros y profesionales",
            inversiones: "Stock de inversión extranjera directa en el exterior",
            
            // Militares
            tropas: "Personal militar desplegado en misiones internacionales",
            equipamiento: "Capacidades militares estratégicas (portaaviones, fragatas, submarinos, etc.)",
            
            // Blandos
            migraciones: "Población extranjera en el país y emigrantes en el exterior",
            turismo: "Llegadas de turistas internacionales",
            deportes: "Éxitos en competiciones internacionales y rankings deportivos",
            cultura: "Exportaciones audiovisuales y culturales",
            informacion: "Ancho de banda de Internet y presencia en medios globales",
            tecnologia: "Patentes internacionales y propiedad intelectual",
            educacion: "Estudiantes extranjeros en educación terciaria",
            cooperacion: "Ayuda oficial al desarrollo y cooperación internacional",
            clima: "Emisiones de CO2 y contribución a energías renovables"
        };

        // Añadir descripción encima del gráfico
        const container = document.getElementById(canvasId).parentElement;
        const description = document.createElement('div');
        description.className = 'chart-description';
        description.innerHTML = `
            <p>Este gráfico muestra dos métricas:</p>
            <ul>
                <li><span class="dot value-dot"></span> <strong>Valor:</strong> Medida absoluta del indicador</li>
                <li><span class="dot contribution-dot"></span> <strong>Contribución:</strong> Porcentaje que representa del total</li>
            </ul>
            <div class="indicators-explanation">
                ${labels.map(label => `
                    <div class="indicator-explanation">
                        <strong>${this.formatIndicatorName(label)}:</strong> 
                        ${descriptions[label] || 'Indicador de presencia global'}
                    </div>
                `).join('')}
            </div>
        `;
        // Crear contenedor para el canvas
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'chart-canvas-container';
        const canvas = document.getElementById(canvasId);
        canvas.parentElement.insertBefore(description, canvas);
        canvas.parentElement.removeChild(canvas);
        canvasContainer.appendChild(canvas);
        container.appendChild(canvasContainer);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.map(this.formatIndicatorName),
                datasets: [{
                    label: 'Valor',
                    data: values,
                    backgroundColor: 'rgba(144, 202, 249, 0.6)',
                    borderColor: 'rgba(144, 202, 249, 1)'
                },
                {
                    label: 'Contribución (%)',
                    data: contributions,
                    backgroundColor: 'rgba(100, 181, 246, 0.4)',
                    borderColor: 'rgba(100, 181, 246, 1)'
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label;
                                const value = context.raw;
                                if (label === 'Valor') {
                                    return `${label}: ${value.toFixed(4)} (medida absoluta)`;
                                } else {
                                    return `${label}: ${value.toFixed(2)}% del total`;
                                }
                            }
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                }
            }
        });
    }
} 