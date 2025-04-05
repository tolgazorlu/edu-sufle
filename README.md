# Sufle

Sufle is a roadmap generator and task manager for learners who want to create a unique education path for their life. The platform integrates blockchain technology to incentivize learning and knowledge sharing.

## Overview

When users want to ask questions to Sufle AI, they spend EduTokens. When users complete their tasks given from Sufle and share their progress with posts that receive 5 or more likes, they get back their EduTokens.

## Technologies

- **Backend**:
  - Solidity
  - Hardhat
  - ERC20 Token Standard
  
- **Frontend**:
  - Next.js
  - TailwindCSS
  - Shadcn UI

- **AI Integration**:
  - Gemini API for creating roadmaps and personalized tasks

- **Social Features**:
  - MongoDB
  - Custom APIs for social interactions

## Smart Contracts

### SufleToken (EduToken)

The SufleToken is an ERC20 token used within the platform for:
- Spending tokens to ask questions to the AI
- Rewarding users who complete tasks and share their progress

Key features:
- Token burning when users ask questions
- Token minting when users complete tasks and get enough likes

### SufleTaskManager

Manages the creation and tracking of educational roadmaps and tasks:
- Creates personalized learning roadmaps
- Tracks task completion
- Links social posts to tasks
- Processes rewards based on social engagement

## Getting Started

### Prerequisites

- Node.js v14+
- npm or yarn
- Hardhat

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/sufle.git
cd sufle
```

2. Install dependencies
```bash
# For smart contracts
cd server
npm install

# For frontend
cd ../client
npm install
```

3. Configure environment variables
```bash
# In the server directory
cp .env.example .env
# Edit .env with your configuration
```

4. Compile smart contracts
```bash
cd server
npx hardhat compile
```

5. Run tests
```bash
npx hardhat test
```

6. Deploy contracts
```bash
npx hardhat run scripts/deploy-sufle.ts --network <your-network>
```

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.
