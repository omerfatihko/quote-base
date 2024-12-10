document.addEventListener("DOMContentLoaded", () => {
    const quoteForm = document.getElementById("add-quote-form");
    const quotesTableBody = document.querySelector("#quotes-table tbody");

    // Local storage key
    const storageKey = "quotesData";

    // Load saved quotes on page load
    loadQuotes();

    // Ensure the event listener is added only once
    if (!quoteForm.dataset.listenerAdded) {
        quoteForm.addEventListener("submit", (event) => {
            event.preventDefault();
            console.log("Form submitted!");

            const newQuote = getFormData();
            if (newQuote) {
                saveQuote(newQuote);
                appendQuoteToTable(newQuote);
                updateDatalists();
                quoteForm.reset(); // Clear the form
            }
        });

        // Mark listener as added
        quoteForm.dataset.listenerAdded = true;
    };

    // Retrieve form data and validate fields
    function getFormData() {
        const bookSeries = document.getElementById("bookSeries").value.trim();
        const bookTitle = document.getElementById("bookTitle").value.trim();
        const characters = document.getElementById("characters").value.trim();
        const quote = document.getElementById("quote").value.trim();
        const author = document.getElementById("author").value.trim();

        // Debugging: Check values in console
        console.log("Book Title:", bookTitle, "Quote:", quote, "Author:", author);

        if (!bookTitle || !quote || !author) {
            alert("Please fill in all required fields (Book Title, Quote, Author).");
            return null;
        }

        return {
            bookSeries: bookSeries || bookTitle, // Default to book title
            bookTitle,
            characters: characters || author, // Default to author name
            quote,
            author,
        };
    }

    // Save a quote to local storage
    function saveQuote(quote) {
        const quotes = JSON.parse(localStorage.getItem(storageKey)) || [];
        quotes.push(quote);
        localStorage.setItem(storageKey, JSON.stringify(quotes));
    }

    // Load all quotes from local storage and populate the table
    function loadQuotes() {
        const quotes = JSON.parse(localStorage.getItem(storageKey)) || [];
        // Clear the table body before appending rows
        quotesTableBody.innerHTML = "";
        quotes.forEach((quote) => appendQuoteToTable(quote));
        updateDatalists();
    }

    // Append a single quote to the table
    function appendQuoteToTable(quote) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${quote.bookSeries}</td>
            <td>${quote.bookTitle}</td>
            <td>${quote.characters}</td>
            <td>${quote.quote}</td>
            <td>${quote.author}</td>
            <td>
                <button class="edit-btn">Edit</button>
            </td>
        `;
        quotesTableBody.appendChild(row);

        // Add edit functionality
        row.querySelector(".edit-btn").addEventListener("click", () => handleEdit(row, quote));
    }

    // Update datalists for dynamic suggestions
    function updateDatalists() {
        const quotes = JSON.parse(localStorage.getItem(storageKey)) || [];
        const seriesSet = new Set();
        const titleSet = new Set();
        const charactersSet = new Set();
        const authorsSet = new Set();

        quotes.forEach((quote) => {
            if (quote.bookSeries) seriesSet.add(quote.bookSeries);
            if (quote.bookTitle) titleSet.add(quote.bookTitle);
            if (quote.characters) charactersSet.add(quote.characters);
            if (quote.author) authorsSet.add(quote.author);
        });

        updateDatalist("series-list", seriesSet);
        updateDatalist("title-list", titleSet); // Update book titles datalist
        updateDatalist("characters-list", charactersSet);
        updateDatalist("author-list", authorsSet);
    }

    // Helper function to populate a datalist
    function updateDatalist(datalistId, dataSet) {
        const datalist = document.getElementById(datalistId);
        datalist.innerHTML = ""; // Clear existing options
        dataSet.forEach((value) => {
            const option = document.createElement("option");
            option.value = value;
            datalist.appendChild(option);
        });
    }

    // Handle editing quotes
    function handleEdit(row, quote) {
        const editSection = document.getElementById("edit-quote-section");
        const editForm = document.getElementById("edit-quote-form");
        const deleteButton = document.getElementById("delete-quote");
        const cancelButton = document.getElementById("cancel-edit");
    
        // Show the edit section and populate fields
        editSection.style.display = "block";
        document.getElementById("editBookSeries").value = quote.bookSeries || "";
        document.getElementById("editBookTitle").value = quote.bookTitle || "";
        document.getElementById("editCharacters").value = quote.characters || "";
        document.getElementById("editQuote").value = quote.quote || "";
        document.getElementById("editAuthor").value = quote.author || "";
    
        // Save changes
        editForm.onsubmit = (event) => {
            event.preventDefault();
            const updatedQuote = {
                bookSeries: document.getElementById("editBookSeries").value.trim(),
                bookTitle: document.getElementById("editBookTitle").value.trim(),
                characters: document.getElementById("editCharacters").value.trim(),
                quote: document.getElementById("editQuote").value.trim(),
                author: document.getElementById("editAuthor").value.trim(),
            };
    
            if (confirm("Are you sure you want to save changes?")) {
                updateQuoteInStorage(quote, updatedQuote);
                loadQuotes(); // Refresh the table
                editSection.style.display = "none"; // Hide edit form
            }
        };
    
        // Delete quote
        deleteButton.onclick = () => {
            if (confirm("Are you sure you want to delete this quote?")) {
                deleteQuoteFromStorage(quote);
                loadQuotes(); // Refresh the table
                editSection.style.display = "none"; // Hide edit form
            }
        };
    
        // Cancel editing
        cancelButton.onclick = () => {
            editSection.style.display = "none"; // Hide edit form
        };
    }
    
    function updateQuoteInStorage(oldQuote, updatedQuote) {
        const quotes = JSON.parse(localStorage.getItem(storageKey)) || [];
        const index = quotes.findIndex((q) => JSON.stringify(q) === JSON.stringify(oldQuote));
    
        if (index !== -1) {
            quotes[index] = updatedQuote;
            localStorage.setItem(storageKey, JSON.stringify(quotes));
        }
    }
    
    function deleteQuoteFromStorage(quote) {
        const quotes = JSON.parse(localStorage.getItem(storageKey)) || [];
        const updatedQuotes = quotes.filter((q) => JSON.stringify(q) !== JSON.stringify(quote));
    
        localStorage.setItem(storageKey, JSON.stringify(updatedQuotes));
    }
    
    document.getElementById("search").addEventListener("input", filterQuotes);
    document.getElementById("search-field").addEventListener("change", filterQuotes);

    function filterQuotes() {
        const searchInput = document.getElementById("search").value.trim().toLowerCase();
        const searchField = document.getElementById("search-field").value;
        const quotes = JSON.parse(localStorage.getItem(storageKey)) || [];
    
        const filteredQuotes = quotes.filter((quote) => {
            if (searchField === "global") {
                return Object.values(quote).some((value) =>
                    value.toLowerCase().includes(searchInput)
                );
            } else {
                return quote[searchField]?.toLowerCase().includes(searchInput);
            }
        });
    
        // Clear and re-render the table with filtered quotes
        quotesTableBody.innerHTML = "";
        filteredQuotes.forEach((quote) => appendQuoteToTable(quote));
    }

    document.querySelectorAll("#quotes-table th").forEach((header) => {
        header.addEventListener("click", () => sortQuotes(header));
    });

    let currentSortField = null;
    let currentSortOrder = "asc"; // Default to ascending

    function sortQuotes(header) {
        const fieldMap = {
            0: "bookSeries",
            1: "bookTitle",
            2: "characters",
            3: "quote",
            4: "author",
        };

        const field = fieldMap[header.cellIndex];
        if (!field) return;

        const quotes = JSON.parse(localStorage.getItem(storageKey)) || [];

        // Determine sort order
        if (currentSortField === field) {
            currentSortOrder = currentSortOrder === "asc" ? "desc" : "asc";
        } else {
            currentSortField = field;
            currentSortOrder = "asc";
        }

        // Sort quotes
        quotes.sort((a, b) => {
            const aValue = a[field]?.toLowerCase() || "";
            const bValue = b[field]?.toLowerCase() || "";

            if (aValue < bValue) return currentSortOrder === "asc" ? -1 : 1;
            if (aValue > bValue) return currentSortOrder === "asc" ? 1 : -1;
            return 0;
        });

        // Save sorted quotes and re-render the table
        localStorage.setItem(storageKey, JSON.stringify(quotes));
        loadQuotes();
    }

});
