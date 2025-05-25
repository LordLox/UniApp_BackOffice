# UniApp BackOffice

This project is the backoffice management application for UniApp. It is a Create React App with a Node.js/Express backend for serving and proxying API requests.

## Project Structure

The application is dockerized for ease of deployment and development. Key components include:

* **`web` service (Frontend):**
    * Built with React, using `react-scripts` for development and build processes.
    * Serves the React application.
    * Proxies API requests to the backend API. This is handled either by `src/setupProxy.js` (for local development with `react-scripts start`) or by a custom Express server (`server.js`) or Nginx in production builds.
    * The main application logic is in `src/App.js`, which sets up routing and layout.
    * Authentication is managed via `src/contexts/AuthContext.js`.
    * Styling is done with global CSS (`src/index.css`, `src/App.css`) and Ant Design components.
* **`api` service (Backend):**
    * A .NET backend application (`ghcr.io/lordlox/uniapp_backend`).
    * Handles business logic and database interactions.
* **`db` service (Database):**
    * A MySQL 8.0 database instance.

## Environment Variables

The application uses environment variables for configuration. Key variables include:

* **For `db` service:**
    * `MYSQL_ROOT_PASSWORD`
    * `MYSQL_DATABASE`
    * `MYSQL_USER`
    * `MYSQL_PASSWORD`
* **For `api` service:**
    * `ASPNETCORE_ENVIRONMENT`
    * `ConnectionStrings__DefaultConnection` (constructs the DB connection string)
    * `Settings__AESKey`
    * `Settings__BCodeElapseSeconds`
    * `ASPNETCORE_URLS`
* **For `web` service:**
    * `APP_HOST_PORT`: Port on the host machine to map to the container's port 3000.
    * `REACT_APP_BACKEND_API_URL`: The URL of the backend API. This is used by the frontend to make API calls, either directly or via the proxy.

These variables are typically defined in a `.env` file in the project root.

## Getting Started

### Prerequisites

* Docker and Docker Compose
* Node.js and yarn (or npm) for local development outside Docker.

### Running with Docker (Recommended)

1.  **Clone the repository.**
2.  **Create a `.env` file** in the `UniApp_BackOffice` directory by copying `.env.example` (if available) or by defining the necessary environment variables (see above).
    * Ensure `REACT_APP_BACKEND_API_URL` in the `.env` file points to where the `api` service will be accessible (e.g., `http://uniapp-api:5000` when running within the Docker network, or a publicly accessible URL if the API is hosted elsewhere).
3.  **Build and run the services:**
    ```bash
    docker-compose up --build
    ```
4.  The application (web service) will be accessible at `http://localhost:<APP_HOST_PORT>` (defaulting to `http://localhost:3000` if `APP_HOST_PORT` is not set).

### Local Development (Frontend - Outside Docker)

This is useful for rapid frontend changes. The backend services (`api`, `db`) should ideally still be run via Docker.

