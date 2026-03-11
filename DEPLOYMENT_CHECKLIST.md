# PRODUCTION DEPLOYMENT CHECKLIST

## 📋 Pre-Deployment Checklist

### ✅ Code Quality
- [ ] All 48 modules tested and working
- [ ] No console.log statements in production code
- [ ] Error handling implemented for all API calls
- [ ] Input validation on all forms
- [ ] SQL injection prevention (using TypeORM parameterized queries)
- [ ] XSS protection implemented

### ✅ Environment Configuration
- [ ] Production environment variables configured
- [ ] Database credentials secured
- [ ] JWT secret key generated (strong, random)
- [ ] API keys for third-party services configured
- [ ] CORS settings configured for production domain

### ✅ Database
- [ ] Production database created
- [ ] Database migrations tested
- [ ] Backup strategy implemented
- [ ] Database indexes optimized
- [ ] Connection pooling configured

### ✅ Security
- [ ] HTTPS/SSL certificates installed
- [ ] Password hashing verified (bcrypt)
- [ ] JWT token expiration configured
- [ ] Rate limiting implemented
- [ ] Security headers configured
- [ ] File upload validation implemented

### ✅ Performance
- [ ] Database queries optimized
- [ ] API response times acceptable (<200ms)
- [ ] Frontend bundle size optimized
- [ ] Images optimized and compressed
- [ ] Caching strategy implemented

### ✅ Monitoring
- [ ] Error logging configured
- [ ] Performance monitoring setup
- [ ] Uptime monitoring configured
- [ ] Database monitoring enabled
- [ ] Alert system configured

---

## 🚀 Deployment Steps

### Step 1: Prepare Production Environment

#### 1.1 Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

#### 1.2 Database Setup
```bash
# Create production database
sudo -u postgres psql
CREATE DATABASE akul_dravin_hrms_prod;
CREATE USER hrms_user WITH ENCRYPTED PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE akul_dravin_hrms_prod TO hrms_user;
\q
```

### Step 2: Deploy Backend (NestJS)

#### 2.1 Clone Repository
```bash
cd /var/www
git clone <repository-url> akul-dravin-hrms
cd akul-dravin-hrms/backend/hrms-microservices
```

#### 2.2 Configure Environment
```bash
# Create production .env file
nano .env
```

```env
# Production Environment Variables
NODE_ENV=production
PORT=4200

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=hrms_user
DB_PASSWORD=strong_password_here
DB_NAME=akul_dravin_hrms_prod

# JWT
JWT_SECRET=generate_strong_random_secret_here
JWT_EXPIRATION=7d

# CORS
CORS_ORIGIN=https://yourdomain.com

# Email (if configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/var/www/uploads
```

#### 2.3 Install and Build
```bash
npm install --production
npm run build
```

#### 2.4 Start with PM2
```bash
pm2 start dist/main.js --name hrms-backend
pm2 save
pm2 startup
```

### Step 3: Deploy Frontend (Next.js)

#### 3.1 Option A: Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend-next
vercel --prod
```

#### 3.2 Option B: Self-Host with PM2
```bash
cd /var/www/akul-dravin-hrms/frontend-next

# Create production .env.local
nano .env.local
```

```env
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1
```

```bash
# Install and build
npm install --production
npm run build

# Start with PM2
pm2 start npm --name hrms-frontend -- start
pm2 save
```

### Step 4: Configure Nginx (Reverse Proxy)

#### 4.1 Install Nginx
```bash
sudo apt install nginx
```

#### 4.2 Configure Backend
```bash
sudo nano /etc/nginx/sites-available/hrms-backend
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:4200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 4.3 Configure Frontend (if self-hosting)
```bash
sudo nano /etc/nginx/sites-available/hrms-frontend
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4.4 Enable Sites
```bash
sudo ln -s /etc/nginx/sites-available/hrms-backend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/hrms-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Step 6: Configure Firewall

```bash
# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 🔍 Post-Deployment Verification

### ✅ Backend Health Check
```bash
# Test API endpoint
curl https://api.yourdomain.com/api/v1/health

# Expected response: { "status": "ok" }
```

### ✅ Frontend Access
```bash
# Open in browser
https://yourdomain.com

