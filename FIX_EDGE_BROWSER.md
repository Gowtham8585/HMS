# Why isn't it working in Edge?

The website **DOES** work in Edge, but it thinks you are a "new user" because the **API Key** is missing in that browser.

## The Problem
You previously entered the API Key in **Chrome**.
*   Chrome saved it in its own private memory.
*   **Edge cannot read Chrome's memory.**
*   So, when you open Edge, the app checks the `.env` file, finds a placeholder, and stops working.

## The Permanent Fix (Do this once)
To make the website work in **Edge, Chrome, Mobile, and everywhere else** automatically:

1.  Open the file named **`.env`** in your project folder (it's in the main list of files).
2.  Find the line that says:
    `VITE_SUPABASE_KEY=your_supabase_anon_key_here`
3.  **Delete** `your_supabase_anon_key_here`.
4.  **Paste** your actual long API Key (starts with `ey...`) in its place.
    *   It should look like: `VITE_SUPABASE_KEY=eyJhbGc...`
5.  **Save** the file.

**Once you do this, you will never see the Setup Screen again on any browser.**
