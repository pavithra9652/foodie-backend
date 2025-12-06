import Category from '../models/Category.js';

// Default categories to initialize
const defaultCategories = [
  { name: 'appetizer', displayName: 'Appetizer' },
  { name: 'main-course', displayName: 'Main Course' },
  { name: 'dessert', displayName: 'Dessert' },
  { name: 'beverage', displayName: 'Beverage' },
  { name: 'salad', displayName: 'Salad' },
  { name: 'soup', displayName: 'Soup' }
];

/**
 * Initialize categories in the database if they don't exist
 * This ensures categories are always available even if seed script isn't run
 */
export const initializeCategories = async () => {
  try {
    // Check if any categories exist
    const existingCategories = await Category.countDocuments();
    
    if (existingCategories === 0) {
      console.log('📁 No categories found. Initializing default categories...');
      
      // Insert default categories
      const createdCategories = await Category.insertMany(defaultCategories);
      console.log(`✅ Created ${createdCategories.length} default categories in database`);
      
      return createdCategories;
    } else {
      // Check if all default categories exist, add missing ones
      const existingCategoryNames = (await Category.find({}, 'name')).map(cat => cat.name);
      const missingCategories = defaultCategories.filter(
        cat => !existingCategoryNames.includes(cat.name)
      );
      
      if (missingCategories.length > 0) {
        console.log(`📁 Found ${missingCategories.length} missing categories. Adding them...`);
        const addedCategories = await Category.insertMany(missingCategories);
        console.log(`✅ Added ${addedCategories.length} missing categories to database`);
        return addedCategories;
      } else {
        console.log(`✅ All ${existingCategories} categories are already in database`);
      }
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error initializing categories:', error.message);
    // Don't throw error, just log it - server can still run without categories
    return [];
  }
};

