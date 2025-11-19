# Rayls KYC Platform

A Next.js-based KYC verification platform using Reclaim Protocol for zero-knowledge proof verification and NFT-based credentials on Rayls Network testnet.

## Features

- 🔐 **Dynamic Wallet Integration** - Seamless wallet connection with Dynamic
- ✅ **KYC Verification** - Verify identity using Reclaim Protocol with Coinbase and Binance
- 🎫 **NFT Credentials** - Receive NFT credentials upon successful verification
- 💎 **3D NFT Display** - Beautiful passport-style NFT cards with glow effects
- 🏦 **KYC-Gated Vault** - Demo vault that requires KYC NFT for deposits
- 🎨 **Modern UI** - Built with Shadcn UI components and Tailwind CSS

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Wallet**: Dynamic Wallet
- **Blockchain**: Rayls Network Testnet
- **Web3**: Wagmi + Viem
- **Animations**: Framer Motion
- **KYC**: Reclaim Protocol

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd rayls-front
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Update `.env.local` with your configuration:
- `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` - Your Dynamic wallet environment ID
- Contract addresses for NFT and Vault contracts
- Reclaim Protocol app ID

4. Update chain configuration:
Edit `lib/chains.ts` with the correct Rayls Network testnet details:
- Chain ID
- RPC URL
- Block explorer URL

5. Update contract addresses:
Edit `lib/contracts.ts` with your deployed contract addresses

6. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
rayls-front/
├── app/
│   ├── api/
│   │   └── verify-callback/    # Reclaim Protocol callback handler
│   ├── dashboard/               # Tier 1 KYC Dashboard
│   ├── demo/                    # Vault deposit demo
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Global styles
├── components/
│   ├── providers/
│   │   └── dynamic-provider.tsx # Dynamic wallet provider
│   ├── ui/                      # Shadcn UI components
│   ├── navbar.tsx               # Navigation bar
│   └── nft-card.tsx             # NFT display component
├── lib/
│   ├── chains.ts                # Rayls Network configuration
│   ├── contracts.ts             # Contract ABIs and addresses
│   ├── reclaim.ts               # Reclaim Protocol integration
│   └── utils.ts                 # Utility functions
└── package.json
```

## User Flow

1. **Landing Page** - Users land on the homepage
2. **Connect Wallet** - Users connect using Dynamic wallet in the navbar
3. **Tier 1 KYC Dashboard** - View available KYC verification collections
4. **Verify** - Click "Verify Now" to initiate Reclaim Protocol verification
5. **Receive NFT** - Upon successful verification, receive KYC NFT
6. **View NFTs** - See verified NFTs with beautiful 3D passport-style cards
7. **Demo** - Use the demo vault to deposit ETH (requires KYC NFT)

## Verification Methods

Currently supported:
- **Coinbase KYC** - Verify using Coinbase credentials
- **Binance KYC** - Verify using Binance credentials

The system is designed to be extensible for additional verification methods.

## Demo Flow

1. Navigate to the Demo page
2. Attempt to deposit ETH (will fail without KYC NFT)
3. Go to the Tier 1 KYC Dashboard and verify identity
4. Return to Demo page
5. Successfully deposit ETH with KYC NFT

## Contract Integration

The platform interacts with two main contracts:

1. **NFT Contract** - Mints KYC NFTs upon successful verification
2. **Vault Contract** - Checks for KYC NFT ownership before allowing deposits

Update contract addresses in `lib/contracts.ts` and ensure ABIs match your deployed contracts.

## Reclaim Protocol Integration

The platform uses Reclaim Protocol for zero-knowledge proof verification. Update the integration in `lib/reclaim.ts` with your Reclaim Protocol SDK configuration.

## Development

```bash
# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

## License

MIT

