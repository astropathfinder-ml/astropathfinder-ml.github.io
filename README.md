# Run and deploy your AI Studio app

This contains everything you need to run your app.

---

### 🚀 Running in AI Studio

To enable the **Run App** button and see your live preview, you need to configure the environment. It's not about which file is selected, but about telling the Studio *how* to run your project.

**Follow these two steps:**

1.  **Set the Run Command:**
    *   In the Studio's configuration panel (often labeled "Setup" or "Run"), find the **Run Command** field.
    *   Enter the following command: `npm run dev`

2.  **Add Your API Key Secret:**
    *   In the same configuration panel, find the section for **Secrets** or **Environment Variables**.
    *   Create a new secret with the following details:
        *   **Name:** `GEMINI_API_KEY`
        *   **Value:** `your_actual_api_key_here` (replace with your real Gemini API key)

After completing these steps, the **Run App** button should become active. Click it to start the server and open the preview!

---

### 💻 Run Locally (On Your Own Computer)

**Prerequisites:** [Node.js](https://nodejs.org/)

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Set your API Key:**
    *   Create a file named `.env.local` in the project's root directory.
    *   Add your Gemini API key to it like this: `GEMINI_API_KEY="your_actual_api_key_here"`
3.  **Run the app:**
    ```bash
    npm run dev
    ```
