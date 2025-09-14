# GMAT Practice App - Server

This is the backend server for the GMAT Practice App, which provides users with a platform to practice GMAT tests, manage their accounts, and track their progress.

## Features

- **User Authentication**: Users can register, log in, and manage their accounts.
- **Test Simulation**: Users can take GMAT practice tests with questions fetched from the database.
- **Result Tracking**: Registered users can view their practice results and review their answers.
- **Trial Test**: Unregistered users can take a trial test consisting of 10 questions.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- TypeScript
- A database (e.g., MongoDB, PostgreSQL)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/gmat-practice-app.git
   cd gmat-practice-app/server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your database and update the environment variables in `.env` file.

### Running the Server

To start the server, run:
```
npm run start
```

### API Endpoints

- **Authentication**
  - `POST /api/auth/register`: Register a new user.
  - `POST /api/auth/login`: Log in an existing user.

- **Tests**
  - `GET /api/tests`: Fetch available test questions.
  - `POST /api/tests/submit`: Submit answers for grading.

- **Results**
  - `GET /api/results`: Fetch user results.
  - `POST /api/results`: Save user results.

## Deployment

This application can be deployed on Google Cloud Run. Refer to the `infra/cloudrun/service.yaml` for deployment configuration.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.