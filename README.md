# 📦 Aptos Time Capsule

## 🏆 Project Title
**Aptos Time Capsule – Time-Locked Digital Messages on the Blockchain**

---

## 👥 Team Information

**Team Name:** BlockTime Innovators  

**Team Members:**
| Name              | Email                       | LinkedIn                                         |
|-------------------|-----------------------------|--------------------------------------------------|
|J. Harshitha       | jillaharshitha73@gmail.com  | https://www.linkedin.com/in/jilla-harshitha-057972294/  |
|K.S.K.Sowmya       | sowmyakanukollu3@gmail.com  | https://www.linkedin.com/in/sowmya-kanukollu-13604725b/ |
|K.Meghana          | meghanaksr@gmail.com        | https://www.linkedin.com/in/meghana-kuncham-a135b128b/  |

---

## 📜 Project Description

**Aptos Time Capsule** is a decentralized application (dApp) that allows users to create and store time-locked messages or data on the **Aptos blockchain** using **Move smart contracts**.

Users can:
- Create a **capsule** with a message, hash, or URI.
- Set an **unlock date/time** for when the capsule becomes accessible.
- Store capsule data **securely on-chain** or **off-chain** (IPFS/Arweave) with on-chain verification.
- Reveal the capsule only after the set unlock time.

**Key Features:**
- Blockchain-based **time lock** enforcement
- **Wallet integration** for secure authentication
- **Move contract** guarantees immutability and transparency
- Option for **public or private reveal**
- Minimal on-chain storage using content hashes

---

## ⚙️ Smart Contract Details

**Contract Name:** `TimeCapsule`  
**Language:** Move  
**Network:** Aptos Devnet / Testnet / Mainnet (configurable)

**Core Functions:**
1. **`create_capsule(unlock_time, payload_kind, data)`**
   - Creates a capsule with:
     - `unlock_time`: UNIX timestamp
     - `payload_kind`: 0 = plaintext, 1 = hash, 2 = URI
     - `data`: message bytes, hash bytes, or URI bytes
   - Rejects creation if `unlock_time <= now`

2. **`reveal_capsule(id, maybe_data)`**
   - Reveals capsule if `now >= unlock_time`
   - If `payload_kind == Hash`, verifies hash before reveal

3. **`get_capsule(id)`**
   - Returns capsule metadata and state

**Data Stored:**
- Creator address
- Creation time
- Unlock time
- Payload type
- Payload data (or hash/URI)
- Reveal status

---

## 📂 Project Structure

```plaintext
aptos-time-capsule/
├─ app/              # Next.js frontend routes & layouts
├─ components/       # Reusable UI components
├─ contexts/         # React global state (wallet, settings, capsules)
├─ hooks/            # Custom React hooks for blockchain calls
├─ lib/              # Utilities and Aptos client logic
├─ public/           # Static assets (logo, icons, images)
├─ scripts/          # Deployment & automation scripts
├─ sources/          # Move smart contracts (source code)
├─ styles/           # CSS / Tailwind styles
├─ tests/            # Unit & integration tests
├─ Move.toml         # Move package config
└─ README.md         # This file





