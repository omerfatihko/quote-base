document.addEventListener("DOMContentLoaded", () => {
    const inputForm = document.getElementById("add-quote-form");
    const quoteTableBody = document.querySelector("#quotes-table tbody");

    // Local storage key
    const storageKey = "quotesData";

    // Pagination trackers
    let currentPage = 1;
    let itemsPerPage = 10;

    const previousPageButton = document.getElementById("previous-page");
    const nextPageButton = document.getElementById("next-page");
    const itemsPerPageSelect = document.getElementById("items-per-page");

    renderTable();

    itemsPerPageSelect.addEventListener("change", () => {
        itemsPerPage = parseInt(itemsPerPageSelect.value);
        currentPage = 1;
        renderPaginatedQuotes();
    });

    previousPageButton.addEventListener("click", () => {
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

    function renderPaginatedQuotes() {
        const quotes = JSON.parse(localStorage.getItem(storageKey)) || [];
        const totalPages = Math.ceil(quotes.length / itemsPerPage);

        // Calculate start and end index
        const startIndex = (currentPage - 1)*itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, quotes.length);

        // Clear the table and only render current page
        quoteTableBody.innerHTML = "";
        quotes.slice(startIndex, endIndex).forEach((quote) => addQuoteToTable(quote));

        // Update page info
        const pageInfo = document.getElementById("page-info");
        pageInfo.textContent = `${currentPage}/${totalPages}`

        // Update button states
        previousPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === totalPages;

        characterLimitIndicator(); //to reset character limits
    }

    /**
     * get data from form, add it to the local storage, render table
     */
    inputForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const quote = getFormData();
        if (quote && setFormData(quote)) {
            inputForm.reset();
            console.log(quote);
            renderTable();
            //updateDataLists(); already in the renderTable function
        };
    });

    /**
     * get the data from form
     */
    function getFormData() {
        const seriesInput = document.getElementById("book-series").value.trim();
        const titleInput = document.getElementById("book-title").value.trim();
        const charactersInput = document.getElementById("characters").value.trim();
        const quoteInput = document.getElementById("quote").value.trim();
        const authorInput = document.getElementById("author").value.trim();

        if (!titleInput || !quoteInput || !authorInput) {
            alert("Please fill in all required fields (Book title, quote, and author)");
            return null;
        };

        return {
            bookSeries: seriesInput || titleInput,
            bookTitle: titleInput,
            characters: charactersInput || authorInput,
            quote: quoteInput,
            author: authorInput,
        };
    };

    /**
     * set the data to local storage
     */
    function setFormData(quote) {
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
    };

    /**
     * add quote to the table
     */
    function addQuoteToTable(quote) {
        const row = document.createElement("tr");
        row.innerHTML = `
        <td>${quote.bookSeries}</td>
        <td>${quote.bookTitle}</td>
        <td>${quote.characters}</td>
        <td>${quote.quote}</td>
        <td>${quote.author}</td>
        <td>
            <button class="edit-button">Edit</button>
        </td>
        `;
        quoteTableBody.appendChild(row);

        row.querySelector(".edit-button").addEventListener("click", () => handleEdit(quote));
        row.querySelector(".edit-button").addEventListener("click", () => characterLimitIndicator());
    };

    function handleEdit(quote) {
        console.log("old quote: ",quote)
        const editSection = document.getElementById("edit-quote-section");
        const editForm = document.getElementById("edit-quote-form");
        const deleteButton = document.getElementById("delete-quote");
        const cancelButton = document.getElementById("cancel-edit");

        //show edit section
        editSection.style.display = "block";
        editSection.classList.add("show");
        editSection.scrollIntoView({behavior: "smooth", block: "start"});

        //populate edit section
        document.getElementById("edit-book-series").value = quote.bookSeries;
        document.getElementById("edit-book-title").value = quote.bookTitle;
        document.getElementById("edit-characters").value = quote.characters;
        document.getElementById("edit-quote").value = quote.quote;
        document.getElementById("edit-author").value = quote.author;

        //edit submit
        editForm.onsubmit = (event) => {
            event.preventDefault();
            //get edited content
            const editedSeriesInput = document.getElementById("edit-book-series").value.trim();
            const editedTitleInput = document.getElementById("edit-book-title").value.trim();
            const editedCharactersInput = document.getElementById("edit-characters").value.trim();
            const editedQuoteInput = document.getElementById("edit-quote").value.trim();
            const editedAuthorInput = document.getElementById("edit-author").value.trim();

            //check for required fields (empty, only spaces etc)
            if (!editedTitleInput || !editedQuoteInput || !editedAuthorInput) {
                alert("Please fill in all requited fields (Book title, quote, and author)");
                return;
            }

            //get the edited quote
            const editedQuote = {
                bookSeries: editedSeriesInput || editedTitleInput,
                bookTitle: editedTitleInput,
                characters: editedCharactersInput || editedAuthorInput,
                quote: editedQuoteInput,
                author: editedAuthorInput
            }

            //confirm edit
            if (confirm("Are you sure you want to save changes?")) {
                console.log("edited quote: ", editedQuote);
                updateQuote(quote, editedQuote); //update quote
                renderTable(); //re-render table
                editSection.classList.remove("show");
                editSection.classList.add("hide");
                setTimeout(() => {
                    editSection.style.display = "none"; //hide edit section
                    editSection.classList.remove("hide"); //remove hide otherwise edit section won't show next time you click edit
                }, 500);
            };
        };

        //delete quote
        deleteButton.onclick = () => {
            if (confirm("Are you sure you want to delete this quote?")) {
                console.log("deleted quote: ", quote);
                deleteQuote(quote); //delete quote
                renderTable(); //re-render table
                editSection.classList.remove("show");
                editSection.classList.add("hide");
                setTimeout(() => {
                    editSection.style.display = "none"; //hide edit section
                    editSection.classList.remove("hide"); //remove hide otherwise edit section won't show next time you click edit
                }, 500);
                };
        };

        //cancel edit
        cancelButton.onclick = () => {
            editSection.classList.remove("show");
            editSection.classList.add("hide");
            setTimeout(() => {
                editSection.style.display = "none"; //hide edit section
                editSection.classList.remove("hide"); //remove hide otherwise edit section won't show next time you click edit
            }, 500);
        };
    };

    function updateQuote(oldQuote, newQuote) {
        const quotes = JSON.parse(localStorage.getItem(storageKey)) || []; //get quotes from local storage
        const index = quotes.findIndex((q) => JSON.stringify(q) === JSON.stringify(oldQuote)); //find index of the old quote

        if (index !== -1) {
            quotes[index] = newQuote;
            localStorage.setItem(storageKey, JSON.stringify(quotes));
        };
    };

    function deleteQuote(quote) {
        const quotes = JSON.parse(localStorage.getItem(storageKey)) || []; //get quotes from local storage
        const updatedQuotes = quotes.filter((q) => JSON.stringify(q) !== JSON.stringify(quote)); //filter out deleted quote

        localStorage.setItem(storageKey, JSON.stringify(updatedQuotes));
    };

    /**
     * render table
     */
    function renderTable() {
        renderPaginatedQuotes();
        updateDataLists();
    };

    function updateDataLists() {
        const quotes = JSON.parse(localStorage.getItem(storageKey)) || [];
        const seriesSet = new Set();
        const titlesSet = new Set();
        const charactersSet = new Set();
        const authorsSet = new Set();

        quotes.forEach(quote => {
            seriesSet.add(quote.bookSeries);
            titlesSet.add(quote.bookTitle);
            charactersSet.add(quote.characters);
            authorsSet.add(quote.author);
        });

        updateDataList("series-list", seriesSet);
        updateDataList("title-list", titlesSet);
        updateDataList("characters-list", charactersSet);
        updateDataList("author-list", authorsSet);
    };

    function updateDataList(datalistId, dataSet) {
        const datalist = document.getElementById(datalistId);
        datalist.innerHTML = "";
        dataSet.forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            datalist.appendChild(option);
        });
    }

    const searchInput = document.getElementById("search");
    const searchFieldSelector = document.getElementById("search-field");

    searchInput.addEventListener("input", searchQuotes);
    searchFieldSelector.addEventListener("change", searchQuotes);

    function searchQuotes() {
        const searchWord = searchInput.value.trim().toLowerCase();
        const searchField = searchFieldSelector.value;
        const quotes = JSON.parse(localStorage.getItem(storageKey)) || [];
    
        let filteredQuotes;
        if (searchField === "global") {
            filteredQuotes = quotes.filter(quote =>
                Object.values(quote).some(value => 
                    value.toLowerCase().includes(searchWord) // Correctly returning true/false
                )
            );
        } else {
            filteredQuotes = quotes.filter(quote => 
                quote[searchField].toLowerCase().includes(searchWord)
            );
        }
    
        // Clear the table and render the filtered quotes
        quoteTableBody.innerHTML = "";
        filteredQuotes.forEach(quote => addQuoteToTable(quote));

        // Show or hide "No quotes found" message
        const noResultMessage = document.getElementById("no-results");
        noResultMessage.style.display = filteredQuotes.length === 0 ? "block" : "none";
    }

    document.querySelectorAll("#quotes-table th").forEach((header) => {
        header.addEventListener("click", () => sortQuotes(header));
    });

    let currentSortField = null;
    let currentSortOrder = "asc"; // Default sorting mode

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
        renderTable();
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