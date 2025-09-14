# GMAT Practice App

Welcome to the GMAT Practice App! This application is designed to help users prepare for the GMAT test through a comprehensive practice platform. 

## Features

- **User Account Management**: Users can register, log in, and manage their accounts. Registered users can track their practice results and review their question history.
- **Trial Test**: Unregistered users can take a trial test consisting of 10 questions. After completing the trial, they will be prompted to register for full access.
- **Subscription Model**: Users can subscribe for $10/month to access unlimited practice tests and features.
- **Realistic Test Simulation**: The test page simulates the GMAT test experience, providing a timer and answer checking at the end.
- **Question Bank**: Questions are fetched from a database, ensuring a diverse and extensive question pool. A static JSON file is provided for the demo trial test.
- **Emotional Feedback**: After checking answers, users receive motivational feedback to encourage continued practice and improvement.
- **Professional Interface**: The application features a clean, academic design that is easy to navigate.

## Getting Started

### Prerequisites

- Node.js
- Yarn
- Docker (for deployment)

### Installation

From the repository root:

```
yarn install
```

This installs dependencies for both client and server via Yarn workspaces.

### Running the Application

You can run both server and client together from the root:

```
yarn dev
```

Or run them separately:

```
yarn server:dev
# in another terminal
yarn client:dev
```

- Client: http://localhost:3000
- Server API: http://localhost:8080

### Deployment

To deploy the application on Google Cloud Run, follow these steps:

1. Build the Docker image:
   ```
   cd infra
   docker build -t gmat-practice-app .
   ```

2. Deploy to Google Cloud Run:
   ```
   gcloud run deploy gmat-practice-app --image gmat-practice-app --platform managed
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the need for effective GMAT preparation tools.
- Thanks to all contributors and users for their feedback and support. 

We hope you enjoy using the GMAT Practice App and wish you the best of luck in your GMAT preparation!