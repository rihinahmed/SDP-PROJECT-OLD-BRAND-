// seed-data.js - Run this to add dummy data
// Save this in your backend folder and run: node seed-data.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedData() {
    console.log('🌱 Starting to seed dummy data...\n');

    try {
        // Step 1: Create dummy users
        console.log('👥 Creating dummy users...');
        
        const users = [
            {
                email: 'sarah@example.com',
                password: 'password123',
                username: 'sarah_m',
                full_name: 'Sarah Martinez'
            },
            {
                email: 'john@example.com',
                password: 'password123',
                username: 'john_doe',
                full_name: 'John Doe'
            },
            {
                email: 'emma@example.com',
                password: 'password123',
                username: 'emma_wilson',
                full_name: 'Emma Wilson'
            },
            {
                email: 'michael@example.com',
                password: 'password123',
                username: 'michael_r',
                full_name: 'Michael Roberts'
            }
        ];

        const createdUsers = [];

        for (const user of users) {
            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true
            });

            if (authError) {
                console.log(`❌ Error creating ${user.email}:`, authError.message);
                continue;
            }

            // Create profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    username: user.username,
                    full_name: user.full_name,
                    bio: `Hi! I'm ${user.full_name}. I love sustainable fashion!`,
                    location: 'Dhaka, Bangladesh'
                });

            if (profileError) {
                console.log(`❌ Profile error for ${user.email}:`, profileError.message);
            } else {
                console.log(`✅ Created user: ${user.email}`);
                createdUsers.push({
                    id: authData.user.id,
                    email: user.email,
                    username: user.username
                });
            }
        }

        if (createdUsers.length === 0) {
            console.log('❌ No users created. Cannot seed products.');
            return;
        }

        // Step 2: Create dummy products
        console.log('\n📦 Creating dummy products...');

        const products = [
            {
                name: 'Vintage Denim Jacket',
                description: 'Classic vintage denim jacket in excellent condition. Perfect for layering. Medium wash with authentic vintage details.',
                price: 1500,
                category: 'Tops',
                condition: 'Like New',
                size: 'M',
                usage_time: '6 months',
                image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800'
            },
            {
                name: 'Leather Ankle Boots',
                description: 'Genuine leather ankle boots with minimal wear. Comfortable and stylish. Perfect for any season.',
                price: 2800,
                category: 'Shoes',
                condition: 'Good',
                size: '8',
                usage_time: '1 year',
                image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800'
            },
            {
                name: 'Floral Summer Dress',
                description: 'Beautiful floral pattern, perfect for summer occasions. Light and breezy fabric. Worn only a few times.',
                price: 1200,
                category: 'Dresses',
                condition: 'Like New',
                size: 'S',
                usage_time: '3 months',
                image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800'
            },
            {
                name: 'Designer Handbag',
                description: 'Authentic designer handbag, well maintained. Classic design that never goes out of style.',
                price: 4500,
                category: 'Bags',
                condition: 'Good',
                size: 'Medium',
                usage_time: '2 years',
                image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'
            },
            {
                name: 'Vintage Sunglasses',
                description: 'Retro style sunglasses with UV protection. Perfect condition with original case.',
                price: 800,
                category: 'Eyewear',
                condition: 'Like New',
                size: 'One Size',
                usage_time: '2 months',
                image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800'
            },
            {
                name: 'High-Waisted Jeans',
                description: 'Trendy high-waisted jeans in great condition. Perfect fit and comfortable.',
                price: 1400,
                category: 'Bottoms',
                condition: 'Good',
                size: '30',
                usage_time: '8 months',
                image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800'
            },
            {
                name: 'Pearl Necklace',
                description: 'Elegant pearl necklace, perfect for formal events. Authentic pearls with silver clasp.',
                price: 2000,
                category: 'Accessories',
                condition: 'Like New',
                size: 'One Size',
                usage_time: '1 month',
                image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800'
            },
            {
                name: 'Wool Winter Coat',
                description: 'Warm wool coat, ideal for cold weather. High quality fabric and construction.',
                price: 3500,
                category: 'Tops',
                condition: 'Good',
                size: 'L',
                usage_time: '1 year',
                image_url: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800'
            },
            {
                name: 'Silk Scarf',
                description: 'Beautiful silk scarf with vibrant colors. Adds elegance to any outfit.',
                price: 600,
                category: 'Accessories',
                condition: 'Like New',
                size: 'One Size',
                usage_time: '2 months',
                image_url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800'
            },
            {
                name: 'Casual Sneakers',
                description: 'Comfortable white sneakers, great for daily wear. Minimal signs of use.',
                price: 1800,
                category: 'Shoes',
                condition: 'Good',
                size: '9',
                usage_time: '6 months',
                image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800'
            },
            {
                name: 'Evening Clutch',
                description: 'Elegant clutch perfect for evening events. Gold hardware and satin finish.',
                price: 900,
                category: 'Bags',
                condition: 'Like New',
                size: 'Small',
                usage_time: '3 months',
                image_url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800'
            },
            
        ];

        const createdProducts = [];

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const user = createdUsers[i % createdUsers.length]; // Distribute products among users

            const { data, error } = await supabase
                .from('products')
                .insert({
                    user_id: user.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    category: product.category,
                    condition: product.condition,
                    size: product.size,
                    usage_time: product.usage_time,
                    image_url: product.image_url,
                    status: 'available',
                    views: Math.floor(Math.random() * 100)
                })
                .select()
                .single();

            if (error) {
                console.log(`❌ Error creating product "${product.name}":`, error.message);
            } else {
                console.log(`✅ Created product: ${product.name} (by ${user.username})`);
                createdProducts.push(data);
            }
        }

        // Step 3: Create some favorites
        console.log('\n❤️  Creating favorites...');

        if (createdProducts.length > 0 && createdUsers.length > 1) {
            // First user likes some products from other users
            const favoritesToCreate = [
                { user_id: createdUsers[0].id, product_id: createdProducts[1].id },
                { user_id: createdUsers[0].id, product_id: createdProducts[2].id },
                { user_id: createdUsers[1].id, product_id: createdProducts[0].id },
                { user_id: createdUsers[1].id, product_id: createdProducts[3].id },
            ];

            for (const fav of favoritesToCreate) {
                const { error } = await supabase
                    .from('favorites')
                    .insert(fav);

                if (!error) {
                    console.log(`✅ Added favorite for user`);
                }
            }
        }

        // Step 4: Create some notifications
        console.log('\n🔔 Creating notifications...');

        for (const user of createdUsers.slice(0, 2)) {
            const notifications = [
                {
                    user_id: user.id,
                    type: 'like',
                    title: 'Someone liked your item',
                    message: 'Your item received a new like!',
                    is_read: false
                },
                {
                    user_id: user.id,
                    type: 'message',
                    title: 'New message',
                    message: 'You have a new message from a buyer',
                    is_read: false
                }
            ];

            for (const notif of notifications) {
                const { error } = await supabase
                    .from('notifications')
                    .insert(notif);

                if (!error) {
                    console.log(`✅ Created notification for ${user.email}`);
                }
            }
        }

        console.log('\n✅ Dummy data seeded successfully!');
        console.log('\n📊 Summary:');
        console.log(`   👥 Users created: ${createdUsers.length}`);
        console.log(`   📦 Products created: ${createdProducts.length}`);
        console.log(`   ❤️  Favorites created: 4`);
        console.log(`   🔔 Notifications created: 4`);
        console.log('\n🔐 Test Credentials:');
        console.log('   Email: sarah@example.com');
        console.log('   Password: password123');
        console.log('\n   Email: john@example.com');
        console.log('   Password: password123');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
    }
}

// Run the seed function
seedData();