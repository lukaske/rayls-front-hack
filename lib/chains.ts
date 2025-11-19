import { defineChain } from "viem";

export const raylsDevnet = defineChain({
  id: 123123,
  name: "Rayls Devnet",
  network: "rayls-devnet",
  nativeCurrency: {
    decimals: 18,
    name: "USDgas",
    symbol: "USDgas",
  },
  rpcUrls: {
    default: {
      http: ["https://devnet-rpc.rayls.com"],
    },
    public: {
      http: ["https://devnet-rpc.rayls.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Rayls Explorer",
      url: "https://devnet-explorer.rayls.com",
    },
  },
});