# Verify:
- [ ] Login page loads
- [ ] Can login successfully
- [ ] Dashboard displays
- [ ] All modules accessible
```

### ✅ Database Connection
```bash
# Check PM2 logs
pm2 logs hrms-backend

# Should show: "Database connected successfully"
```

### ✅ SSL Certificate
```bash
# Check SSL
curl -I https://yourdomain.com

# Should show: HTTP/2 200
```

---

## 📊 Monitoring Setup

### PM2 Monitoring
```bash
# View all processes
pm2 list

# View logs
pm2 logs

# Monitor resources
pm2 monit

# View specific app logs
pm2 logs hrms-backend
pm2 logs hrms-frontend
```

### Database Monitoring
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Monitor connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Check database size
sudo -u postgres psql -d akul_dravin_hrms_prod -c "SELECT pg_size_pretty(pg_database_size('akul_dravin_hrms_prod'));"
```

### Nginx Monitoring
```bash
# Check Nginx status
sudo systemctl status nginx

# View access logs
sudo tail -f /var/log/nginx/access.log

# View error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🔄 Backup Strategy

### Database Backup
```bash
# Create backup script
sudo nano /usr/local/bin/backup-hrms-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/hrms"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump akul_dravin_hrms_prod > $BACKUP_DIR/hrms_$DATE.sql

# Compress
gzip $BACKUP_DIR/hrms_$DATE.sql

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: hrms_$DATE.sql.gz"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-hrms-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-hrms-db.sh
```

### Application Backup
```bash
# Backup application files
tar -czf /var/backups/hrms/app_$(date +%Y%m%d).tar.gz /var/www/akul-dravin-hrms
```

---

## 🚨 Rollback Plan

### If Deployment Fails

#### 1. Rollback Backend
```bash
pm2 stop hrms-backend
cd /var/www/akul-dravin-hrms/backend/hrms-microservices
git checkout <previous-commit-hash>
npm install
npm run build
pm2 restart hrms-backend
```

#### 2. Rollback Database
```bash
# Restore from backup
sudo -u postgres psql akul_dravin_hrms_prod < /var/backups/hrms/hrms_YYYYMMDD_HHMMSS.sql
```

#### 3. Rollback Frontend
```bash
# If using Vercel
vercel rollback

# If self-hosting
pm2 stop hrms-frontend
cd /var/www/akul-dravin-hrms/frontend-next
git checkout <previous-commit-hash>
npm install
npm run build
pm2 restart hrms-frontend
```

---

## 📈 Performance Optimization

### Database Optimization
```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX idx_leaves_employee_status ON leaves(employee_id, status);

-- Analyze tables
ANALYZE employees;
ANALYZE attendance;
ANALYZE leaves;
```

### Nginx Caching
```nginx
# Add to nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/v1/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
    # ... other proxy settings
}
```

---

## ✅ Final Checklist

### Before Going Live
- [ ] All tests passing
- [ ] SSL certificates installed
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Error logging configured
- [ ] Performance optimized
- [ ] Security hardened
- [ ] Documentation updated
- [ ] Team trained
- [ ] Support plan ready

### After Going Live
- [ ] Monitor error logs for 24 hours
- [ ] Check performance metrics
- [ ] Verify backup execution
- [ ] Test critical user flows
- [ ] Monitor database performance
- [ ] Check SSL certificate expiry
- [ ] Review security logs
- [ ] Collect user feedback

---

## 📞 Emergency Contacts

### Critical Issues
- **Database Down**: Check PostgreSQL service, restore from backup
- **API Not Responding**: Check PM2 logs, restart backend service
- **High CPU Usage**: Check PM2 monit, optimize queries
- **SSL Certificate Expired**: Run certbot renew
- **Disk Space Full**: Clean logs, old backups

### Useful Commands
```bash
# Restart all services
pm2 restart all

# Check disk space
df -h

# Check memory usage
free -m

# Check CPU usage
top

# Check logs
pm2 logs --lines 100
```

---

**Deployment Guide Version**: 1.0.0
**Last Updated**: January 2025
**Status**: Production Ready

🚀 **Ready for Production Deployment!**
