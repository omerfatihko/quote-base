# Quote-Base v1.1

**Quote-Base** is a beginner-friendly web application designed to manage your favorite book quotes. With features for adding, editing, searching, and deleting quotes, this app provides an easy-to-use interface for book lovers to keep track of their treasured lines. This project serves as an ongoing learning experience, continually evolving as I enhance my programming and web development skills.

---

## Features

### 1. **Quote Management**

- Add new quotes with the following fields:
  - Book Series
  - Book Title (Required)
  - Characters
  - Quote (Required)
  - Author (Required)
- Edit or delete existing quotes.

### 2. **Search and Filter**

- Search for quotes globally or filter by specific fields (e.g., Author, Book Title).
- Case-insensitive keyword matching.

### 3. **Pagination**

- Efficiently navigate through quotes with paginated results.
- Displays current page and total pages (e.g., 2/3).

### 4. **Responsive Design**

- Optimized for various screen sizes:
  - Hides the "Book Series" column for smaller screens (<520px) to save space.
  - Scales elements dynamically to improve usability.

### 5. **Character Limit Indicators**

- Displays the number of characters remaining for input fields.
- Prevents exceeding maximum limits for input fields.

### 6. **Error Handling**

- Detects and alerts duplicate entries.
- Validates required fields and input sizes.
- Displays a "No Results Found" message if no search matches.

### 7. **Transitions**

- Smooth transitions for showing/hiding the edit section.
- Automatically scrolls to the edit section upon activation for better user experience.

---

## Technologies Used

- **HTML5**: For the structure of the app.
- **CSS3**: For styling, including responsive design with media queries.
- **JavaScript**: For functionality, event handling, and dynamic updates.
- **Local Storage**: For storing and retrieving quotes without needing a backend.

---

## How to Use

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/quote-base.git

   ```

2. Navigate to the project directory:

   ```bash
   cd quote-base

   ```

3. Open `index.html` in your preferred browser

---

## Future updates

This project is a work in progress and will be updated as I learn new concepts and techniques. Planned updates include:

- Enhanced styling and animations.
- Integration with a backend database for persistent storage.
- User authentication for personalized experiences.
- Export/import functionality for quotes.
- Support for additional languages

---

## License

This project is licensed under the [MIT License](/LICENSE.txt)

---

## Acknowledgements

- Background image by [Pawel Czerwinski](https://unsplash.com/@pawel_czerwinski?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash) on [Unsplash](https://unsplash.com/photos/a-close-up-of-a-pattern-of-wavy-shapes-_x16XKBPBwE?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash)
- Icons used for Github, LinkedIn, and Gmail links.