1.  **Ensure the `api` and `db` services are running** (e.g., via `docker-compose up -d api db`).
2.  **Navigate to the `UniApp_BackOffice` directory.**
3.  **Create a `.env` file** (or modify your existing one):
    * Set `REACT_APP_BACKEND_API_URL` to the URL of the running `api` service (e.g., `http://localhost:5000` if the `api` service's port 5000 is mapped to localhost:5000, or `http://<your-docker-host-ip>:5000`). The `src/setupProxy.js` will use this for proxying.
4.  **Install dependencies:**
    ```bash
    yarn install
    ```
5.  **Run the development server:**
    ```bash
    yarn start
    ```
    This runs the app in development mode using `react-scripts start`. Open [http://localhost:3000](http://localhost:3000) to view it in your browser. The page will reload when you make changes.

## Available Scripts (from `package.json`)

In the project directory (for local development or if you `exec` into the `web` container), you can run:

* **`yarn start`**: Runs the app in development mode.
* **`yarn build`**: Builds the app for production to the `build` folder. It correctly bundles React in production mode and optimizes the build for the best performance.
* **`yarn test`**: Launches the test runner in interactive watch mode.
* **`yarn eject`**: Removes the single build dependency from your project. This is a one-way operation.

## Deployment

The `docker-compose.yaml` is configured for a production-like setup:

* The `web` service builds a Docker image using the `Dockerfile` present in the `UniApp_BackOffice` directory.
* This `Dockerfile` (not provided but inferred) likely:
    1.  Builds the React application using `yarn build`.
    2.  Sets up a web server (like Nginx or uses the provided `server.js`) to serve the static build files and handle proxying.
* If Nginx is used, the `docker-entrypoint.sh` script substitutes the `REACT_APP_BACKEND_API_URL` environment variable into the Nginx configuration template (`/etc/nginx/conf.d/default.conf.template`) to correctly proxy API requests.
* If `server.js` is used directly (e.g., if `CMD` in Dockerfile is `node server.js`), it serves static files from the `build` directory and proxies `/api` requests to `REACT_APP_BACKEND_API_URL`.

The `web` service image is specified as `ghcr.io/lordlox/uniapp_web` in the `docker-compose.yaml`, suggesting it might be pre-built and pushed to a container registry. If building locally, `docker-compose build web` would use the local `Dockerfile`.

## API Proxying

* **Development (`yarn start`):** The `src/setupProxy.js` file configures a proxy for the Webpack development server. It proxies requests from `/api` to the URL specified by `REACT_APP_BACKEND_API_URL` (defaulting to `http://localhost:5023` if not set).
* **Production (Docker with `server.js`):** If `server.js` is used as the entry point in the Docker container, it sets up an Express server that serves static files from the `build` directory and proxies requests made to `/api` on the Express server to the `REACT_APP_BACKEND_API_URL`.
* **Production (Docker with Nginx):** If Nginx is used, `docker-entrypoint.sh` configures Nginx to proxy requests. The Nginx configuration template (`default.conf.template`) would define how requests are proxied based on the `BACKEND_API_URL` (which is derived from `REACT_APP_BACKEND_API_URL`).

The API base URL used by the frontend services is `/api` as defined in `src/config.js`. This prefix is what the proxy configurations look for.

## Authentication

* Authentication is handled by `src/contexts/AuthContext.js`.
* Login involves a `Basic` authentication scheme, sending credentials to `/users/userinfo`.
* User information is then decrypted using the `/barcode/decrypt` endpoint.
* Authentication credentials and user data are stored in `localStorage` to maintain sessions.

## Key Features and Pages

The application includes several pages and features based on user roles (Admin, Professor, Student):

* **Login Page (`/login`)**: For user authentication.
* **Dashboards**:
    * Admin Dashboard (`/admin/dashboard`): Displays global statistics like user roles and event types.
    * Professor Dashboard (`/professor/dashboard`): Shows professor-specific event statistics and quick actions.
    * Student Dashboard (`/student/dashboard`): Displays the student's QR code for check-in and recent participation history.
    * Generic Dashboard (`/` or `DashboardPage`): Fallback dashboard.
* **User Management (`/users` - Admin only)**: Allows admins to create, edit, delete users, and reset passwords.
* **Event Management**:
    * Admin Events Page (`/admin/events` - Admin only): Calendar view of all events, with options to view participants.
    * My Events Page (`/my-events` - Professor only): Allows professors to create, edit, delete their events and view participations.
* **Profile**:
    * Change Password (`/profile/change-password`): Allows authenticated users to change their own password.
* **QR Code**: Students can view their QR code on their dashboard. The QR code image is fetched from `/barcode/qr`.

## Further Information

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

## Contributing

Contributions are welcome! If you'd like to contribute, please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

Please ensure your code adheres to the project's coding standards and includes tests where applicable.

## License

This project is licensed under the MIT License - see the `LICENSE.md` file for details (if applicable).