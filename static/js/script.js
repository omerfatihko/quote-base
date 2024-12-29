document.addEventListener("DOMContentLoaded", () => {
    const addQuoteForm = document.getElementById("add-quote-form");
    const quotesTableBody = document.querySelector("#quotes-table tbody");

    // Client-side memory for quotes
    // Get the quotes passed from the Flask backend
    const embeddedQuotesData = document.getElementById("quotes-data");
    let quotes = embeddedQuotesData ? JSON.parse(embeddedQuotesData.textContent) : [];

    // Render the table on page load
    renderQuotesTable();

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
                renderQuotesTable();
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

    function renderQuotesTable() {
        // Clear the table
        quotesTableBody.innerHTML = "";

        // Populate with updated quotes
        quotes.forEach((quote) => {
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
        });
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

    const logoutButton = document.getElementById("logout");

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