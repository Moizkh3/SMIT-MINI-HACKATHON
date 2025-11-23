
# 📘 MateBook

> A lightweight, persistent social media application built entirely with **Vanilla JavaScript** and **Tailwind CSS**. No backend required—everything lives securely in your browser's Local Storage.

## ✨ Features

*   **🔐 Authentication System:** Complete Sign Up and Login flow stored locally.
*   **📝 Rich Posting:** Create posts with text, emojis, and images (via file upload or URL).
*   **👤 Profile Management:**
    *   Update your username.
    *   Upload profile pictures or set them via URL.
    *   Click your avatar to access the dashboard.
*   **❤️ Social Interactions:**
    *   Like and un-like posts.
    *   Real-time comment system.
    *   Share posts via the Web Share API or clipboard.
*   **⚡ Advanced Feed:**
    *   **Search:** Filter posts instantly by content.
    *   **Sort:** View by Latest, Oldest, or Most Popular.
*   **🌓 Theming:** Native Dark and Light mode support with system preference detection.
*   **📱 Responsive Design:** A mobile-first interface designed with Tailwind CSS.

## 🛠️ Tech Stack

*   **Core:** HTML5, Vanilla JavaScript (ES6+)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) (via CDN)
*   **Icons:** Heroicons (SVG)
*   **Persistence:** Browser Local Storage API

## 🚀 Getting Started

Since MateBook is a client-side application, there are no dependencies to install and no build step required!

1.  **Clone the repository** (or download the files):
    ```bash
    git clone https://github.com/Moizkh3/SMIT-MINI-HACKATHON
    ```

2.  **Open the App:**
    Simply double-click `index.html` to open it in your web browser.

## 📖 Usage Guide

1.  **Sign Up:** Open the app and create a new account. Your data is saved to your browser.
2.  **Edit Profile:** Click the avatar icon (top right) to open the profile modal. Here you can upload a photo and change your display name.
3.  **Create Content:** Use the text area to share your thoughts. Click the image icon to upload a photo.
4.  **Manage Posts:** You can **Edit** or **Delete** your own posts using the menu (...) on the post card.

## 📂 Project Structure

```text
MateBook/
├── index.html      # The main UI structure and Tailwind configuration
├── index.js        # All application logic, state management, and DOM manipulation
├── metadata.json   # Application metadata
└── README.md       # Documentation
```

## 🎨 Customization

The design is powered by Tailwind CSS. The configuration is exposed in the `<head>` of `index.html`. You can easily customize the color palette by modifying the CSS variables in the `<style>` tag or the Tailwind config object:

```javascript
// index.html
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: "rgb(31, 173, 102)", // MateBook Green
                // ...
            }
        }
    }
}
```

## 📄 License

This project is open source. Feel free to modify and distribute it as needed.

---

*Built with ❤️ using Vanilla JS*
