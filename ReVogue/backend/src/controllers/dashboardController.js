// backend/controllers/dashboardController.js
const supabase = require('../config/supabase');

exports.getDashboardData = async (req, res) => {
    try {
        const { userId } = req.query;

        // Fetch Listings, Favorites, and Purchases in parallel for speed
        const [listings, favorites, purchases] = await Promise.all([
            supabase.from('products').select('*').eq('user_id', userId),
            supabase.from('favorites').select('*, products(*)').eq('user_id', userId),
            supabase.from('purchases').select('*, products(*)').eq('buyer_id', userId)
        ]);

        res.status(200).json({
            listings: listings.data || [],
            favorites: favorites.data || [],
            purchases: purchases.data || []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};