// src/controllers/productController.js - FIXED VERSION
const { supabase } = require('../config/supabase');

// Get all products with filters
exports.getAllProducts = async (req, res) => {
    try {
        const { category, condition, max_price, sort, search } = req.query;

        let query = supabase
            .from('products')
            .select(`
                *,
                profiles (
                    username,
                    full_name,
                    avatar_url
                )
            `)
            .eq('status', 'active');

        if (category && category !== 'All') {
            query = query.eq('category', category);
        }

        if (condition) {
            query = query.eq('condition', condition);
        }

        if (max_price) {
            query = query.lte('price', parseFloat(max_price));
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Sorting
        if (sort === 'price-low') {
            query = query.order('price', { ascending: true });
        } else if (sort === 'price-high') {
            query = query.order('price', { ascending: false });
        } else {
            query = query.order('created_at', { ascending: false });
        }

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
            error: 'Failed to fetch products'
        });
    }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                profiles (
                    username,
                    full_name,
                    avatar_url
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch product'
        });
    }
};

// Create new product
exports.createProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // IMPORTANT: Log the entire body to see what we're receiving
        console.log('RAW Request Body:', req.body);
        console.log('Request File:', req.file);
        
        const { name, description, price, category, condition, size, usageTime, usage_time } = req.body;
        const file = req.file;

        // Use either usageTime or usage_time (frontend might send either)
        const finalUsageTime = usageTime || usage_time;
        
        console.log('Creating product with data:', { 
            name, 
            description, 
            price, 
            category, 
            condition, 
            size, 
            usageTime, 
            usage_time,
            finalUsageTime 
        });

        // Validation
        if (!name || !description || !price || !category || !condition || !finalUsageTime) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                received: { name, description, price, category, condition, size, usageTime, usage_time }
            });
        }

        let imageUrl = null;

        // Upload image if provided
        if (file) {
            const fileExt = file.originalname.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (uploadError) {
                console.error('Image upload error:', uploadError);
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            imageUrl = publicUrl;
        }

        // FIXED: Map usageTime to usage_time for database
        const productData = {
            user_id: userId,
            name: name.trim(),
            description: description.trim(),
            price: parseFloat(price),
            category: category.trim(),
            condition: condition.trim(),
            size: size ? size.trim() : null,
            usage_time: finalUsageTime.trim(), // FIXED: use finalUsageTime
            image_url: imageUrl,
            status: 'active'
        };

        console.log('Inserting product data:', productData);

        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select()
            .single();

        if (error) {
            console.error('Database insert error:', error);
            throw error;
        }

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create product'
        });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, description, price, category, condition, size, usageTime } = req.body;
        const file = req.file;

        // Verify ownership
        const { data: existingProduct, error: fetchError } = await supabase
            .from('products')
            .select('user_id, image_url')
            .eq('id', id)
            .single();

        if (fetchError || !existingProduct) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        if (existingProduct.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        const updates = {};
        if (name) updates.name = name.trim();
        if (description) updates.description = description.trim();
        if (price) updates.price = parseFloat(price);
        if (category) updates.category = category.trim();
        if (condition) updates.condition = condition.trim();
        if (size !== undefined) updates.size = size ? size.trim() : null;
        if (usageTime) updates.usage_time = usageTime.trim(); // FIXED

        // Handle image upload
        if (file) {
            // Delete old image if exists
            if (existingProduct.image_url) {
                const oldImagePath = existingProduct.image_url.split('/').slice(-2).join('/');
                await supabase.storage
                    .from('products')
                    .remove([oldImagePath]);
            }

            // Upload new image
            const fileExt = file.originalname.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            updates.image_url = publicUrl;
        }

        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
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

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Verify ownership
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('user_id, image_url')
            .eq('id', id)
            .single();

        if (fetchError || !product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        if (product.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        // Delete image from storage
        if (product.image_url) {
            const imagePath = product.image_url.split('/').slice(-2).join('/');
            await supabase.storage
                .from('products')
                .remove([imagePath]);
        }

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

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