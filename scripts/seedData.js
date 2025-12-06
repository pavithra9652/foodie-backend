import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';
// Note: bcrypt not needed - User model handles password hashing

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodie');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await MenuItem.deleteMany({});
    await Category.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    // Note: Don't hash password manually - User model's pre-save hook will hash it
    const admin = await User.create({
      name: 'Admin ',
      email: 'admin@foodie.com',
      password: 'admin123', // Will be hashed by pre-save hook
      phone: '9876543210',
      address: 'Admin Address',
      role: 'admin'
    });
    console.log('Admin user created:', admin.email, 'Password: admin123');

    // Create test user
    // Note: Don't hash password manually - User model's pre-save hook will hash it
    const user = await User.create({
      name: 'Test User',
      email: 'user@foodie.com',
      password: 'user123', // Will be hashed by pre-save hook
      phone: '9876543211',
      address: '123 Test Street, Test City'
    });
    console.log('Test user created:', user.email, 'Password: user123');

    // Create categories
    const categories = [
      { name: 'appetizer', displayName: 'Appetizer' },
      { name: 'main-course', displayName: 'Main Course' },
      { name: 'dessert', displayName: 'Dessert' },
      { name: 'beverage', displayName: 'Beverage' },
      { name: 'salad', displayName: 'Salad' },
      { name: 'soup', displayName: 'Soup' }
    ];

    const createdCategories = await Category.insertMany(categories);
    console.log(`Created ${createdCategories.length} categories`);

    // Create menu items
    const menuItems = [
      {
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce, mozzarella cheese, and fresh basil',
        price: 299,
        category: 'main-course',
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
        available: true,
        preparationTime: 25
      },
      {
        name: 'Pepperoni Pizza',
        description: 'Delicious pizza topped with pepperoni and mozzarella cheese',
        price: 349,
        category: 'main-course',
        image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
        available: true,
        preparationTime: 25
      },
      {
        name: 'Chicken Burger',
        description: 'Juicy grilled chicken patty with fresh vegetables and special sauce',
        price: 199,
        category: 'main-course',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
        available: true,
        preparationTime: 20
      },
      {
        name: 'Veg Burger',
        description: 'Crispy vegetable patty with fresh lettuce, tomato, and mayo',
        price: 149,
        category: 'main-course',
        image: 'https://images.unsplash.com/photo-1525059696034-4967a7290027?w=400',
        available: true,
        preparationTime: 15
      },
      {
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with caesar dressing, croutons, and parmesan',
        price: 179,
        category: 'salad',
        image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
        available: true,
        preparationTime: 10
      },
      {
        name: 'Greek Salad',
        description: 'Mixed greens with feta cheese, olives, tomatoes, and olive oil',
        price: 189,
        category: 'salad',
        image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400',
        available: true,
        preparationTime: 10
      },
      {
        name: 'Chicken Wings',
        description: 'Spicy buffalo chicken wings served with blue cheese dip',
        price: 249,
        category: 'appetizer',
        image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400',
        available: true,
        preparationTime: 20
      },
      {
        name: 'French Fries',
        description: 'Crispy golden fries served with ketchup',
        price: 99,
        category: 'appetizer',
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
        available: true,
        preparationTime: 15
      },
      {
        name: 'Chocolate Brownie',
        description: 'Warm chocolate brownie with vanilla ice cream',
        price: 149,
        category: 'dessert',
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
        available: true,
        preparationTime: 10
      },
      {
        name: 'Ice Cream Sundae',
        description: 'Vanilla ice cream with chocolate sauce, nuts, and cherry',
        price: 129,
        category: 'dessert',
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400',
        available: true,
        preparationTime: 5
      },
      {
        name: 'Coca Cola',
        description: 'Chilled soft drink',
        price: 49,
        category: 'beverage',
        image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400',
        available: true,
        preparationTime: 2
      },
      {
        name: 'Fresh Orange Juice',
        description: 'Freshly squeezed orange juice',
        price: 79,
        category: 'beverage',
        image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
        available: true,
        preparationTime: 5
      },
      {
        name: 'Tomato Soup',
        description: 'Creamy tomato soup with croutons',
        price: 119,
        category: 'soup',
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
        available: true,
        preparationTime: 15
      },
      {
        name: 'Chicken Noodles',
        description: 'Stir-fried noodles with chicken and vegetables',
        price: 229,
        category: 'main-course',
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
        available: true,
        preparationTime: 20
      },
      {
        name: 'Veg Fried Rice',
        description: 'Fried rice with mixed vegetables and spices',
        price: 179,
        category: 'main-course',
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
        available: true,
        preparationTime: 18
      },
      {
        name: 'Butter Chicken',
        description: 'Creamy tomato-based curry with tender chicken pieces',
        price: 329,
        category: 'main-course',
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
        available: true,
        preparationTime: 30
      },
      {
        name: 'Paneer Tikka',
        description: 'Marinated cottage cheese grilled to perfection',
        price: 279,
        category: 'main-course',
        image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400',
        available: true,
        preparationTime: 25
      },
      {
        name: 'Biryani',
        description: 'Fragrant basmati rice with spices and tender meat',
        price: 299,
        category: 'main-course',
        image: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=400',
        available: true,
        preparationTime: 35
      },
      {
        name: 'Pasta Carbonara',
        description: 'Creamy pasta with bacon, eggs, and parmesan cheese',
        price: 249,
        category: 'main-course',
        image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
        available: true,
        preparationTime: 20
      },
      {
        name: 'Grilled Salmon',
        description: 'Fresh salmon fillet grilled with herbs and lemon',
        price: 449,
        category: 'main-course',
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
        available: true,
        preparationTime: 25
      },
      {
        name: 'Tandoori Roti',
        description: 'Traditional Indian flatbread baked in tandoor',
        price: 29,
        category: 'main-course',
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
        available: true,
        preparationTime: 10
      },
      {
        name: 'Spring Rolls',
        description: 'Crispy vegetable spring rolls with sweet chili sauce',
        price: 149,
        category: 'appetizer',
        image: 'https://images.unsplash.com/photo-1615367429053-9d1fe425e78b?w=400',
        available: true,
        preparationTime: 15
      },
      {
        name: 'Mozzarella Sticks',
        description: 'Breaded mozzarella cheese sticks with marinara sauce',
        price: 199,
        category: 'appetizer',
        image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400',
        available: true,
        preparationTime: 12
      },
      {
        name: 'Onion Rings',
        description: 'Crispy golden onion rings with tangy dip',
        price: 129,
        category: 'appetizer',
        image: 'https://images.unsplash.com/photo-1615367429053-9d1fe425e78b?w=400',
        available: true,
        preparationTime: 10
      },
      {
        name: 'Garlic Bread',
        description: 'Toasted bread with garlic butter and herbs',
        price: 89,
        category: 'appetizer',
        image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400',
        available: true,
        preparationTime: 8
      },
      {
        name: 'Garden Salad',
        description: 'Fresh mixed greens with tomatoes, cucumbers, and vinaigrette',
        price: 149,
        category: 'salad',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
        available: true,
        preparationTime: 8
      },
      {
        name: 'Fruit Salad',
        description: 'Fresh seasonal fruits with honey and mint',
        price: 139,
        category: 'salad',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
        available: true,
        preparationTime: 10
      },
      {
        name: 'Chicken Caesar Wrap',
        description: 'Grilled chicken with caesar salad wrapped in tortilla',
        price: 219,
        category: 'salad',
        image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400',
        available: true,
        preparationTime: 12
      },
      {
        name: 'Vegetable Soup',
        description: 'Hearty mixed vegetable soup with herbs',
        price: 109,
        category: 'soup',
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
        available: true,
        preparationTime: 15
      },
      {
        name: 'Chicken Noodle Soup',
        description: 'Comforting chicken soup with noodles and vegetables',
        price: 149,
        category: 'soup',
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
        available: true,
        preparationTime: 18
      },
      {
        name: 'Mushroom Soup',
        description: 'Creamy mushroom soup with herbs and croutons',
        price: 129,
        category: 'soup',
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
        available: true,
        preparationTime: 15
      },
      {
        name: 'Cheesecake',
        description: 'Creamy New York style cheesecake with berry compote',
        price: 199,
        category: 'dessert',
        image: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400',
        available: true,
        preparationTime: 5
      },
      {
        name: 'Tiramisu',
        description: 'Classic Italian dessert with coffee and mascarpone',
        price: 229,
        category: 'dessert',
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
        available: true,
        preparationTime: 5
      },
      {
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with molten center and vanilla ice cream',
        price: 249,
        category: 'dessert',
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
        available: true,
        preparationTime: 12
      },
      {
        name: 'Apple Pie',
        description: 'Homemade apple pie with cinnamon and vanilla ice cream',
        price: 179,
        category: 'dessert',
        image: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400',
        available: true,
        preparationTime: 8
      },
      {
        name: 'Fresh Lemonade',
        description: 'Refreshing lemonade with mint and ice',
        price: 69,
        category: 'beverage',
        image: 'https://images.unsplash.com/photo-1523677011783-c91d1bbe2a9e?w=400',
        available: true,
        preparationTime: 5
      },
      {
        name: 'Mango Shake',
        description: 'Creamy mango milkshake with fresh mango pieces',
        price: 99,
        category: 'beverage',
        image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400',
        available: true,
        preparationTime: 5
      },
      {
        name: 'Iced Coffee',
        description: 'Cold brewed coffee with ice and cream',
        price: 119,
        category: 'beverage',
        image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400',
        available: true,
        preparationTime: 5
      },
      {
        name: 'Green Tea',
        description: 'Premium green tea with honey and lemon',
        price: 59,
        category: 'beverage',
        image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
        available: true,
        preparationTime: 3
      },
      {
        name: 'Watermelon Juice',
        description: 'Fresh watermelon juice with mint',
        price: 89,
        category: 'beverage',
        image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
        available: true,
        preparationTime: 5
      }
    ];

    await MenuItem.insertMany(menuItems);
    console.log(`Created ${menuItems.length} menu items`);

    console.log('\n✅ Seed data created successfully!');
    console.log('\nTest Credentials:');
    console.log('Admin - Email: admin@foodie.com, Password: admin123');
    console.log('User - Email: user@foodie.com, Password: user123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

