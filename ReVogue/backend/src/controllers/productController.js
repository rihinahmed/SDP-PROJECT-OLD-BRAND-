// src/controllers/productController.js - FINAL FIXED VERSION
const { supabase, supabaseAdmin } = require('../config/supabase');

// Get all products with filters
exports.getAllProducts = async (req, res) => {
    try {
        console.log('=== GET ALL PRODUCTS ===');
        console.log('Query params:', req.query);
        
        const { category, condition, max_price, sort, search } = req.query;

        // Use regular supabase client for public read operations
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
            .eq('status', 'available'); // CRITICAL: Only show 'available' products

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

        console.log('Query result - Error:', error);
        console.log('Query result - Data count:', data?.length || 0);
        if (data && data.length > 0) {
            console.log('Query result - First item:', data[0]);
        }

        if (error) {
            console.error('Supabase query error:', error);
            throw error;
        }

        console.log('Returning products:', data?.length || 0);

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

        // Use regular supabase client for public read
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
        
        console.log('=== CREATE PRODUCT ===');
        console.log('User ID:', userId);
        console.log('RAW Request Body:', req.body);
        console.log('Request File:', req.file);
        
        const { name, description, price, category, condition, size, usageTime, usage_time } = req.body;
        const file = req.file;

        // Use either usageTime or usage_time (frontend might send either)
        const finalUsageTime = usageTime || usage_time;
        
        // Auto-determine condition based on usage time if condition not provided or if usage time is a number
        let finalCondition = condition;
        
        // Check if usageTime is a number (months)
        const usageMonths = parseInt(finalUsageTime);
        if (!isNaN(usageMonths)) {
            // Auto-calculate condition based on months
            if (usageMonths <= 3) {
                finalCondition = 'Like New';
            } else if (usageMonths <= 12) {
                finalCondition = 'Good';
            } else if (usageMonths <= 24) {
                finalCondition = 'Fair';
            } else {
                finalCondition = 'Well Used';
            }
            console.log(`Auto-selected condition: ${finalCondition} (based on ${usageMonths} months)`);
        }
        
        console.log('Extracted data:', { 
            name, 
            description, 
            price, 
            category, 
            condition: finalCondition, 
            size, 
            finalUsageTime,
            usageMonths: !isNaN(usageMonths) ? usageMonths : 'N/A'
        });

        // Validation (condition is optional now if usage time is provided as months)
        if (!name || !description || !price || !category || !finalUsageTime) {
            console.error('Validation failed - missing required fields');
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                details: 'Required: name, description, price, category, usageTime (condition will be auto-calculated if usage time is in months)',
                received: { 
                    name: !!name, 
                    description: !!description, 
                    price: !!price, 
                    category: !!category, 
                    usageTime: !!finalUsageTime,
                    autoCondition: finalCondition
                }
            });
        }

        let imageUrl = null;

        // Upload image if provided
        if (file) {
            console.log('Uploading image...');
            const fileExt = file.originalname.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;

            const { error: uploadError } = await supabaseAdmin.storage
                .from('products')
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (uploadError) {
                console.error('Image upload error:', uploadError);
                throw uploadError;
            }

            const { data: { publicUrl } } = supabaseAdmin.storage
                .from('products')
                .getPublicUrl(filePath);

            imageUrl = publicUrl;
            console.log('Image uploaded:', imageUrl);
        }

        // CRITICAL FIX: Set status to 'available' to match getAllProducts filter
        const productData = {
            user_id: userId,
            name: name.trim(),
            description: description.trim(),
            price: parseFloat(price),
            category: category.trim(),
            condition: finalCondition.trim(), // Use auto-calculated or provided condition
            size: size ? size.trim() : null,
            usage_time: finalUsageTime.trim(),
            image_url: imageUrl,
            status: 'available', // ✅ FIXED: Changed from 'active' to 'available'
            views: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('Inserting product data:', productData);

        const { data, error } = await supabaseAdmin
            .from('products')
            .insert([productData])
            .select()
            .single();

        if (error) {
            console.error('Database insert error:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            throw error;
        }

        console.log('✅ Product created successfully:', data.id);
        console.log('Product status:', data.status);

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data
        });
    } catch (error) {
        console.error('=== CREATE PRODUCT ERROR ===');
        console.error('Error:', error);
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
        const { name, description, price, category, condition, size, usageTime, usage_time } = req.body;
        const file = req.file;

        console.log('=== UPDATE PRODUCT ===');
        console.log('Product ID:', id);
        console.log('User ID:', userId);

        // Use either usageTime or usage_time
        const finalUsageTime = usageTime || usage_time;

        // Verify ownership
        const { data: existingProduct, error: fetchError } = await supabaseAdmin
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

        const updates = {
            updated_at: new Date().toISOString()
        };
        
        if (name) updates.name = name.trim();
        if (description) updates.description = description.trim();
        if (price) updates.price = parseFloat(price);
        if (category) updates.category = category.trim();
        if (condition) updates.condition = condition.trim();
        if (size !== undefined) updates.size = size ? size.trim() : null;
        if (finalUsageTime) updates.usage_time = finalUsageTime.trim();

        // Handle image upload
        if (file) {
            console.log('Uploading new image...');
            
            // Delete old image if exists
            if (existingProduct.image_url) {
                const oldImagePath = existingProduct.image_url.split('/').slice(-2).join('/');
                await supabaseAdmin.storage
                    .from('products')
                    .remove([oldImagePath]);
            }

            // Upload new image
            const fileExt = file.originalname.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;

            const { error: uploadError } = await supabaseAdmin.storage
                .from('products')
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabaseAdmin.storage
                .from('products')
                .getPublicUrl(filePath);

            updates.image_url = publicUrl;
        }

        console.log('Updating with:', updates);

        const { data, error } = await supabaseAdmin
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Update error:', error);
            throw error;
        }

        console.log('✅ Product updated successfully');

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

        console.log('=== DELETE PRODUCT ===');
        console.log('Product ID:', id);
        console.log('User ID:', userId);

        // Verify ownership
        const { data: product, error: fetchError } = await supabaseAdmin
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
            await supabaseAdmin.storage
                .from('products')
                .remove([imagePath]);
        }

        const { error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete error:', error);
            throw error;
        }

        console.log('✅ Product deleted successfully');

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