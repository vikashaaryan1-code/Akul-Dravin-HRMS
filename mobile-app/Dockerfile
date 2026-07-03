# Stage 1: Build the Expo Web app
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
# We use expo export --web to generate the static files
RUN npx expo export:web

# Stage 2: Serve via Nginx
FROM nginx:1.27-alpine

COPY --from=builder /app/web-build /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
