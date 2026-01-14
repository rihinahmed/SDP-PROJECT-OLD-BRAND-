// src/controllers/productController.js
const { supabase, supabaseAdmin } = require('../config/supabase');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

// Get all products with filters
const getAllProducts = async (req, res) => {
    try {
        const { 
            category, 
            condition, 
            minPrice, 
            maxPrice, 
            sortBy = 'created_at',
            search 
        } = req.query;

        let query = supabase
            .from('products')
            .select(`
                *,
                profiles:user_id (
                    id,
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

        if (minPrice) {
            query = query.gte('price', minPrice);
        }

        if (maxPrice) {
            query = query.lte('price', maxPrice);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Apply sorting
        switch (sortBy) {
            case 'price-low':
                query = query.order('price', { ascending: true });
                break;
            case 'price-high':
                query = query.order('price', { ascending: false });
                break;
            case 'newest':
            default:
                query = query.order('created_at', { ascending: false });
                break;
        }

        const { data, error } = await query;

        if (error) {
            console.error('Database error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.json(data || []);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

// Get single product
const getProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                profiles:user_id (
                    id,
                    username,
                    avatar_url,
                    full_name
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Database error:', error);
            return res.status(404).json({ error: 'Product not found' });
        }

        // Increment view count
        await supabase
            .from('products')
            .update({ views: (data.views || 0) + 1 })
            .eq('id', id);

        res.json(data);
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

// Create product
const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, condition, size, usageTime } = req.body;
        let imageUrl = null;

        console.log('Creating product:', { name, category, condition, price });

        // Upload image if provided
        if (req.file) {
            const fileName = `${uuidv4()}-${Date.now()}.jpg`;
            
            console.log('Uploading image:', fileName);

            // Optimize image with sharp
            const optimizedImage = await sharp(req.file.buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 85 })
                .toBuffer();

            const { data: uploadData, error: uploadError } = await supabaseAdmin
                .storage
                .from('product-images')
                .upload(fileName, optimizedImage, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600'
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                return res.status(400).json({ error: 'Failed to upload image: ' + uploadError.message });
            }

            const { data: { publicUrl } } = supabaseAdmin
                .storage
                .from('product-images')
                .getPublicUrl(fileName);

            imageUrl = publicUrl;
            console.log('Image uploaded:', imageUrl);
        }

        // Create product
        const { data, error } = await supabase
            .from('products')
            .insert([
                {
                    user_id: req.user.id,
                    name,
                    description,
                    price: parseFloat(price),
                    category,
                    condition,
                    size: size || null,
                    usage_time: usageTime,
                    image_url: imageUrl
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return res.status(400).json({ error: error.message });
        }

        console.log('Product created:', data.id);

        res.status(201).json({
            message: 'Product created successfully',
            product: data
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Failed to create product: ' + error.message });
    }
};

// Update product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category, condition, size, usageTime, status } = req.body;

        // Verify ownership
        const { data: existing } = await supabase
            .from('products')
            .select('user_id')
            .eq('id', id)
            .single();

        if (!existing || existing.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updateData = {
            name,
            description,
            price: parseFloat(price),
            category,
            condition,
            size: size || null,
            usage_time: usageTime,
            updated_at: new Date().toISOString()
        };

        if (status) {
            updateData.status = status;
        }

        // Upload new image if provided
        if (req.file) {
            const fileName = `${uuidv4()}-${Date.now()}.jpg`;
            
            const optimizedImage = await sharp(req.file.buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 85 })
                .toBuffer();

            const { error: uploadError } = await supabaseAdmin
                .storage
                .from('product-images')
                .upload(fileName, optimizedImage, {
                    contentType: 'image/jpeg'
                });

            if (!uploadError) {
                const { data: { publicUrl } } = supabaseAdmin
                    .storage
                    .from('product-images')
                    .getPublicUrl(fileName);

                updateData.image_url = publicUrl;
            }
        }

        const { data, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.json({
            message: 'Product updated successfully',
            product: data
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
};

// Delete product
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Verify ownership
        const { data: existing } = await supabase
            .from('products')
            .select('user_id, image_url')
            .eq('id', id)
            .single();

        if (!existing || existing.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Delete image from storage if exists
        if (existing.image_url) {
            const fileName = existing.image_url.split('/').pop();
            await supabaseAdmin.storage.from('product-images').remove([fileName]);
        }

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Database error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};

// Get user's products
const getUserProducts = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.json(data || []);
    } catch (error) {
        console.error('Get user products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

// Add to favorites
const addToFavorites = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('favorites')
            .insert([
                {
                    user_id: req.user.id,
                    product_id: id
                }
            ])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(400).json({ error: 'Already in favorites' });
            }
            console.error('Database error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({
            message: 'Added to favorites',
            favorite: data
        });
    } catch (error) {
        console.error('Add to favorites error:', error);
        res.status(500).json({ error: 'Failed to add to favorites' });
    }
};

// Remove from favorites
const removeFromFavorites = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', req.user.id)
            .eq('product_id', id);

        if (error) {
            console.error('Database error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'Removed from favorites' });
    } catch (error) {
        console.error('Remove from favorites error:', error);
        res.status(500).json({ error: 'Failed to remove from favorites' });
    }
};

// Get user's favorites
const getFavorites = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('favorites')
            .select(`
                *,
                products (
                    *,
                    profiles:user_id (
                        id,
                        username,
                        avatar_url
                    )
                )
            `)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.json(data || []);
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ error: 'Failed to fetch favorites' });
    }
};

module.exports = {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getUserProducts,
    addToFavorites,
    removeFromFavorites,
    getFavorites
};