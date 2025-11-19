"use client";

import { DynamicContextProvider as DynamicProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { raylsDevnet } from "@/lib/chains";
import { useState } from "react";

const evmNetworks = [
  {
    blockExplorerUrls: ['https://devnet-explorer.rayls.com/'],
    chainId: 123123,
    chainName: 'Rayls Devnet',
    iconUrls: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAxlBMVEVHcEwREREREREREREREREREREREREREREREREREREJCgYAAAANDQ4DAwxTU1GIh4h3d3dubm4aGRqcnJrGxM2sq63b3MopJy0PDw8vMR29vab69vlZU2z//7jIzJgzLkPv9aAAAAxRVRv6/4eyuWKstjzO2Fnr92H2/2mXny7y/0zv/Uvu/T2qrXiptCLz/z7l9DzTwf+BcazJ1jbU4TlyeSMVDDLBqv7Isv9xY5pNQ2pfU4SrlO67oP+ciNW1m/+PesmBbraML3R6AAAACnRSTlMABH3A4/T7/3xRiHk/zAAAAStJREFUeAF90wWWg0AQRdFGK8OPu7u7u+5/U0NXchqiL4JcXISbphumZZPKtkwjoAnujz7298NYNfqaJgJq3IEs6KEuDHoUCkci0Vg4DsAhzhCmb81wIplIpdOJDLLkZgqLvACkksjlC3lWS9jkL4twoYhwqQx5vsJPrMVCJVeqSqQ7Zmt4VMvV09VGo/lAtlab63S6XBtZhbVef+DWv/8POyNpCseTITeZTKbj/GwO8jAYX0yn0+Wi1VvlsJ7NigpZa1yoBlQ22y2yHjIHHQdAZr7dbHcgPzqIxyv7w/y42Zw2ZzaFTuZy4i6Xy+mKrEJ5+XCTs2WnY9EzW1gSDy7KFa9FgFSWMIn1Nt8dKmBSmY+bDZlDzxlCp68Ffj5gvx7N3w/1t9dB11z4B2dbLoflJxSfAAAAAElFTkSuQmCC'],
    name: 'Rayls Devnet',
    nativeCurrency: {
      decimals: 18,
      name: 'Rayls',
      symbol: 'USDgas',
      iconUrl: '',
    },
    networkId: 123123,

    rpcUrls: ['https://devnet-rpc.rayls.com'],
    vanityName: 'Rayls Devnet',
  },
];

const wagmiConfig = createConfig({
  chains: [raylsDevnet],
  transports: {
    [raylsDevnet.id]: http("https://devnet-rpc.rayls.com"),
  },
});

export function DynamicContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <DynamicProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || "",
        walletConnectors: [EthereumWalletConnectors],
        overrides: { evmNetworks }
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>{children}</DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicProvider>
  );
}

