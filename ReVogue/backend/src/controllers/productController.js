// src/controllers/productController.js - SIMPLE VERSION THAT WORKS
const { supabase } = require('../config/supabase');

// Get All Products (Public - for index page)
exports.getAllProducts = async (req, res) => {
    try {
        const { 
            category, 
            condition, 
            min_price, 
            max_price, 
            search, 
            sort = 'created_at',  // Default to created_at
            order = 'desc' 
        } = req.query;

        // Map frontend sort values to database columns
        const sortMapping = {
            'newest': 'created_at',
            'oldest': 'created_at',
            'price-low': 'price',
            'price-high': 'price',
            'created_at': 'created_at',
            'price': 'price'
        };

        // Map frontend order values
        const orderMapping = {
            'newest': 'desc',
            'oldest': 'asc',
            'price-low': 'asc',
            'price-high': 'desc'
        };

        // Get the actual database column to sort by
        const sortColumn = sortMapping[sort] || 'created_at';
        
        // Get the sort direction
        let sortOrder = order;
        if (orderMapping[sort]) {
            sortOrder = orderMapping[sort];
        }

        let query = supabase
            .from('products')
            .select(`
                *,
                profiles (
                    id,
                    full_name,
                    username,
                    avatar_url
                )
            `)
            .eq('status', 'available');

        // Apply filters
        if (category && category !== 'All') {
            query = query.eq('category', category);
        }
        if (condition) {
            query = query.eq('condition', condition);
        }
        if (min_price) {
            query = query.gte('price', parseFloat(min_price));
        }
        if (max_price) {
            query = query.lte('price', parseFloat(max_price));
        }
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Apply sorting
        query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

        const { data, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products',
            data: []
        });
    }
};

// Get Single Product by ID
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID format'
            });
        }

        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                profiles (
                    id,
                    full_name,
                    username,
                    avatar_url
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        // Increment views
        await supabase
            .from('products')
            .update({ views: (data.views || 0) + 1 })
            .eq('id', id);

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(404).json({
            success: false,
            error: 'Product not found'
        });
    }
};

// Create Product
exports.createProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            name, 
            description, 
            price, 
            category, 
            condition, 
            size, 
            usage_time 
        } = req.body;
        
        const file = req.file;

        // Validate required fields
        if (!name || !description || !price || !category || !condition) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        let imageUrl = null;

        // Upload image if provided
        if (file) {
            const fileExt = file.originalname.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            imageUrl = publicUrl;
        }

        // Create product
        const { data, error } = await supabase
            .from('products')
            .insert([{
                user_id: userId,
                name,
                description,
                price: parseFloat(price),
                category,
                condition,
                size: size || null,
                usage_time: usage_time || null,
                image_url: imageUrl,
                status: 'available',
                views: 0
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Product listed successfully',
            data
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create product'
        });
    }
};

// Update Product
exports.updateProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, description, price, category, condition, size, usage_time, status } = req.body;
        const file = req.file;

        // Check if user owns the product
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (fetchError || !product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found or you do not have permission'
            });
        }

        let imageUrl = product.image_url;

        // Upload new image if provided
        if (file) {
            const fileExt = file.originalname.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            imageUrl = publicUrl;
        }

        // Build update object
        const updateData = {
            updated_at: new Date().toISOString()
        };

        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (price) updateData.price = parseFloat(price);
        if (category) updateData.category = category;
        if (condition) updateData.condition = condition;
        if (size !== undefined) updateData.size = size;
        if (usage_time !== undefined) updateData.usage_time = usage_time;
        if (status) updateData.status = status;
        if (imageUrl) updateData.image_url = imageUrl;

        const { data, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Product updated successfully',
            data
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update product'
        });
    }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Check if user owns the product
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (fetchError || !product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found or you do not have permission'
            });
        }

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

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