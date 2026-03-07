# Multi-Tenant SaaS E-commerce Platform

A scalable, production-ready multi-tenant e-commerce platform (Shopify-like) built with Node.js, Express, MongoDB, and Docker. Support for unlimited merchants, each with their own domain, products, and customers.

![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)
![Express](https://img.shields.io/badge/Express-5.x-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-6+-green.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## 🚀 Features

### Core Platform Features
- **Multi-Tenant Architecture**: Shared database with tenant isolation via `merchantId`
- **Domain-Based Routing**: Each merchant gets their own domain (e.g., `store1.com`, `store2.com`)
- **Subscription System**: Monthly/quarterly/yearly plans with auto-deactivation
- **Role-Based Access Control**: Master Admin, Merchant Admin, Customer roles

### For Master Admin (Platform Owner)
- Manage all merchants and subscription plans
- Platform-wide analytics and revenue tracking
- Server health monitoring
- User management across all tenants
- Manual subscription management

### For Merchants
- **Store Management**: Custom domain, branding, settings
- **Product Management**: Unlimited products (based on plan limits)
- **Order Management**: Full order lifecycle management
- **Customer Management**: Customer database and analytics
- **Analytics Dashboard**: Sales, revenue, and performance metrics

### For Customers
- Browse products by merchant
- Shopping cart and checkout
- Order history and tracking
- Account management

## 📁 Project Structure

```
├── src/
│   ├── config/          # Configuration files
│   ├── controller/      # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── service/         # Business logic
│   ├── utils/           # Utility functions
│   ├── jobs/            # Background jobs
│   └── scripts/         # Utility scripts
├── nginx/               # Nginx configuration
├── .github/
│   └── workflows/       # CI/CD pipelines
├── docker-compose.yml   # Docker orchestration
├── Dockerfile          # Container build instructions
└── index.js            # Application entry point
```

## 🛠️ Tech Stack

- **Backend**: Node.js 20+, Express.js 5
- **Database**: MongoDB 6+ with Mongoose ORM
- **Caching**: Redis
- **Web Server**: Nginx (reverse proxy)
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Email**: Nodemailer

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 6+
- Redis
- Docker & Docker Compose (optional)

### Option 1: Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Docker_with_github_action_CI-CD
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .example.env .env
# Edit .env with your credentials
```

4. **Seed the database**
```bash
node src/scripts/seed.js
```

5. **Start the server**
```bash
npm start
```

Server will run on `http://localhost:3000`

### Option 2: Docker (Recommended for Production)

1. **Build and start all services**
```bash
docker-compose up -d --build
```

2. **Seed the database**
```bash
docker-compose exec app node src/scripts/seed.js
```

3. **View logs**
```bash
docker-compose logs -f
```

## 📊 Database Models

### Merchant
```javascript
{
  storeName: String,
  domain: String (unique),
  merchantEmail: String,
  subscriptionPlanId: ObjectId,
  subscriptionStatus: String,
  subscriptionExpireDate: Date,
  isActive: Boolean,
  storeSettings: Object,
  productCount: Number,
  orderCount: Number,
  totalRevenue: Number
}
```

### Product
```javascript
{
  merchantId: ObjectId,
  name: String,
  price: Number,
  stock: Number,
  category: String,
  images: [String],
  isPublished: Boolean,
  isActive: Boolean
}
```

### Order
```javascript
{
  merchantId: ObjectId,
  customerId: ObjectId,
  orderNumber: String (unique),
  products: [Object],
  orderStatus: String,
  paymentStatus: String,
  totalAmount: Number
}
```

### User
```javascript
{
  fullName: String,
  email: String (unique),
  password: String,
  role: String (master_admin | merchant_admin | customer),
  merchantId: ObjectId,
  isVerified: Boolean
}
```

## 🔐 Default Credentials

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| Master Admin | admin@platform.com | Admin123!@# |
| Merchant Admin | owner@techgadgets.com | Merchant123!@# |
| Merchant Admin | owner@fashionhub.com | Merchant123!@# |

## 📡 API Endpoints

### Authentication
```
POST   /api/v1/auth/register     - Register new user
POST   /api/v1/auth/login        - Login
POST   /api/v1/auth/verify-email - Verify email
POST   /api/v1/auth/resend-otp   - Resend OTP
```

### Merchants (Master Admin)
```
POST   /api/v1/merchants/register     - Register new merchant
GET    /api/v1/merchants              - Get all merchants
GET    /api/v1/merchants/:id          - Get merchant by ID
PUT    /api/v1/merchants/:id          - Update merchant
PATCH  /api/v1/merchants/:id/status   - Toggle merchant status
PUT    /api/v1/merchants/:id/subscription - Update subscription
```

### Products
```
GET    /api/v1/products/published     - Get published products (public)
GET    /api/v1/products/published/:id - Get single product (public)
POST   /api/v1/products               - Create product
GET    /api/v1/products               - Get all products (merchant)
GET    /api/v1/products/:id           - Get product by ID
PUT    /api/v1/products/:id           - Update product
DELETE /api/v1/products/:id           - Delete product
PATCH  /api/v1/products/:id/stock     - Update stock
POST   /api/v1/products/bulk-update   - Bulk update products
```

### Orders
```
POST   /api/v1/orders                 - Create order
GET    /api/v1/orders                 - Get all orders (merchant)
GET    /api/v1/orders/my-orders       - Get my orders (customer)
GET    /api/v1/orders/:id             - Get order by ID
PUT    /api/v1/orders/:id/status      - Update order status
POST   /api/v1/orders/:id/refund      - Process refund
POST   /api/v1/orders/:id/cancel      - Cancel order
```

### Subscriptions
```
GET    /api/v1/subscriptions/plans          - Get active plans
GET    /api/v1/subscriptions/current        - Get current subscription
POST   /api/v1/subscriptions/subscribe      - Subscribe to plan
POST   /api/v1/subscriptions/cancel         - Cancel subscription
```

### Admin (Master Admin Only)
```
GET    /api/v1/admin/analytics              - Platform analytics
GET    /api/v1/admin/dashboard-stats        - Dashboard statistics
GET    /api/v1/admin/server-health          - Server health status
GET    /api/v1/admin/users                  - Get all users
PATCH  /api/v1/admin/users/:id/status       - Toggle user status
POST   /api/v1/admin/run-subscription-job   - Run expiry job manually
```

## 🔄 Domain-Based Tenant Detection

The platform automatically detects which merchant store to show based on the request domain:

1. Request comes to `store1.com/api/v1/products`
2. Middleware extracts `store1.com` from Host header
3. System finds merchant with `domain: "store1.com"`
4. All queries automatically filtered by `merchantId`
5. Returns only products for that merchant

### Local Testing with Hosts File

Add to your hosts file (`/etc/hosts` or `C:\Windows\System32\drivers\etc\hosts`):
```
127.0.0.1   techgadgets.localhost
127.0.0.1   fashion.localhost
```

Then access stores at:
- `http://techgadgets.localhost:3000`
- `http://fashion.localhost:3000`

## 📦 Subscription Plans

| Plan | Price/Month | Products | Storage | Features |
|------|-------------|----------|---------|----------|
| Basic | $29 | 100 | 1GB | Basic analytics, Email support |
| Pro | $79 | 1,000 | 10GB | Advanced analytics, Priority support |
| Enterprise | $299 | 10,000 | 100GB | Custom analytics, 24/7 support |

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Tenant isolation (merchants can't access each other's data)
- Rate limiting via Nginx
- CORS protection
- XSS and CSRF protection headers
- Input validation with Joi

## 📈 Scaling Strategy

### Current Setup (Single Server)
- Handles: ~100K requests/day
- Users: ~1M monthly active users
- Stack: Node.js + MongoDB + Redis + Nginx

### Future Scaling Options
1. **Horizontal Scaling**: Add more app instances behind load balancer
2. **Redis Clustering**: For distributed caching
3. **MongoDB Sharding**: For large datasets
4. **CDN**: For static assets and images
5. **Microservices**: Split into separate services (auth, products, orders)

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run linter
npm run lint
```

## 🚀 Deployment

### Production Deployment with Docker

1. **Set up production server** (Ubuntu 20.04+)

2. **Install Docker**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

3. **Clone repository and configure**
```bash
git clone <your-repo>
cd Docker_with_github_action_CI-CD
cp .example.env .env
# Edit .env with production values
```

4. **Deploy**
```bash
docker-compose up -d
```

5. **Set up SSL with Let's Encrypt** (optional but recommended)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### GitHub Actions CI/CD

The pipeline automatically:
1. Runs tests on every push
2. Builds Docker image on main branch
3. Deploys to production server
4. Performs health checks

**Required Secrets:**
- `PRODUCTION_HOST`: Your server IP
- `PRODUCTION_USER`: SSH username
- `PRODUCTION_SSH_KEY`: Private SSH key

## 📝 Background Jobs

### Subscription Expiry Check
- Runs every 24 hours
- Automatically deactivates expired stores
- Sends warning emails (7 days and 24 hours before expiry)

Manual trigger:
```bash
POST /api/v1/admin/run-subscription-job
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB is running
docker-compose ps mongo

# View MongoDB logs
docker-compose logs mongo
```

### Redis Connection Issues
```bash
# Test Redis connection
docker-compose exec redis redis-cli ping
```

### View Application Logs
```bash
docker-compose logs -f app
```

### Reset Database
```bash
docker-compose down -v  # Removes all volumes
docker-compose up -d
node src/scripts/seed.js
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

- Email: support@yourplatform.com
- Documentation: https://docs.yourplatform.com
- Issues: https://github.com/yourusername/repo/issues

## 🎯 Roadmap

- [ ] GraphQL API support
- [ ] Mobile apps (iOS/Android)
- [ ] Multi-currency support
- [ ] Advanced discount system
- [ ] Integration with payment gateways (PayPal, Stripe)
- [ ] Email marketing tools
- [ ] SEO optimization tools
- [ ] Multi-language support

---

Built with ❤️ using Node.js, Express, MongoDB, and Docker
