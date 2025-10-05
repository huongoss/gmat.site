# GMAT Practice App - Server

This is the backend server for the GMAT Practice App, which provides users with a platform to practice GMAT tests, manage their accounts, and track their progress.

## Features

- **User Authentication**: Users can register, log in, and manage their accounts.
- **Test Simulation**: Users can take GMAT practice tests with questions fetched from the database.
- **Result Tracking**: Registered users can view their practice results and review their answers.
 - **Trial Test**: Unregistered users can take a trial test consisting of 10 questions.
 - **Realtime Voice (Beta)**: Authenticated users can start a realtime AI voice session (Option A – WebRTC to OpenAI) via `/api/voice/session`.

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
 
   - **Voice (Beta)**
     - `POST /api/voice/session`: Create an ephemeral realtime session token (requires auth). Use returned `client_secret.value` to establish a WebRTC connection directly with OpenAI's Realtime API.

  ### Voice Module (Option A – Realtime)

  The voice feature is architected as a self‑contained module in `src/modules/voice/`:

  1. `service.ts` – creates ephemeral session tokens via OpenAI Realtime API using server `OPENAI_API_KEY` (never exposed to clients).
  2. Route `routes/voice.ts` – minimal REST surface returning only the short‑lived `client_secret` and metadata.

  Client usage (simplified):
  1. Call `POST /api/voice/session` to obtain `client_secret.value`.
  2. Open a WebSocket / WebRTC session to `wss://api.openai.com/v1/realtime?model=...` sending an auth message with the ephemeral key (handled inside the provided hook).
  3. Stream microphone audio; receive synthesized audio + transcript events.

  Environment variables:
  ```
  OPENAI_API_KEY=sk-... (server only)
  VOICE_MODEL=gpt-4o-realtime-preview    # optional override
  VOICE_DEFAULT_VOICE=alloy              # optional override
  ```

  Security notes:
  - Ephemeral key lifetime is short (~1 minute); obtain just‑in‑time.
  - Do not log the `client_secret.value` server side; only length if needed.
  - Add subscription / plan gating inside `VoiceRealtimeService.authorize()` as required.


## Deployment

This application can be deployed on Google Cloud Run. Refer to the `infra/cloudrun/service.yaml` for deployment configuration.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.