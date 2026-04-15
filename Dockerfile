# Stage 1: Build the React application using Node
FROM node:20-alpine as build
WORKDIR /app

# Copy package dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Set environment variables for Vite to use during build
ARG VITE_SUPABASE_KEY
ENV VITE_SUPABASE_KEY=$VITE_SUPABASE_KEY

# Build the project
RUN npm run build

# Stage 2: Serve the built application with Nginx
FROM nginx:alpine

# Copy custom Nginx configuration to handle React Router (SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built output from Stage 1 to Nginx HTML directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
