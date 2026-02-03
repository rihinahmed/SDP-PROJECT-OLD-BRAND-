// src/controllers/adminController.js
const { supabase, supabaseAdmin } = require('../config/supabase');

// Get admin dashboard stats
exports.getStats = async (req, res) => {
    try {
        console.log('=== GET ADMIN STATS ===');
        
        // Total users
        const { count: totalUsers } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        
        // Active products
        const { count: activeProducts } = await supabaseAdmin
            .from('products')
            .select('*', { count: 'exact', head: true })
            .in('status', ['available', 'active']);
        
        // Total revenue
        const { data: orders } = await supabaseAdmin
            .from('orders')
            .select('total_amount')
            .eq('payment_status', 'paid');
        
        const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0;
        
        // Pending verifications
        const { count: pendingVerifications } = await supabaseAdmin
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        
        // Today's stats
        const today = new Date().toISOString().split('T')[0];
        
        const { count: newUsersToday } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`);
        
        const { count: productsListedToday } = await supabaseAdmin
            .from('products')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`);
        
        const { count: ordersToday } = await supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`);
        
        const { data: todaysOrders } = await supabaseAdmin
            .from('orders')
            .select('total_amount')
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`);
        
        const todaysSales = todaysOrders?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0;
        
        const stats = {
            total_users: totalUsers || 0,
            active_products: activeProducts || 0,
            total_revenue: totalRevenue,
            pending_verifications: pendingVerifications || 0,
            new_users_today: newUsersToday || 0,
            products_listed_today: productsListedToday || 0,
            orders_today: ordersToday || 0,
            todays_sales: todaysSales
        };
        
        console.log('Stats:', stats);
        
        res.json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stats'
        });
    }
};

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        console.log('=== GET ALL USERS ===');
        
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select(`
                *,
                products:products(count)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Transform data to include product count
        const users = data.map(user => ({
            ...user,
            total_products: user.products?.[0]?.count || 0
        }));
        
        console.log('Found users:', users.length);
        
        res.json({
            success: true,
            data: users
        });
        
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
};

// Update user status
exports.updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        
        console.log('=== UPDATE USER STATUS ===');
        console.log('User ID:', userId);
        console.log('New status:', status);
        
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({
            success: true,
            message: 'User status updated',
            data
        });
        
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user status'
        });
    }
};

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        console.log('=== GET ALL PRODUCTS (ADMIN) ===');
        
        const { data, error } = await supabaseAdmin
            .from('products')
            .select(`
                *,
                profiles:seller_id (
                    id,
                    username,
                    full_name
                )
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        console.log('Found products:', data?.length || 0);
        
        res.json({
            success: true,
            data: data || []
        });
        
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products'
        });
    }
};

// Update product status
exports.updateProductStatus = async (req, res) => {
    try {
        const { productId } = req.params;
        const { status } = req.body;
        
        console.log('=== UPDATE PRODUCT STATUS ===');
        console.log('Product ID:', productId);
        console.log('New status:', status);
        
        const { data, error } = await supabaseAdmin
            .from('products')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', productId)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({
            success: true,
            message: 'Product status updated',
            data
        });
        
    } catch (error) {
        console.error('Update product status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update product status'
        });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        
        console.log('=== DELETE PRODUCT ===');
        console.log('Product ID:', productId);
        
        const { error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', productId);
        
        if (error) throw error;
        
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete product'
        });
    }
};

// Get all orders
exports.getAllOrders = async (req, res) => {
    try {
        console.log('=== GET ALL ORDERS (ADMIN) ===');
        
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
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

// Get activity log
exports.getActivityLog = async (req, res) => {
    try {
        console.log('=== GET ACTIVITY LOG ===');
        
        // Get recent activities from multiple sources
        const activities = [];
        
        // Recent users
        const { data: recentUsers } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, username, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
        
        recentUsers?.forEach(user => {
            activities.push({
                type: 'user',
                title: 'New User Registration',
                description: `${user.full_name || user.username} joined the platform`,
                created_at: user.created_at
            });
        });
        
        // Recent products
        const { data: recentProducts } = await supabaseAdmin
            .from('products')
            .select('id, name, created_at, profiles:seller_id(full_name, username)')
            .order('created_at', { ascending: false })
            .limit(5);
        
        recentProducts?.forEach(product => {
            activities.push({
                type: 'product',
                title: 'Product Listed',
                description: `${product.profiles?.full_name || product.profiles?.username} listed "${product.name}"`,
                created_at: product.created_at
            });
        });
        
        // Recent orders
        const { data: recentOrders } = await supabaseAdmin
            .from('orders')
            .select('id, order_number, product_name, total_amount, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
        
        recentOrders?.forEach(order => {
            activities.push({
                type: 'transaction',
                title: 'New Order',
                description: `Order #${order.order_number} placed for ${order.product_name}`,
                created_at: order.created_at
            });
        });
        
        // Sort by date
        activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        res.json({
            success: true,
            data: activities.slice(0, 20)
        });
        
    } catch (error) {
        console.error('Get activity log error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch activity log'
        });
    }
};