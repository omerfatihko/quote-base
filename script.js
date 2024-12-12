document.addEventListener("DOMContentLoaded", () => {
    const quoteForm = document.getElementById("add-quote-form");
    const quotesTableBody = document.querySelector("#quotes-table tbody");

    // Local storage key
    const storageKey = "quotesData";

    // Pagination trackers
    let currentPage = 1; // Tracks the current page
    let itemsPerPage = 10; // Default items per page

    const prevPageButton = document.getElementById("prev-page");
    const nextPageButton = document.getElementById("next-page");
    const itemsPerPageSelect = document.getElementById("items-per-page");

    // Load saved quotes and update pagination on page load
    loadQuotes();

    // Event listeners for pagination controls
    prevPageButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderPaginatedQuotes();
        }
    });

    nextPageButton.addEventListener("click", () => {
        const quotes = JSON.parse(localStorage.getItem(storageKey)) || [];
        const totalPages = Math.ceil(quotes.length / itemsPerPage);

        if (currentPage < totalPages) {
            currentPage++;
            renderPaginatedQuotes();
        }
    });

    itemsPerPageSelect.addEventListener("change", () => {
        itemsPerPage = parseInt(itemsPerPageSelect.value, 10);
        currentPage = 1; // Reset to the first page
        renderPaginatedQuotes();
    });

    // Render paginated quotes
    function renderPaginatedQuotes() {
        const quotes = JSON.parse(localStorage.getItem(storageKey)) || [];
        const totalPages = Math.ceil(quotes.length / itemsPerPage);

        // Calculate start and end index
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, quotes.length);

        // Clear the table and render only the current page's quotes
        quotesTableBody.innerHTML = "";
        quotes.slice(startIndex, endIndex).forEach((quote) => appendQuoteToTable(quote));

        // Update page info
        const pageInfo = document.getElementById("page-info");
        pageInfo.textContent = `${currentPage}/${totalPages}`;

        // Update button states
        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === totalPages;
    }

    // Ensure the event listener is added only once
    if (!quoteForm.dataset.listenerAdded) {
        quoteForm.addEventListener("submit", (event) => {
            event.preventDefault();
            //console.log("Form submitted!");

            const newQuote = getFormData();
            if (newQuote && saveQuote(newQuote)) {
                appendQuoteToTable(newQuote);
                updateDatalists();
                quoteForm.reset(); // Clear the form
                loadQuotes();
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

        // Check for duplicates
        const isDuplicate = quotes.some((q) =>
            q.bookSeries === quote.bookSeries &&
            q.bookTitle === quote.bookTitle &&
            q.characters === quote.characters &&
            q.quote === quote.quote &&
            q.author === quote.author
        );

        if (isDuplicate) {
            alert("This quote already exists!");
            return false;
        }

        quotes.push(quote);
        localStorage.setItem(storageKey, JSON.stringify(quotes));
        return true;
    }

    // Load all quotes from local storage and populate the table
    function loadQuotes() {
        renderPaginatedQuotes();
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
    
        // Show the edit section and add transition
        editSection.style.display = "block";
        editSection.classList.add("show"); // Add the class to make it visible
        editSection.scrollIntoView({ behavior: "smooth", block: "start" });

        // Populate fields
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
                editSection.classList.remove("show");
                editSection.classList.add("hide");
                setTimeout(() => {
                    editSection.style.display = "none"; // Hide edit form
                    editSection.classList.remove("hide");
                }, 500);
            }
        };
    
        // Delete quote
        deleteButton.onclick = () => {
            if (confirm("Are you sure you want to delete this quote?")) {
                deleteQuoteFromStorage(quote);
                loadQuotes(); // Refresh the table
                editSection.classList.remove("show");
                editSection.classList.add("hide");
                setTimeout(() => {
                    editSection.style.display = "none"; // Hide edit form
                    editSection.classList.remove("hide");
                }, 500);
            }
        };
    
        // Cancel editing
        cancelButton.onclick = () => {
            editSection.classList.remove("show");
            editSection.classList.add("hide");
            setTimeout(() => {
                editSection.style.display = "none"; // Hide edit form
                editSection.classList.remove("hide");
            }, 500);
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

        // Show or hide "No Results Found" message
        const noResultsMessage = document.getElementById("no-results");
        noResultsMessage.style.display = filteredQuotes.length === 0 ? "block" : "none";
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

        // Clear existing classes
        document.querySelectorAll("#quotes-table th").forEach((th) => {
            th.classList.remove("sorted-asc", "sorted-desc");
        });

        // Add sorted class to the current header
        header.classList.add(currentSortOrder === "asc" ? "sorted-asc" : "sorted-desc");

        // Save sorted quotes and re-render the table
        localStorage.setItem(storageKey, JSON.stringify(quotes));
        loadQuotes();
    }
});

function setupCharacterLimitIndicators() {
    // Select all input and textarea fields with a maxlength attribute
    const inputsWithLimits = document.querySelectorAll("input[maxlength], textarea[maxlength]");

    inputsWithLimits.forEach((input) => {
        const maxLength = parseInt(input.getAttribute("maxlength"), 10);

        // Find the corresponding label for the input
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) {
            // Append a span to the label to show remaining characters
            const remainingSpan = document.createElement("span");
            remainingSpan.style.marginLeft = "10px";
            remainingSpan.style.fontSize = "0.9em";
            remainingSpan.style.color = "#666";
            remainingSpan.textContent = `${maxLength} characters remaining`;
            label.appendChild(remainingSpan);

            // Update the span dynamically as the user types
            input.addEventListener("input", () => {
                const remaining = maxLength - input.value.length;
                remainingSpan.textContent = `${remaining}/${maxLength} characters remaining`;
            });
        }
    });
}

// Call this function after the DOM content has loaded
document.addEventListener("DOMContentLoaded", setupCharacterLimitIndicators);
