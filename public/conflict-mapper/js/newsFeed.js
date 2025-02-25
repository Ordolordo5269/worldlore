export class NewsFeed {
    constructor() {
        this.apiKey = '293aef4458c249c29d718a7664779a30';
        this.apiUrl = 'https://newsapi.org/v2/top-headlines?q=foreign&apiKey=' + this.apiKey;
        this.modal = document.getElementById('news-modal');
        this.button = document.getElementById('news-feed-button');
        this.closeBtn = document.querySelector('.close-modal');
        this.newsContainer = document.getElementById('news-feed');

        this.initializeListeners();
    }

    initializeListeners() {
        this.button.addEventListener('click', () => this.toggleModal());
        this.closeBtn.addEventListener('click', () => this.toggleModal());
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.toggleModal();
            }
        });
    }

    toggleModal() {
        if (this.modal.style.display === 'block') {
            this.modal.style.display = 'none';
        } else {
            this.modal.style.display = 'block';
            this.fetchNews();
        }
    }

    async fetchNews() {
        try {
            const response = await fetch(this.apiUrl);
            const data = await response.json();
            this.displayNews(data.articles);
        } catch (error) {
            console.error('Error fetching news:', error);
            this.newsContainer.innerHTML = '<p class="error">Error loading news. Please try again later.</p>';
        }
    }

    displayNews(articles) {
        this.newsContainer.innerHTML = articles
            .map(article => `
                <div class="news-item">
                    ${article.urlToImage ? `<img src="${article.urlToImage}" alt="${article.title}">` : ''}
                    <h3>${article.title}</h3>
                    <p>${article.description || ''}</p>
                    <div class="news-meta">
                        <span>${new Date(article.publishedAt).toLocaleDateString()}</span>
                        <a href="${article.url}" target="_blank">Read more</a>
                    </div>
                </div>
            `)
            .join('');
    }
}
