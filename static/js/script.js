document.addEventListener("DOMContentLoaded", () => {
    // Quote form and table body
    const addQuoteForm = document.getElementById("add-quote-form");
    const quotesTableBody = document.querySelector("#quotes-table tbody");

    // Client-side memory for quotes
    // Get the quotes passed from the Flask backend
    const embeddedQuotesData = document.getElementById("quotes-data");
    let quotes = embeddedQuotesData ? JSON.parse(embeddedQuotesData.textContent) : [];

    // Search controllers
    const searchInput = document.getElementById("search");
    const searchFieldSelector = document.getElementById("search-field");

    // Pagination controllers
    const previousPageButton = document.getElementById("previous-page");
    const nextPageButton = document.getElementById("next-page");
    const itemsPerPageSelect = document.getElementById("items-per-page");

    // Pagination informers
    const pageInfo = document.getElementById("page-info");
    const noResultInfo = document.getElementById("no-results");

    // Pagination trackers
    let currentPage = 1;
    let itemsPerPage = parseInt(itemsPerPageSelect.value, 10);

    // Logout button
    const logoutButton = document.getElementById("logout");

    // Render the table on page load
    renderQuotesTable(quotes);

    async function addQuoteToTable(quote) {
        try {
            const response = await fetch("/add-quote", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(quote),
            });

            const data = await response.json();
            if (response.ok) {
                // Update the client-side memory
                quotes = data.quotes;
                // Re-render the table
                renderQuotesTable(quotes);
                console.log("quote added to the db");
            } else if (response.status === 401) {
                alert(data.error || "Session expired. Please log in again.");
                window.location.href = "/"; // Redirect to the login page
            } else {
                alert(data.error || "Failed to add quote.");
            }
        } catch (error) {
            console.error("Error adding quote:", error);
            alert("An unexpected error occurred. Please try again.");
        }
    }

    function renderQuotesTable(quotes) {
        const totalPages = Math.ceil(quotes.length / itemsPerPage);
        // After search current page needs to be updated (to prevent out of bound pages)
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }
        const startIndex = (currentPage - 1)*itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedQuotes = quotes.slice(startIndex, endIndex);

        // Clear the table
        quotesTableBody.innerHTML = "";

        // If there is no quote, display no results message
        if (paginatedQuotes.length === 0) {
            noResultInfo.style.display = "block";
            return;
        }
        noResultInfo.style.display = "none";

        // Render the table
        paginatedQuotes.forEach((quote) => addRowToTable(quote));

        //Update page info
        pageInfo.textContent = `${currentPage}/${totalPages}`;

        //Enable or disable pagination buttons
        previousPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === totalPages;

        characterLimitIndicator(); // Reset character limits
    }

    // Event listener for items-per-page dropdown
    itemsPerPageSelect.addEventListener("change", () => {
        itemsPerPage = parseInt(itemsPerPageSelect.value);
        currentPage = 1; // Reset to the first page
        renderQuotesTable(quotes);
    });

    // Event listener for previous page button
    previousPageButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderQuotesTable(quotes);
        }
    });

    // Event listener for next page button
    nextPageButton.addEventListener("click", () => {
        const totalPages = Math.ceil(quotes.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderQuotesTable(quotes);
        }
    });

    // 
    function addRowToTable(quote) {
        const row = document.createElement("tr");
        row.innerHTML = `
                <td>${quote.bookSeries || ""}</td>
                <td>${quote.bookTitle}</td>
                <td>${quote.characters || ""}</td>
                <td>${quote.quote}</td>
                <td>${quote.author}</td>
                <td>
                    <button class="edit-button" data-id="${quote._id}">Edit</button>
                </td>
            `;
            quotesTableBody.appendChild(row);
    }

    addQuoteForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const bookSeries = document.getElementById("book-series").value.trim();
        const bookTitle = document.getElementById("book-title").value.trim();
        const characters = document.getElementById("characters").value.trim();
        const quote = document.getElementById("quote").value.trim();
        const author = document.getElementById("author").value.trim();

        if (!bookTitle || !quote || !author) {
            alert("Book title, quote, and author are required fields.");
            return;
        }

        const newQuote = {
            bookSeries: bookSeries || bookTitle,
            bookTitle: bookTitle,
            characters: characters || author,
            quote: quote,
            author: author,
        };
        addQuoteToTable(newQuote);

        // Reset the form
        addQuoteForm.reset();
    });

    // Search functionality
    searchInput.addEventListener("input", searchQuotes);
    searchFieldSelector.addEventListener("change", searchQuotes);

    function searchQuotes() {
        const searchWord = searchInput.value.trim().toLowerCase();
        const searchField = searchFieldSelector.value;
    
        let filteredQuotes;
        if (searchField === "global") {
            filteredQuotes = quotes.filter(quote =>
                Object.entries(quote).filter(
                    ([key, value]) => !["_id", "createdAt", "updatedAt"].includes(key) // Exclude these fields from search
                ).some(
                    ([_, value]) => value && value.toString().toLowerCase().includes(searchWord) // Check value for search term
                )
            );
        } else {
            filteredQuotes = quotes.filter(
                quote => quote[searchField] && quote[searchField].toLowerCase().includes(searchWord)
            );
        }
    
        // Clear the table and render the filtered quotes
        quotesTableBody.innerHTML = "";
        renderQuotesTable(filteredQuotes);

        // Show or hide "No quotes found" message This is handled at renderQuotesTable side
        // const noResultMessage = document.getElementById("no-results");
        // noResultMessage.style.display = filteredQuotes.length === 0 ? "block" : "none";
    }

    //Event listener for logout button
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            try {
                const response = await fetch("/logout", {method: "GET"});

                if (response.redirected) {
                    // Redirect to the register/login page
                    window.location.href = response.url;
                } else {
                    console.error("Logout failed");
                    alert("An error occurred while logging out. Please try again.");
                }
            } catch (error) {
                console.error("Logout error: ", error);
                alert("An error occurred while logging out. Please try again.");
            }
        });
    }
});

//function to display character limits dynamically
function characterLimitIndicator () {
    //get all input fields with character limit
    const inputsWithChLimit = document.querySelectorAll("input[maxlength], textarea[maxlength]");

    inputsWithChLimit.forEach((input) => {
        //get appropriate label
        const label = document.querySelector(`label[for="${input.id}"]`);
        //get max character limit
        const maxLength = parseInt(input.getAttribute("maxlength"));
        let remaining = maxLength - input.value.length; 
        if (label) {
            //append a span dynamically as the user types
            const remainingSpan = label.querySelector("span");
            remainingSpan.textContent = `${remaining}/${maxLength}`;;

            //update the span dynamically
            input.addEventListener("input", () =>{
                remaining = maxLength - input.value.length;
                remainingSpan.textContent = `${remaining}/${maxLength}`;
            });
        }
    });
}

document.addEventListener("DOMContentLoaded", characterLimitIndicator);