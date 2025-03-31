# Use the Node.js 20 Alpine Linux image as the base image
FROM node:20-alpine

# Set environment variables to ensure that the app runs in production mode
ENV NODE_ENV=production

# Set the working directory inside the container to /app
WORKDIR /app

# Copy package.json and package-lock.json files into the working directory
COPY package*.json ./

# Install the dependencies specified in package.json
RUN npm install

# Copy all the files from the local directory to the working directory in the container
COPY . .

# Remove .env.local file if it exists
RUN rm -f .env.local

# Build the project (typically used for building front-end assets)
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Run the application
CMD ["npm", "start"]