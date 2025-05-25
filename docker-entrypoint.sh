#!/bin/sh
set -e

# Define the template and output file paths
NGINX_CONF_TEMPLATE="/etc/nginx/conf.d/default.conf.template"
NGINX_CONF_OUTPUT="/etc/nginx/conf.d/default.conf"

# Substitute the BACKEND_API_URL environment variable into the Nginx config template
# The variable REACT_APP_BACKEND_API_URL (from docker-compose .env) will be available here.
# We assign it to BACKEND_API_URL which is used in the nginx.conf.template
export BACKEND_API_URL=${REACT_APP_BACKEND_API_URL}
envsubst '${BACKEND_API_URL}' < "${NGINX_CONF_TEMPLATE}" > "${NGINX_CONF_OUTPUT}"

echo "Nginx configuration generated with backend URL: ${BACKEND_API_URL}"
cat "${NGINX_CONF_OUTPUT}" # Optional: print the generated config for debugging

# Start Nginx in the foreground
exec nginx -g 'daemon off;'