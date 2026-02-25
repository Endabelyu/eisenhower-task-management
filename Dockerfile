FROM nginx:alpine

# Copy the built React app to Nginx's web root
COPY dist /usr/share/nginx/html

# Copy custom Nginx configuration for single page application routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
