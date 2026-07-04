FROM node:20-alpine

WORKDIR /app

# Copy package definition and install dependencies
COPY package.json ./
RUN npm install --omit=dev

# Copy server and local database mocks
COPY server.js ./
COPY db/ ./db/

ENV NODE_ENV=production
ENV HRMS_API_PORT=4100
ENV HRMS_API_HOST=0.0.0.0

EXPOSE 4100

CMD ["node", "server.js"]
