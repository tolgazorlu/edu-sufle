# <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Graduation%20Cap.png" alt="Graduation Cap" width="30" /> Sufle

<div align="center">
  
  ![License](https://img.shields.io/badge/license-MIT-blue)
  ![Version](https://img.shields.io/badge/version-1.0.0-green)
  
  <h3>A blockchain-powered educational roadmap generator and task manager</h3>
  
  <p>Create personalized learning paths, complete tasks, and earn rewards in a decentralized ecosystem.</p>
</div>

## 🌟 Overview

Sufle empowers learners to create unique educational journeys tailored to their goals and interests. The platform integrates blockchain technology to incentivize learning and knowledge sharing through a token-based economy.

### How It Works

- 🧠 Users spend EduTokens to ask questions to Sufle AI
- ✅ Complete assigned tasks and share progress through posts
- 👍 Gain 5+ likes on progress posts to earn back EduTokens
- 📚 Build personalized learning roadmaps with AI assistance

## 🛠️ Technology Stack

<table>
  <tr>
    <td><strong>🔗 Blockchain & Smart Contracts</strong></td>
    <td>
      • Solidity<br/>
      • Hardhat<br/>
      • ERC20 Token Standard
    </td>
  </tr>
  <tr>
    <td><strong>🖥️ Frontend</strong></td>
    <td>
      • Next.js<br/>
      • TailwindCSS<br/>
      • Shadcn UI
    </td>
  </tr>
  <tr>
    <td><strong>🤖 AI Integration</strong></td>
    <td>
      • Gemini API for roadmap generation<br/>
      • Personalized task creation
    </td>
  </tr>
  <tr>
    <td><strong>🔄 Backend & Social</strong></td>
    <td>
      • MongoDB<br/>
      • Custom APIs for social interactions
    </td>
  </tr>
</table>

## 💰 Token Economy

### 🪙 SufleToken (EduToken)

The native ERC20 token powering our educational ecosystem:

- **Token Expenditure:** Spent when users consult Sufle AI for guidance
- **Token Rewards:** Earned when completing tasks and receiving community validation
- **Token Mechanisms:**
  - Burning occurs when tokens are spent on AI consultations
  - Minting happens when sufficient social validation is received on learning progress

## 📋 Smart Contract Architecture

### SufleTaskManager

Our core contract managing the educational infrastructure:

- 🛣️ Creates and manages personalized learning roadmaps
- ✓ Tracks task completion status for users
- 🔗 Links social posts to completed tasks for verification
- 💸 Processes token rewards based on community engagement

## 📝 Survey System

Sufle includes a comprehensive survey system for personalized learning:

1. 🆕 First-time users complete a preference survey
2. 🧩 Survey responses shape personalized learning recommendations
3. 🔄 Survey completion status stored on-chain for future reference

### Implementation Details

- **Blockchain Integration:** Survey status tracked via SufleTaskManager contract
- **User Experience:** Seamless redirection based on completion status
- **Personalization:** Survey responses directly influence learning suggestions

## 🚀 Getting Started

### Prerequisites

- Node.js v14 or higher
- npm or yarn package manager
- Hardhat development environment

### Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/sufle.git
cd sufle
```

2. **Install dependencies**
```bash
# For smart contracts
cd server
npm install

# For frontend
cd ../client
npm install
```

3. **Environment configuration**
```bash
# In the server directory
cp .env.example .env
# Edit .env with your configuration
```

4. **Compile smart contracts**
```bash
cd server
npx hardhat compile
```

5. **Run test suite**
```bash
npx hardhat test
```

6. **Deploy to network**
```bash
npx hardhat run scripts/deploy-sufle.ts --network <your-network>
```

### Environment Variables

Required environment variables in `.env.local`:
```
RPC_URL=<blockchain-rpc-url>
TASK_MANAGER_CONTRACT_ADDRESS=<contract-address>
PRIVATE_KEY=<contract-owner-private-key>
```

## 📚 Key Features

- **🔮 AI-Powered Roadmaps:** Generate personalized learning paths
- **🏆 Gamified Learning:** Earn tokens for completing educational goals
- **🤝 Social Validation:** Community feedback validates learning progress
- **🌐 Decentralized Knowledge Economy:** Blockchain-based incentives for education

## 📄 License

This project is licensed under the MIT License - see the LICENSE.md file for details.

## 🔗 Links

- [Project Website](#)
- [Documentation](#)
- [Community Forum](#)
- [Demo](#)

---

<div align="center">
  <p>Made with ❤️ for lifelong learners</p>
</div>
