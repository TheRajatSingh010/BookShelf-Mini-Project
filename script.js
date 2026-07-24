// script.js (FINAL, COMPLETE, AND CORRECTED CODE)

const API_BASE_URL = 'http://localhost:3000/api/books';
let ALL_BOOKS = []; // Global cache for books fetched from the API

// --- Helper function for all API interaction ---
async function fetchData(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        if (response.status === 204) return null;
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        // Note: The alert is commented out to prevent excessive popups during development
        // alert('Could not connect to the backend server or API failed. Ensure server.js is running.');
        return null;
    }
}


async function handleDeleteClick(bookId, bookTitle) {
    if (!confirm(`Are you sure you want to delete the book: "${bookTitle}"? This cannot be undone and will delete the PDF file.`)) {
        return;
    }
    
    const deleteUrl = `${API_BASE_URL}/${bookId}`;

    try {
        await fetchData(deleteUrl, { method: 'DELETE' });
        alert(`Book "${bookTitle}" successfully deleted.`);

        
        ALL_BOOKS = ALL_BOOKS.filter(book => book.id !== bookId);
        
        
        let favorites = getFavorites();
        favorites = favorites.filter(id => id !== bookId);
        saveFavorites(favorites);
        
        
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage === 'books.html' || currentPage === '') {
            displayBooks();
        } else if (currentPage === 'favorites.html') {
            displayFavorites();
        }

    } catch (error) {
        alert('Failed to delete book: ' + error.message);
    }
}



function getFavorites() {
    
    return JSON.parse(localStorage.getItem('favorites') || '[]');
}

function saveFavorites(favorites) {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function toggleFavorite(bookId) {
   
    let favorites = getFavorites();
    const index = favorites.indexOf(bookId);
    
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(bookId);
    }
    saveFavorites(favorites);
    
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'books.html' || currentPage === '') {
        displayBooks();
    } else if (currentPage === 'favorites.html') {
        displayFavorites();
    }
}

function isFavorite(bookId) {
    const favorites = getFavorites();
    return favorites.includes(bookId);
}

// --- DOM Rendering Functions ---

function handleReadClick(bookId) {
    // Opens the PDF using the backend route
    window.open(`${API_BASE_URL}/${bookId}/pdf`, '_blank');
}

function createBookCard(book) {
    const isFav = isFavorite(book.id);
    
    const safeTitle = book.title.replace(/'/g, "\\'"); 
    
    return `
        <div class="book-card" data-book-id="${book.id}">
            <div class="book-cover">${book.cover}</div>
            
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">by ${book.author}</p>
                <span class="book-genre">${book.genre}</span>
                <div class="book-actions">
                    <button class="btn btn-favorite ${isFav ? 'active' : ''}" onclick="toggleFavorite('${book.id}')">
                        ${isFav ? '⭐ Favorited' : '☆ Favorite'}
                    </button>
                    <button class="btn btn-read" onclick="handleReadClick('${book.id}')">Read</button>
                </div>
                <button class="btn btn-delete" onclick="handleDeleteClick('${book.id}', '${safeTitle}')">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `;
}



async function displayBooks(booksToDisplay = ALL_BOOKS) {
    const grid = document.getElementById('booksGrid');
    
   
    if (ALL_BOOKS.length === 0) {
        const fetchedBooks = await fetchData(API_BASE_URL);
        if (!fetchedBooks) return; 
        ALL_BOOKS = fetchedBooks;
        booksToDisplay = ALL_BOOKS;
    }

    
    if (grid) { 
        if (booksToDisplay.length === 0) {
            grid.innerHTML = '<div class="empty-state"><h3>No books found...</h3></div>';
            return;
        }
        grid.innerHTML = booksToDisplay.map(book => createBookCard(book)).join('');
    }
    
}


 
async function displayFavorites() {
    const grid = document.getElementById('favoritesGrid');
    const emptyState = document.getElementById('emptyState');
    if (!grid) return;
    
    
    if (ALL_BOOKS.length === 0) {
        
        await displayBooks(); 
    }
    
    const favorites = getFavorites();
    const favoriteBooks = ALL_BOOKS.filter(book => favorites.includes(book.id)); 
    
    if (favoriteBooks.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        grid.innerHTML = favoriteBooks.map(book => createBookCard(book)).join('');
    }
}



function initializeAddBookForm() {
    const form = document.getElementById('addBookForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);

        const addedBook = await fetchData(API_BASE_URL, {
            method: 'POST',
            body: formData 
        });

        if (addedBook && addedBook.id) {
            alert(`Book "${addedBook.title}" added successfully!`);
            form.reset();
            
            ALL_BOOKS = []; 
            
            setTimeout(() => {
                window.location.href = 'books.html';
            }, 1000);
        } else {
             const message = addedBook && addedBook.message ? addedBook.message : 'Failed to add book. Check server console for errors.';
             alert(message);
        }
    });
}


function initializeSearch() {
    const searchBar = document.getElementById('searchBar');
    if (!searchBar) return;
    
    searchBar.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const currentPage = window.location.pathname.split('/').pop();
        
        let booksToSearch = ALL_BOOKS; 
        
        if (currentPage === 'favorites.html') {
            const favorites = getFavorites();
            booksToSearch = ALL_BOOKS.filter(book => favorites.includes(book.id));
        }
        
        const filteredBooks = booksToSearch.filter(book => 
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            book.genre.toLowerCase().includes(searchTerm)
        );
        
        if (currentPage === 'favorites.html') {
            const grid = document.getElementById('favoritesGrid');
            const emptyState = document.getElementById('emptyState');
            
            if (filteredBooks.length === 0) {
                grid.innerHTML = '';
                emptyState.style.display = 'block';
                emptyState.querySelector('h3').textContent = 'No favorites found';
                emptyState.querySelector('p').textContent = 'Try adjusting your search';
            } else {
                emptyState.style.display = 'none';
                grid.innerHTML = filteredBooks.map(book => createBookCard(book)).join('');
            }
        } else {
            displayBooks(filteredBooks);
        }
    });
}


function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    if(filterButtons.length === 0) return;
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
           
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            
            const genre = button.dataset.genre;
            if (genre === 'all') {
                displayBooks(ALL_BOOKS);
            } else {
                const filteredBooks = ALL_BOOKS.filter(book => book.genre === genre);
                displayBooks(filteredBooks);
            }
        });
    });
}


document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'books.html') {
        displayBooks();
        initializeSearch();
        initializeFilters();
    } else if (currentPage === 'favorites.html') {
        displayFavorites();
        initializeSearch();
    } else if (currentPage === 'add-book.html') {
        initializeAddBookForm();
    }
});