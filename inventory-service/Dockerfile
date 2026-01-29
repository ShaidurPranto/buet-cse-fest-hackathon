FROM node:18-alpine

# Install CA certificates for SSL connections
RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Ensure the app waits for the network if needed
EXPOSE 3000

CMD ["npm", "start"]