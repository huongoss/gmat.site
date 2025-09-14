# GMAT Practice App Client

This is the client-side application for the GMAT Practice App, built with React and TypeScript. The application provides users with a platform to practice for the GMAT test, manage their accounts, and review their performance.

## Features

- **User Registration and Account Management**: Users can register for an account, manage their subscriptions, and track their practice results.
- **Trial Test**: Unregistered users can take a trial test consisting of 10 questions to experience the platform before subscribing.
- **GMAT Test Simulation**: The application simulates the GMAT test interface, allowing users to answer questions and check their results at the end.
- **Question Bank**: Questions are fetched from a database, ensuring a diverse and comprehensive practice experience.
- **Emotional Feedback**: Users receive motivational feedback based on their answers to encourage continued practice and improvement.

## Project Structure

- `src/`: Contains the source code for the application.
  - `pages/`: Contains the different pages of the application (Home, Test, Review, Account).
  - `components/`: Contains reusable components (Navbar, Footer, QuestionCard, Timer, ResultSummary, EmotionFeedback).
  - `context/`: Contains the authentication context for managing user sessions.
  - `hooks/`: Custom hooks for managing authentication logic.
  - `services/`: API and local storage service functions.
  - `router/`: Routing configuration for the application.
  - `styles/`: Global styles for the application.
  - `types/`: TypeScript types and interfaces.
  - `constants/`: Application-wide constants.

## Getting Started

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd gmat-practice-app/client
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Run the application**:
   ```
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000` to view the application.

## Deployment

This application is designed to be easily deployable on Google Cloud Run. Ensure that you have the necessary configurations set up in the `infra` directory for deployment.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.