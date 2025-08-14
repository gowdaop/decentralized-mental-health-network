# Sahāya liṅk Network - Decentralized Mental Health Support

[![Python Version](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/status-in%20development-orange.svg)]()

**Sahāya liṅk Network** is a decentralized, AI-powered, and privacy-first mental health support platform. It provides a secure and anonymous space for individuals to connect with peers, track their mental well-being, and find support without compromising their identity.

The project addresses the critical need for accessible mental health resources while tackling the stigma and privacy concerns that often prevent people from seeking help. By leveraging blockchain for anonymity and AI for intelligent support, we aim to create a truly user-centric mental health ecosystem.

---

## ✨ Core Features

The platform is built on a set of powerful, interconnected features designed to provide comprehensive support.

### 🔐 Privacy & Anonymity
- **Blockchain-Based Identity**: Users are identified by a cryptographic `commitment` hash, not personal data. No email, name, or phone number is required.
- **Zero-Knowledge Principle**: The platform is designed to store no personally identifiable information (PII), ensuring complete user anonymity.
- **Secure Authentication**: User sessions are managed via JWT, linked only to their anonymous commitment.

### 🤖 AI-Powered Peer Matching
- **Compatibility Scoring**: An intelligent algorithm matches users based on shared topics, severity levels, age range, and preferred support times.
- **Criteria-Based Search**: Users can actively search for peers based on specific, anonymous criteria to find the right support partner.
- **Anonymous Connection Requests**: Send and receive connection requests with a custom message to initiate a peer support relationship securely.

### 🧠 AI-Driven Mood Analytics & Crisis Detection
- **Intelligent Mood Tracking**: Log mood scores, descriptions, triggers, and notes.
- **Real-time Crisis Detection**: An AI service analyzes mood entry text in real-time to identify potential crises using NLP and sentiment analysis.
- **Immediate Support**: For high-risk entries, the system automatically provides a list of localized crisis helplines (currently focused on India).
- **Personalized Trend Analysis**: Users receive a comprehensive analysis of their mood trends, patterns, and volatility over time to gain deeper self-awareness.
- **Anonymized Community Insights**: View aggregated, anonymous mood trends from the entire community to feel less alone in your journey.

### 💬 Anonymous Peer Support Sessions
- **Session Creation**: Users can create and host anonymous peer support sessions on specific topics.
- **Session Discovery**: Browse and join available sessions that match your needs.
- **Group & Individual Formats**: The platform is designed to support various session types, including group discussions, one-on-one chats, and workshops.

### ⭐ Reputation & Incentive System
- **Blockchain-Secured Reputation**: A reputation score is tied to each user's anonymous commitment, rewarding positive and consistent engagement.
- **Token-Based Rewards (Upcoming)**: The architecture includes a `TokenAutomationService` to reward users with platform tokens for constructive actions like consistent mood logging, providing quality peer support, and helping in crisis situations.

---

## 🛠️ Technology Stack

| Component             | Technology                                                              |
| --------------------- | ----------------------------------------------------------------------- |
| **Backend**           | Python, FastAPI                                                         |
| **Database**          | SQLAlchemy, SQLite (for development)                                    |
| **Blockchain**        | Web3.py, Solidity (Smart Contracts), Ganache (Local Development)        |
| **AI & Data Science** | NLTK, TextBlob, Pandas, NumPy                                           |
| **Authentication**    | JWT (JSON Web Tokens)                                                   |
| **API Documentation** | OpenAPI (Swagger UI), ReDoc                                             |
| **Containerization**  | Docker (recommended for deployment)                                     |

---

## 🏗️ Architecture Overview

The system is built with a modern, decoupled architecture:

1.  **Frontend (Not in this repo)**: A web or mobile client interacts with the FastAPI backend via a RESTful API.
2.  **FastAPI Backend**: The core of the application. It handles API requests, business logic, and orchestrates communication between other services.
3.  **Database**: A relational database (managed by SQLAlchemy) stores anonymous user data, mood entries, sessions, and connection requests.
4.  **AI Services**: A suite of Python services for:
    - `CrisisDetector`: Analyzes text for risk.
    - `MoodAnalyzer`: Provides trend analysis.
    - `PeerService`: Powers the peer-matching algorithm.
5.  **Blockchain Service**:
    - Interacts with the `UserRegistry` smart contract to anchor user commitments.
    - Manages the `TokenSystem` smart contract for reputation and rewards.

---

## 🚀 Getting Started

Follow these steps to get the backend running locally.

### Prerequisites

- Python 3.9+
- Ganache or another local Ethereum blockchain instance.
- `pip` and `venv`

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/decentralized-mental-health-network.git
cd decentralized-mental-health-network/backend
```

### 2. Set Up a Virtual Environment

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows, use `.venv\Scripts\activate`
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
python -m nltk.downloader vader_lexicon punkt
```

### 4. Configure Environment Variables

Create a `.env` file in the `backend` directory by copying the example:

```bash
cp .env.example .env
```

Open the `.env` file and update it with:
- Your Ganache RPC server URL (`WEB3_PROVIDER_URL`).
- The private key of a funded account from your Ganache instance (`PRIVATE_KEY`).
- The deployed addresses of the `UserRegistry` and `TokenSystem` smart contracts.

### 5. Deploy Smart Contracts

You will need to compile and deploy the Solidity smart contracts (located in `backend/app/blockchain/contracts`) to your local Ganache instance. Use tools like Truffle or Hardhat for this. After deployment, update your `.env` file with the contract addresses.

### 6. Initialize the Database

The application uses SQLAlchemy to manage the database. The tables are created automatically on startup. You can test the models directly:

```bash
python test_models.py
```

### 7. Run the Backend Server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.

### 8. API Documentation

- **Swagger UI**: `http://localhost:8000/api/v1/docs`
- **ReDoc**: `http://localhost:8000/api/v1/redoc`

---

## 🧪 Testing

The project includes a set of tests to ensure the core components are working correctly.

1.  **Test Blockchain Connection**:
    ```bash
    python test_blockchain.py
    ```

2.  **Run Integration Tests**:
    Ensure the backend server is running, then execute:
    ```bash
    python run_all_tests.py
    ```

---

## 🗺️ Roadmap & Upcoming Features

- **Full Tokenomics Implementation**: Activate the token reward system to incentivize positive user behavior.
- **Real-time Communication**: Implement WebSocket-based chat for peer support sessions.
- **Advanced AI Models**: Upgrade from NLP heuristics to more advanced transformer-based models (e.g., BERT) for more nuanced crisis detection and sentiment analysis.
- **Federated Learning**: Explore federated learning to train AI models on user data without it ever leaving their device, further enhancing privacy.
- **Mobile Application**: Develop a dedicated mobile app for a better user experience.
- **Expanded Crisis Resources**: Add crisis helpline information for more countries and regions.
- **Professional Support Gateway**: Create an optional, privacy-preserving gateway for users to connect with licensed mental health professionals.

---

## 🤝 Contributing

Contributions are welcome! If you'd like to help improve the Sahāya liṅk Network, please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes and commit them (`git commit -m 'Add some feature'`).
4.  Push to the branch (`git push origin feature/your-feature-name`).
5.  Open a Pull Request.

Please make sure to update tests as appropriate.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.