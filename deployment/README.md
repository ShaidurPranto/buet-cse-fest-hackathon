# Deployment Guide for AWS EC2

This guide assumes you are logged into your Ubuntu EC2 instance and have cloned the repository.

## 1. Start Application
First, start all services including the frontend using Docker Compose.

```bash
# Update repo
git pull

# Build and start services
sudo docker-compose up --build -d
```
*Note: Make sure ports 3000, 3001, 8080 are NOT exposed in AWS Security Group if you want to force traffic through Nginx (port 80/443).*

## 2. Install Nginx
Install Nginx on the host machine to handle SSL and routing.

```bash
sudo apt update
sudo apt install -y nginx
```

## 3. Configure Nginx
Copy the provided config to Nginx's sites directory.

```bash
# Replace 'YOUR_DOMAIN.com' with your actual domain in the file first!
nano deployment/nginx.conf 

# Copy to Nginx
sudo cp deployment/nginx.conf /etc/nginx/sites-available/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 4. Set up SSL with Certbot
Use Let's Encrypt to secure your domain.

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain and install certificate
sudo certbot --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com
```

Certbot will automatically update your Nginx configuration to force HTTPS.

## 5. Verify
Visit `https://YOUR_DOMAIN.com`. 
- Frontend should load.
- API requests should work (check Network tab for `/service/order/...` calls).
