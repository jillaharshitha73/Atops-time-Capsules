# Aptos Time Capsule Deployment Guide

## Prerequisites
- Install Aptos CLI: `curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3`
- Create an Aptos account: `aptos init`

## Deploy the Move Contract

1. Navigate to the contracts directory:
   \`\`\`bash
   cd contracts
   \`\`\`

2. Compile the contract:
   \`\`\`bash
   aptos move compile
   \`\`\`

3. Deploy to testnet:
   \`\`\`bash
   aptos move publish --profile testnet
   \`\`\`

4. Copy the contract address from the deployment output

5. Update your environment variables:
   \`\`\`bash
   # Add to .env.local
   NEXT_PUBLIC_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
   \`\`\`

## Testing
- Use Aptos testnet faucet to get test APT: https://aptoslabs.com/testnet-faucet
- Connect with Petra wallet on testnet
- Create and manage time capsules

## Production Deployment
- Deploy to mainnet using `--profile mainnet`
- Update contract address in production environment

## Troubleshooting
- If you see "module not found" errors, ensure the contract is deployed and the address is correct
- Make sure your wallet is connected to the same network as your contract deployment
- Check that NEXT_PUBLIC_CONTRACT_ADDRESS is set correctly
