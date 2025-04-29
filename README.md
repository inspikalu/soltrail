# Soltrail

Soltrail is an open-source analytics and visualization platform for Solana blockchain transactions. It enables users to trace, cluster, and label wallet activity, providing deep insights into the flow of funds and wallet behavior on Solana.

## Features

- **Transaction Flow Visualization:** Trace and visualize the movement of funds between wallets, tokens, and programs.
- **Transaction Clustering:** Identify clusters of related transactions or wallets.
- **Entity Labeling:** Annotate wallets with labels for enhanced analysis.
- **Wallet Analysis:** Analyze funding sources, activity patterns, and key metrics.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- pnpm (or npm/yarn)
- A Helius API key (for Solana data)
- (Optional) A BlockSec API key (for advanced analytics)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/soltrail.git
   cd soltrail
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the project root with the following content:

   ```env
   HELIUS_API_KEY="your-helius-api-key"
   BLOCKSEC_API_KEY="your-blocksec-api-key"
   NEXT_PUBLIC_SITE_URL="http://localhost:3000" # or use your hosted app's url
   ```

   - `HELIUS_API_KEY` is required for all Solana data queries.
   - `BLOCKSEC_API_KEY` is optional and used for additional analytics.

4. **Run the development server:**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. **Open the app:**
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `app/`: Next.js app directory (pages, API routes, feature modules)
- `components/`: Reusable UI components
- `hooks/`: Custom React hooks for analytics and state management
- `lib/`: Core utilities, data processing, and type definitions
- `public/`: Static assets
- `styles/`: Global and component styles

## Environment Variables

| Variable               | Description                                 | Required |
|------------------------|---------------------------------------------|----------|
| `HELIUS_API_KEY`       | Helius API key for Solana data              | Yes      |
| `BLOCKSEC_API_KEY`     | BlockSec API key for advanced analytics     | Yes      |
| `NEXT_PUBLIC_SITE_URL` | Public url of your website                  | Yes      |

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your fork and open a pull request

## License

MIT

## Acknowledgments

- [Helius](https://helius.xyz/) for Solana data APIs
- [BlockSec](https://blocksec.com/) for advanced analytics
- [Next.js](https://nextjs.org/) and [React](https://react.dev/) for the web framework

---

For more details, see the About page in the app or contact the maintainers.
