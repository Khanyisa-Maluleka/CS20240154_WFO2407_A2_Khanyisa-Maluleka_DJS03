import { books, authors, genres, BOOKS_PER_PAGE } from './data.js'

// Book Application Class 
class BookApp {
    constructor(books, authors, genres, booksPerPage) {
        this.books = books;
        this.authors = authors;
        this.genres = genres;
        this.BOOKS_PER_PAGE = booksPerPage;

        //internal instance declarations and initialisation
        this.currentPage = 1;
        this.matches = books;
        
        //a function that calls all my other functions
        this.init();
    }

    init() {
        this.initialBookList();
        this.setupSearchForms();
        this.setupTheme();
        this.setupEventListeners();
        this.updateShowMoreButton();
    }

    // Book rendering methods
    bookPreview(book) { //Creates a button element for each book preview
        const element = document.createElement('button');
        element.classList = 'preview';
        element.setAttribute('data-preview', book.id);
        
        element.innerHTML = `
            <img
                class="preview__image"
                src="${book.image}"
            />
            <div class="preview__info">
                <h3 class="preview__title">${book.title}</h3>
                <div class="preview__author">${this.authors[book.author]}</div>
            </div>
        `;
        return element;
    }

    initialBookList() { // to determine how many books to show
        const fragment = document.createDocumentFragment();
        const initialBooks = this.matches.slice(0, this.BOOKS_PER_PAGE);
        
        for (const book of initialBooks) {
            fragment.appendChild(this.bookPreview(book));
        }
        
        document.querySelector('[data-list-items]').appendChild(fragment);
    }

    // To show author and genre dropdown menus
    setupSearchForms() {
        this.createSelectOptions('[data-search-genres]', this.genres, 'All Genres');
        this.createSelectOptions('[data-search-authors]', this.authors, 'All Authors');
    }

    createSelectOptions(selector, data, defaultText) {
        const fragment = document.createDocumentFragment();
        const defaultOption = document.createElement('option');
        defaultOption.value = 'any';
        defaultOption.innerText = defaultText;
        fragment.appendChild(defaultOption);

        for (const [id, name] of Object.entries(data)) {
            const element = document.createElement('option');
            element.value = id;
            element.innerText = name;
            fragment.appendChild(element);
        }

        document.querySelector(selector).appendChild(fragment);
    }

    // Theme handling
    setupTheme() {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = isDarkMode ? 'night' : 'day';
        this.setTheme(theme);
    }

    setTheme(theme) {
        document.querySelector('[data-settings-theme]').value = theme;
        const colors = theme === 'night' 
            ? { dark: '255, 255, 255', light: '10, 10, 20' }
            : { dark: '10, 10, 20', light: '255, 255, 255' };
            
        document.documentElement.style.setProperty('--color-dark', colors.dark);
        document.documentElement.style.setProperty('--color-light', colors.light);
    }

    // Search handling
    handleSearchSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const filters = Object.fromEntries(formData);
        const result = [];

        for (const book of this.books) {
            let genreMatch = filters.genre === 'any';

            for (const singleGenre of book.genres) {
                if (genreMatch) break;
                if (singleGenre === filters.genre) { genreMatch = true; }
            }

            if (
                (filters.title.trim() === '' || book.title.toLowerCase().includes(filters.title.toLowerCase())) && 
                (filters.author === 'any' || book.author === filters.author) && 
                genreMatch
            ) {
                result.push(book);
            }
        }

        this.currentPage = 1;
        this.matches = result;

        if (result.length < 1) {
            document.querySelector('[data-list-message]').classList.add('list__message_show');
        } else {
            document.querySelector('[data-list-message]').classList.remove('list__message_show');
        }

        document.querySelector('[data-list-items]').innerHTML = '';
        const newItems = document.createDocumentFragment();

        for (const book of result.slice(0, this.BOOKS_PER_PAGE)) {
            newItems.appendChild(this.bookPreview(book));
        }

        document.querySelector('[data-list-items]').appendChild(newItems);
        this.updateShowMoreButton();
        window.scrollTo({top: 0, behavior: 'smooth'});
        document.querySelector('[data-search-overlay]').open = false;
    }

    // Book detail handling
    handleBookClick(event) {
        const pathArray = Array.from(event.path || event.composedPath());
        let active = null;

        for (const node of pathArray) {
            if (active) break;

            if (node?.dataset?.preview) {
                let result = null;
                for (const singleBook of this.books) {
                    if (result) break;
                    if (singleBook.id === node?.dataset?.preview) result = singleBook;
                }
                active = result;
            }
        }

        if (active) {
            document.querySelector('[data-list-active]').open = true;
            document.querySelector('[data-list-blur]').src = active.image;
            document.querySelector('[data-list-image]').src = active.image;
            document.querySelector('[data-list-title]').innerText = active.title;
            document.querySelector('[data-list-subtitle]').innerText = `${this.authors[active.author]} (${new Date(active.published).getFullYear()})`;
            document.querySelector('[data-list-description]').innerText = active.description;
        }
    }

    // Event handlers
    setupEventListeners() {
        // Search and settings overlay handlers
        document.querySelector('[data-search-cancel]').addEventListener('click', 
            () => document.querySelector('[data-search-overlay]').open = false);
        document.querySelector('[data-settings-cancel]').addEventListener('click', 
            () => document.querySelector('[data-settings-overlay]').open = false);
        document.querySelector('[data-header-search]').addEventListener('click', 
            this.handleSearchOverlay.bind(this));
        document.querySelector('[data-header-settings]').addEventListener('click', 
            this.handleSettingsOverlay.bind(this));
        
        // Form submission handlers
        document.querySelector('[data-settings-form]').addEventListener('submit', 
            this.handleThemeSubmit.bind(this));
        document.querySelector('[data-search-form]').addEventListener('submit', 
            this.handleSearchSubmit.bind(this));
        
        // Book list handlers
        document.querySelector('[data-list-button]').addEventListener('click', 
            this.handleShowMore.bind(this));
        document.querySelector('[data-list-items]').addEventListener('click', 
            this.handleBookClick.bind(this));
        document.querySelector('[data-list-close]').addEventListener('click', 
            this.handleBookClose.bind(this));
    }

    handleSearchOverlay() {
        document.querySelector('[data-search-overlay]').open = true;
        document.querySelector('[data-search-title]').focus();
    }

    handleSettingsOverlay() {
        document.querySelector('[data-settings-overlay]').open = true;
    }

    handleBookClose() {
        document.querySelector('[data-list-active]').open = false;
    }

    handleThemeSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const { theme } = Object.fromEntries(formData);
        this.setTheme(theme);
        document.querySelector('[data-settings-overlay]').open = false;
    }

    updateShowMoreButton() {
        const remaining = this.matches.length - (this.currentPage * this.BOOKS_PER_PAGE);
        const button = document.querySelector('[data-list-button]');
        button.disabled = remaining < 1;
        button.innerHTML = `
            <span>Show more</span>
            <span class="list__remaining"> (${remaining > 0 ? remaining : 0})</span>
        `;
    }

    handleShowMore() {
        const fragment = document.createDocumentFragment();
        const start = this.currentPage * this.BOOKS_PER_PAGE;
        const end = (this.currentPage + 1) * this.BOOKS_PER_PAGE;
        
        for (const book of this.matches.slice(start, end)) {
            fragment.appendChild(this.bookPreview(book));
        }
        
        document.querySelector('[data-list-items]').appendChild(fragment);
        this.currentPage += 1;
        this.updateShowMoreButton();
    }
}

// Initialize the application
const app = new BookApp(books, authors, genres, BOOKS_PER_PAGE);