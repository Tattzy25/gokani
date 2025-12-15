# GoKAnI AI (FamosoFluxo)

GoKAnI AI is a powerful, user-friendly AI image generation application built with Next.js 16 and powered by the Flux model via Replicate. It features a modern, responsive UI designed for both creativity and safety.

![GoKAnI AI Logo](/public/ゴカニ%20AI.svg)

## ✨ Features

-   **High-Quality Generation:** Utilizes the state-of-the-art **Flux** model (Dev & Schnell modes) for stunning visuals.
-   **Safety Mechanisms:** "Do Not Touch" warnings and robust error handling to prevent accidental setting changes or empty prompts.
-   **Smart Downloads:** Custom proxy implementation to ensure images can be downloaded on any device, bypassing CORS restrictions.
-   **Native Sharing:** Integrated Web Share API support to easily share creations on mobile and supported desktop browsers.
-   **Responsive Design:** Fully optimized for mobile and desktop with a beautiful, shadow-themed UI.
-   **Advanced Controls:** Fine-tune your generations with Aspect Ratio, Guidance Scale, Inference Steps, and LoRA support.
-   **Image-to-Image:** Support for Img2Img and Inpainting workflows.

## 🛠️ Tech Stack

-   **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
-   **Language:** TypeScript
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
-   **Icons:** [Lucide React](https://lucide.dev/)
-   **AI Provider:** [Replicate](https://replicate.com/)

## 🚀 Getting Started

### Prerequisites

-   Node.js 18+ installed
-   pnpm (recommended) or npm/yarn
-   A [Replicate](https://replicate.com/) API Token

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/famosofluxo.git
    cd famosofluxo
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root directory and add your Replicate API token:
    ```env
    REPLICATE_API_TOKEN=r8_your_token_here
    ```

4.  **Run the development server:**
    ```bash
    pnpm dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) with your browser to start generating!

## 🛡️ Safety & UX Features

The application includes specific UX choices to ensure a smooth and safe user experience:
-   **Validation:** Prevents generation with empty prompts.
-   **Locking:** Disables the "Generate" button while an image is being created.
-   **Warnings:** Clear "DO NOT TOUCH SETTINGS" labels on advanced configuration cards.
-   **Friendly Errors:** Uses toast notifications (Sonner) to explain issues clearly.

## 📄 License

This project is for personal and educational use.
