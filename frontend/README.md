# DAO Frontend

A modern React frontend for a Decentralized Autonomous Organization (DAO) with MetaMask wallet integration and a beautiful green-themed design.

## Features

- 🏠 **Homepage**: Beautiful presentation page with hero section, features, stats, and call-to-action
- 🏛️ **DAO Page**: Complete governance interface with proposals, members, and treasury management
- 🔗 **MetaMask Integration**: Connect and disconnect wallet functionality
- 🎨 **Green Theme**: Consistent green color scheme throughout the application
- 📱 **Responsive Design**: Mobile-friendly interface that works on all devices
- 🗳️ **Voting Interface**: Interactive proposal voting system
- 👥 **Member Management**: View community members and their token holdings
- 💰 **Treasury Overview**: Track treasury funds and recent transactions

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- MetaMask browser extension

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd DAO_Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Project Structure

```
src/
├── components/
│   ├── Homepage.js          # Main landing page
│   ├── Homepage.css         # Homepage styles
│   ├── DAOPage.js           # DAO governance page
│   ├── DAOPage.css          # DAO page styles
│   ├── Navbar.js            # Navigation component
│   └── Navbar.css           # Navbar styles
├── App.js                   # Main app component with routing
├── App.css                  # Global styles and theme
├── index.js                 # App entry point
└── index.css                # Base styles
```

## Features Overview

### Homepage
- Hero section with compelling call-to-action
- Feature cards highlighting DAO benefits
- Statistics section showing community metrics
- Responsive design with smooth animations

### DAO Page
- **Proposals Tab**: View and vote on governance proposals
- **Members Tab**: Browse community members and their contributions
- **Treasury Tab**: Monitor treasury funds and transactions

### Wallet Integration
- MetaMask connection with account display
- Wallet status indicators
- Secure transaction handling

## Color Scheme

The application uses a consistent green color palette:
- Primary Green: `#22c55e`
- Dark Green: `#16a34a`
- Light Green: `#86efac`
- Background Green: `#f0fdf4`

## Available Scripts

- `npm start`: Runs the app in development mode
- `npm build`: Builds the app for production
- `npm test`: Launches the test runner
- `npm eject`: Ejects from Create React App (one-way operation)

## Technologies Used

- React 18
- React Router DOM
- CSS3 with CSS Variables
- MetaMask/Ethereum integration
- Responsive design principles

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
