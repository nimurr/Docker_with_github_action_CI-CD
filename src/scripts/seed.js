/**
 * Database Seeding Script
 * Creates initial data for the multi-tenant SaaS platform
 * 
 * Usage: node src/scripts/seed.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import SubscriptionPlan from "../models/subscriptionPlan.model.js";
import Merchant from "../models/merchant.model.js";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import bcrypt from "bcryptjs";

dotenv.config();

const seedDatabase = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("✅ MongoDB Connected");

        // Clear existing data (optional - comment out for production)
        // await SubscriptionPlan.deleteMany({});
        // await Merchant.deleteMany({});
        // await User.deleteMany({});
        // console.log("🗑️  Cleared existing data");

        // ======================
        // Create Subscription Plans
        // ======================
        const plans = await SubscriptionPlan.countDocuments();
        if (plans === 0) {
            const subscriptionPlans = await SubscriptionPlan.insertMany([
                {
                    name: "Basic",
                    description: "Perfect for small stores getting started",
                    price: 29,
                    billingCycle: "monthly",
                    productLimit: 100,
                    storageLimit: 1024, // 1GB
                    features: [
                        "Up to 100 products",
                        "1GB storage",
                        "Basic analytics",
                        "Email support",
                        "Custom domain",
                    ],
                    isActive: true,
                    trialPeriodDays: 14,
                },
                {
                    name: "Pro",
                    description: "For growing businesses",
                    price: 79,
                    billingCycle: "monthly",
                    productLimit: 1000,
                    storageLimit: 10240, // 10GB
                    features: [
                        "Up to 1,000 products",
                        "10GB storage",
                        "Advanced analytics",
                        "Priority email support",
                        "Custom domain",
                        "Zero transaction fees",
                        "Discount codes",
                    ],
                    isActive: true,
                    trialPeriodDays: 14,
                },
                {
                    name: "Enterprise",
                    description: "For large-scale operations",
                    price: 299,
                    billingCycle: "monthly",
                    productLimit: 10000,
                    storageLimit: 102400, // 100GB
                    features: [
                        "Unlimited products",
                        "100GB storage",
                        "Custom analytics",
                        "24/7 phone support",
                        "Custom domain",
                        "Zero transaction fees",
                        "Advanced discount system",
                        "API access",
                        "Dedicated account manager",
                    ],
                    isActive: true,
                    trialPeriodDays: 30,
                },
            ]);
            console.log(`✅ Created ${subscriptionPlans.length} subscription plans`);
        } else {
            console.log("ℹ️  Subscription plans already exist");
        }

        // ======================
        // Create Master Admin
        // ======================
        const adminCount = await User.countDocuments({ role: "master_admin" });
        if (adminCount === 0) {
            const hashedPassword = await bcrypt.hash("Admin123!@#", 12);
            
            const masterAdmin = await User.create({
                fullName: "Platform Admin",
                email: "admin@platform.com",
                password: hashedPassword,
                role: "master_admin",
                isVerified: true,
            });
            console.log(`✅ Created master admin: ${masterAdmin.email}`);
        } else {
            console.log("ℹ️  Master admin already exists");
        }

        // ======================
        // Create Sample Merchants
        // ======================
        const merchantCount = await Merchant.countDocuments();
        if (merchantCount === 0) {
            const basicPlan = await SubscriptionPlan.findOne({ name: "Basic" });
            const proPlan = await SubscriptionPlan.findOne({ name: "Pro" });

            const expireDate = new Date();
            expireDate.setMonth(expireDate.getMonth() + 1);

            const merchants = await Merchant.insertMany([
                {
                    storeName: "Tech Gadgets Store",
                    domain: "techgadgets.localhost",
                    merchantEmail: "owner@techgadgets.com",
                    merchantPhone: "+1234567890",
                    subscriptionPlanId: basicPlan._id,
                    subscriptionStatus: "active",
                    subscriptionStartDate: new Date(),
                    subscriptionExpireDate: expireDate,
                    isActive: true,
                    isVerified: true,
                    storeSettings: {
                        currency: "USD",
                        timezone: "UTC",
                        language: "en",
                        taxRate: 10,
                        shippingEnabled: true,
                    },
                    storeAddress: {
                        street: "123 Tech Street",
                        city: "San Francisco",
                        state: "CA",
                        country: "USA",
                        postalCode: "94102",
                    },
                    storeDescription: "Your one-stop shop for the latest tech gadgets",
                },
                {
                    storeName: "Fashion Hub",
                    domain: "fashion.localhost",
                    merchantEmail: "owner@fashionhub.com",
                    merchantPhone: "+1987654321",
                    subscriptionPlanId: proPlan._id,
                    subscriptionStatus: "active",
                    subscriptionStartDate: new Date(),
                    subscriptionExpireDate: expireDate,
                    isActive: true,
                    isVerified: true,
                    storeSettings: {
                        currency: "USD",
                        timezone: "UTC",
                        language: "en",
                        taxRate: 8,
                        shippingEnabled: true,
                    },
                    storeDescription: "Trendy fashion for everyone",
                },
            ]);
            console.log(`✅ Created ${merchants.length} sample merchants`);

            // ======================
            // Create Merchant Admin Users
            // ======================
            const merchantAdminPassword = await bcrypt.hash("Merchant123!@#", 12);
            
            const merchantAdmins = await User.insertMany([
                {
                    fullName: "Tech Store Owner",
                    email: "owner@techgadgets.com",
                    password: merchantAdminPassword,
                    role: "merchant_admin",
                    merchantId: merchants[0]._id,
                    isVerified: true,
                    merchantProfile: {
                        designation: "Store Owner",
                    },
                },
                {
                    fullName: "Fashion Store Owner",
                    email: "owner@fashionhub.com",
                    password: merchantAdminPassword,
                    role: "merchant_admin",
                    merchantId: merchants[1]._id,
                    isVerified: true,
                    merchantProfile: {
                        designation: "Store Owner",
                    },
                },
            ]);
            console.log(`✅ Created ${merchantAdmins.length} merchant admin users`);

            // ======================
            // Create Sample Products
            // ======================
            const sampleProducts = [
                {
                    merchantId: merchants[0]._id,
                    name: "Wireless Bluetooth Earbuds",
                    description: "High-quality wireless earbuds with noise cancellation",
                    price: 79.99,
                    compareAtPrice: 99.99,
                    stock: 150,
                    category: "Electronics",
                    tags: ["wireless", "audio", "bluetooth"],
                    isPublished: true,
                    isActive: true,
                    isFeatured: true,
                },
                {
                    merchantId: merchants[0]._id,
                    name: "Smart Watch Pro",
                    description: "Feature-rich smartwatch with health tracking",
                    price: 199.99,
                    stock: 75,
                    category: "Electronics",
                    tags: ["wearable", "smartwatch", "fitness"],
                    isPublished: true,
                    isActive: true,
                },
                {
                    merchantId: merchants[0]._id,
                    name: "USB-C Fast Charger",
                    description: "65W fast charger for laptops and phones",
                    price: 39.99,
                    stock: 200,
                    category: "Accessories",
                    tags: ["charger", "usb-c", "fast-charging"],
                    isPublished: true,
                    isActive: true,
                },
                {
                    merchantId: merchants[1]._id,
                    name: "Classic Denim Jacket",
                    description: "Timeless denim jacket for all seasons",
                    price: 89.99,
                    stock: 50,
                    category: "Clothing",
                    tags: ["jacket", "denim", "casual"],
                    isPublished: true,
                    isActive: true,
                    isFeatured: true,
                },
                {
                    merchantId: merchants[1]._id,
                    name: "Cotton T-Shirt Pack",
                    description: "Pack of 3 premium cotton t-shirts",
                    price: 49.99,
                    stock: 100,
                    category: "Clothing",
                    tags: ["t-shirt", "cotton", "basics"],
                    isPublished: true,
                    isActive: true,
                },
            ];

            const products = await Product.insertMany(sampleProducts);
            console.log(`✅ Created ${products.length} sample products`);

            // Update merchant product counts
            for (const merchant of merchants) {
                const productCount = await Product.countDocuments({ merchantId: merchant._id });
                merchant.productCount = productCount;
                await merchant.save();
            }
        } else {
            console.log("ℹ️  Merchants already exist");
        }

        console.log("\n✅ Database seeding completed successfully!");
        console.log("\n📋 Default Credentials:");
        console.log("   Master Admin: admin@platform.com / Admin123!@#");
        console.log("   Merchant Admin: owner@techgadgets.com / Merchant123!@#");
        console.log("   Merchant Admin: owner@fashionhub.com / Merchant123!@#");
        console.log("\n🌐 Sample Store Domains:");
        console.log("   - techgadgets.localhost");
        console.log("   - fashion.localhost");

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedDatabase();
