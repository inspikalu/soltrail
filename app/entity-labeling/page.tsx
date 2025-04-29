import { AddressLabelLookup } from "@/components/address-label-lookup"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function EntityLabelingPage() {
  return (
    <div className="container mx-auto p-4 flex flex-col min-h-[calc(100vh-3.5rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Entity and Risk Analysis
        </h1>
        <p className="text-muted-foreground">
          Analyze Solana addresses to identify entities, detect suspicious patterns, and assess risk levels.
        </p>
      </div>

      <Tabs defaultValue="analyze" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="analyze">Analyze Wallet</TabsTrigger>
          <TabsTrigger value="about">About This Tool</TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-6">
          <AddressLabelLookup />
        </TabsContent>

        <TabsContent value="about">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Entity Labeling</CardTitle>
                <CardDescription>Identify known entities on the blockchain</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our entity labeling system uses BlockSec's AML API to identify known entities on the Solana
                  blockchain. This helps you understand who you're interacting with and whether they're legitimate
                  businesses, exchanges, or potentially suspicious actors.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="bg-muted p-3 rounded-lg">
                    <h4 className="font-medium text-sm">Exchanges</h4>
                    <p className="text-xs text-muted-foreground">Identify major cryptocurrency exchanges</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <h4 className="font-medium text-sm">DeFi Protocols</h4>
                    <p className="text-xs text-muted-foreground">Recognize decentralized finance applications</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <h4 className="font-medium text-sm">NFT Marketplaces</h4>
                    <p className="text-xs text-muted-foreground">Detect NFT trading platforms</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <h4 className="font-medium text-sm">High-Risk Entities</h4>
                    <p className="text-xs text-muted-foreground">Flag potentially suspicious services</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pattern Detection</CardTitle>
                <CardDescription>Identify suspicious activity patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our pattern detection system analyzes transaction history to identify potentially suspicious behaviors
                  that might indicate risk. This helps you make more informed decisions about interacting with specific
                  addresses.
                </p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="bg-amber-100 text-amber-700 p-1 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-coins"
                      >
                        <circle cx="8" cy="8" r="6" />
                        <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
                        <path d="M7 6h1v4" />
                        <path d="m16.71 13.88.7.71-2.82 2.82" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Many Small Inputs</h4>
                      <p className="text-xs text-muted-foreground">Detects patterns of numerous small deposits</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="bg-amber-100 text-amber-700 p-1 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-trending-down"
                      >
                        <path d="m22 17-8.5-8.5-5 5L2 7" />
                        <path d="M16 17h6v-6" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Sudden Token Dumps</h4>
                      <p className="text-xs text-muted-foreground">Identifies rapid selling of large token amounts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="bg-amber-100 text-amber-700 p-1 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-building"
                      >
                        <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                        <path d="M9 22v-4h6v4" />
                        <path d="M8 6h.01" />
                        <path d="M16 6h.01" />
                        <path d="M12 6h.01" />
                        <path d="M12 10h.01" />
                        <path d="M12 14h.01" />
                        <path d="M16 10h.01" />
                        <path d="M16 14h.01" />
                        <path d="M8 10h.01" />
                        <path d="M8 14h.01" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Exchange-like Behavior</h4>
                      <p className="text-xs text-muted-foreground">Detects wallets operating like exchanges</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
