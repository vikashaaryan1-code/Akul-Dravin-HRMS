FROM node:20-alpine

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install dependencies strictly for production
RUN npm install

# Copy source code
COPY . .

# Generate the production build
RUN npm run build

# Expose the API port
EXPOSE 3001

# Run the application
CMD ["node", "dist/main.js"]
