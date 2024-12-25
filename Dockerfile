# Step 1: Use a Node.js image for building the app
# FROM node:16 as build
FROM node:20 as build

# Set working directory in the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the app source code and build the app
COPY . .
RUN npm run build

# Step 2: Use an Nginx image to serve the built app
FROM nginx:alpine

# Copy build output to Nginx's HTML directory
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80 for the container
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
