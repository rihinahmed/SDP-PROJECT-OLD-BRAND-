// src/controllers/orderController.js
const { supabase, supabaseAdmin } = require('../config/supabase');

// Create new order
exports.createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log('=== CREATE ORDER ===');
        console.log('User ID:', userId);
        console.log('Order data:', req.body);
        
        const {
            product_id,
            product_name,
            product_price,
            product_image,
            email,
            first_name,
            last_name,
            address,
            apartment,
            city,
            postal_code,
            phone,
            payment_method,
            subtotal,
            shipping_cost,
            discount_amount,
            discount_code,
            total_amount,
            newsletter,
            status
        } = req.body;
        
        // Validation
        if (!product_id || !product_name || !total_amount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required order information'
            });
        }
        
        if (!address || !city || !phone) {
            return res.status(400).json({
                success: false,
                error: 'Missing shipping address information'
            });
        }
        
        // Generate order number
        const orderNumber = `RV-${Date.now().toString().slice(-8)}`;
        
        // Prepare order data
        const orderData = {
            user_id: userId,
            order_number: orderNumber,
            
            // Product info
            product_id,
            product_name,
            product_price: parseFloat(product_price),
            product_image,
            
            // Customer info
            customer_email: email,
            customer_first_name: first_name,
            customer_last_name: last_name,
            
            // Shipping address
            shipping_address: address,
            shipping_apartment: apartment,
            shipping_city: city,
            shipping_postal_code: postal_code,
            shipping_phone: phone,
            
            // Payment
            payment_method,
            payment_status: 'pending',
            
            // Pricing
            subtotal: parseFloat(subtotal),
            shipping_cost: parseFloat(shipping_cost),
            discount_amount: parseFloat(discount_amount || 0),
            discount_code: discount_code || null,
            total_amount: parseFloat(total_amount),
            
            // Status
            status: status || 'pending',
            
            // Newsletter
            newsletter_opted_in: newsletter || false,
            
            // Timestamps
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        console.log('Inserting order:', orderData);
        
        // Insert order into database
        const { data, error } = await supabaseAdmin
            .from('orders')
            .insert([orderData])
            .select()
            .single();
        
        if (error) {
            console.error('Database error:', error);
            throw error;
        }
        
        console.log('✅ Order created successfully:', data.id);
        
        // Update product status to 'sold' (optional)
        // await supabaseAdmin
        //     .from('products')
        //     .update({ status: 'sold' })
        //     .eq('id', product_id);
        
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                id: data.id,
                order_number: orderNumber,
                total_amount: total_amount,
                status: data.status
            }
        });
        
    } catch (error) {
        console.error('=== CREATE ORDER ERROR ===');
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create order'
        });
    }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log('=== GET USER ORDERS ===');
        console.log('User ID:', userId);
        
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Get orders error:', error);
            throw error;
        }
        
        console.log('Found orders:', data?.length || 0);
        
        res.json({
            success: true,
            data: data || []
        });
        
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders'
        });
    }
};

// Get single order
exports.getOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        console.log('=== GET ORDER ===');
        console.log('User ID:', userId);
        console.log('Order ID:', id);
        
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        
        if (error) {
            console.error('Get order error:', error);
            throw error;
        }
        
        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }
        
        res.json({
            success: true,
            data
        });
        
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order'
        });
    }
};

// Update order status (for admin)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, payment_status } = req.body;
        
        console.log('=== UPDATE ORDER STATUS ===');
        console.log('Order ID:', id);
        console.log('New status:', status);
        
        const updates = {
            updated_at: new Date().toISOString()
        };
        
        if (status) updates.status = status;
        if (payment_status) updates.payment_status = payment_status;
        
        const { data, error } = await supabaseAdmin
            .from('orders')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) {
            console.error('Update order error:', error);
            throw error;
        }
        
        res.json({
            success: true,
            message: 'Order updated successfully',
            data
        });
        
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update order'
        });
    }
};