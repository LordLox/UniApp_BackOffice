# ---- Build Stage (Node.js for React build) ----
FROM node:22-alpine AS builder
LABEL stage="react-builder"

WORKDIR /app

# Copy package.json and yarn.lock (or package-lock.json if using npm)
COPY package.json yarn.lock ./

# Install all dependencies
RUN yarn install --frozen-lockfile --network-timeout 100000

# Copy the rest of the application source code
COPY . .

# Build the React application
RUN yarn build

# ---- Production Stage (Nginx) ----
FROM nginx:1.27-alpine AS production
LABEL stage="nginx-production"

# Nginx Alpine images usually include busybox which provides envsubst.
# If not, you might need: RUN apk add --no-cache gettext

# Remove default Nginx welcome page / configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy the custom Nginx configuration template
COPY nginx/nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Copy the built React app from the builder stage to Nginx's web root
COPY --from=builder /app/build /usr/share/nginx/html

# Copy and set permissions for the entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 3000 (Nginx default HTTP port)
EXPOSE 3000

# Set the entrypoint to run our script which then starts Nginx
ENTRYPOINT ["/docker-entrypoint.sh"]