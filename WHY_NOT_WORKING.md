# Why does the website behave differently in other browsers?

There are two main reasons you might face issues when switching browsers:

## 1. The "Setup Required" Screen Appears Again
**Reason:**  
The application currently saves your **Supabase API Key** in your browser's **Local Storage** (a temporary memory specific to that browser).
*   **Chrome** has its own Local Storage.
*   **Edge** has a *different* Local Storage.
*   **Incognito/Private** windows have *empty* Local Storage.

**The Fix:**  
To make it work everywhere automatically without asking for the key again, you must save the key in the project's **`.env`** file.
1.  Open the file named `.env` in your project folder.
2.  Replace `your_supabase_anon_key_here` with your actual key string.
3.  Restart the server.
Once done, the "Setup Screen" will never appear again on any browser.

## 2. Voice Input Doesn't Work
**Reason:**  
The "Voice to Text" feature uses a technology called the **Web Speech API**.
*   **Google Chrome & Microsoft Edge**: Have excellent built-in support (using Google's cloud services).
*   **Safari**: Has decent support but works differently.
*   **Firefox**: Does **NOT** support this feature by default (it requires special configuration flags).
*   **Brave**: Often blocks the Google Speech service for privacy reasons.

**The Fix:**  
For the best experience with Voice Input, strictly use **Chrome** or **Edge**. This is a limitation of the current web browser technology, not the website code.
