import React from "react"
import { Separator } from "@/components/ui/separator"

const AboutPage = () => (
  <div className="container mx-auto p-6 max-w-3xl">
    <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">About Soltrail</h1>
    <Separator className="mb-6" />
    <p className="text-lg mb-8 text-muted-foreground">
      <strong>Soltrail</strong> is a powerful, open-source analytics and visualization platform for Solana blockchain transactions. It enables users, researchers, and analysts to trace, cluster, and label wallet activity, providing deep insights into the flow of funds, wallet behavior, and network patterns on Solana.
    </p>

    <h2 className="text-2xl font-bold mt-10 mb-3 text-blue-700 dark:text-blue-400">Key Features</h2>
    <ul className="list-disc pl-6 space-y-2 mb-8">
      <li><span className="font-semibold">Transaction Flow Visualization:</span> Visualize the movement of funds between Solana wallets, tokens, and programs. Enter a wallet address or domain to see an interactive graph of its transaction history.</li>
      <li><span className="font-semibold">Transaction Clustering:</span> Identify and visualize clusters of related transactions or wallets using advanced analytics.</li>
      <li><span className="font-semibold">Entity Labeling:</span> Annotate wallets with labels (e.g., exchange, known entity, scam) to enhance analysis and reporting.</li>
      <li><span className="font-semibold">Wallet Analysis:</span> Analyze funding sources, activity patterns, and key metrics for any wallet, including funding timelines and anomaly detection.</li>
    </ul>

    <h2 className="text-2xl font-bold mt-10 mb-3 text-blue-700 dark:text-blue-400">Technical Architecture</h2>
    <ul className="list-disc pl-6 space-y-2 mb-8">
      <li><span className="font-semibold">Backend API:</span> Fetches Solana transaction data using the Helius API. Endpoints include <code className="bg-muted px-1 rounded">/api/transactions</code> and <code className="bg-muted px-1 rounded">/api/flow-data/[address]</code>.</li>
      <li><span className="font-semibold">Data Processing:</span> Core utilities convert transaction history to graph structures, analyze funding origins, detect wallet activity patterns, and cluster transactions.</li>
      <li><span className="font-semibold">Frontend:</span> Built with React and Next.js, featuring responsive UI components and web workers for efficient analytics.</li>
      <li><span className="font-semibold">Type Safety:</span> All data models are strongly typed with TypeScript.</li>
    </ul>

    <h2 className="text-2xl font-bold mt-10 mb-3 text-blue-700 dark:text-blue-400">Usage Scenarios</h2>
    <ul className="list-disc pl-6 space-y-2 mb-8">
      <li>Trace illicit funds, analyze DeFi activity, or study wallet behavior at scale.</li>
      <li>Detect suspicious patterns, label scam wallets, and monitor exchange flows.</li>
      <li>Integrate analytics and visualizations into custom Solana tools or dashboards.</li>
    </ul>

    <h2 className="text-2xl font-bold mt-10 mb-3 text-blue-700 dark:text-blue-400">Example Workflow</h2>
    <ol className="list-decimal pl-6 space-y-2 mb-8">
      <li>Enter a wallet address on the home page to visualize its transaction flow.</li>
      <li>Explore transaction clusters to identify related wallets or coordinated activity.</li>
      <li>Annotate wallets with known labels for easier tracking and reporting.</li>
      <li>Analyze funding sources, activity timelines, and key metrics for any wallet.</li>
    </ol>

    <h2 className="text-2xl font-bold mt-10 mb-3 text-blue-700 dark:text-blue-400">Security & Privacy</h2>
    <ul className="list-disc pl-6 space-y-2 mb-8">
      <li>API keys are stored in environment variables and never exposed to the client.</li>
      <li>Only public blockchain data is processed; no private keys or sensitive user data are handled.</li>
    </ul>

    <h2 className="text-2xl font-bold mt-10 mb-3 text-blue-700 dark:text-blue-400">Extensibility</h2>
    <ul className="list-disc pl-6 space-y-2 mb-8">
      <li>Modular design allows for easy extension with new analytics, visualizations, or data sources.</li>
      <li>Open source and welcoming to contributions.</li>
    </ul>

    <h2 className="text-2xl font-bold mt-10 mb-3 text-blue-700 dark:text-blue-400">Environment Variables</h2>
    <ul className="list-disc pl-6 space-y-2 mb-8">
      <li><code className="bg-muted px-1 rounded">HELIUS_API_KEY</code> (required): Helius API key for Solana data queries.</li>
      <li><code className="bg-muted px-1 rounded">BLOCKSEC_API_KEY</code> (optional): BlockSec API key for advanced analytics.</li>
    </ul>

    <h2 className="text-2xl font-bold mt-10 mb-3 text-blue-700 dark:text-blue-400">Learn More</h2>
    <p className="mb-2">See the <a href="/README.md" className="underline text-blue-600 dark:text-blue-400">README</a> for setup and contribution guidelines. For questions or contributions, open an issue or pull request on GitHub.</p>
  </div>
)

export default AboutPage