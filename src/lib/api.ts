
// Mock API service for demonstration
// In a real application, this would connect to your backend

export interface DashboardData {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  lowStockAlerts: number;
  salesTrend: {
    labels: string[];
    data: number[];
  };
}

export async function fetchDashboardData(): Promise<DashboardData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data
  return {
    totalSales: 1254300,
    totalOrders: 342,
    totalCustomers: 189,
    lowStockAlerts: 7,
    salesTrend: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      data: [120000, 150000, 180000, 210000, 240000, 270000, 300000]
    }
  };
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  status: 'active' | 'inactive';
  images: string[];
}

let mockProducts: Product[] = [
  { id: '1', name: 'Organic Honey', price: 499, category: 'Food', stock: 45, status: 'active', images: [] },
  { id: '2', name: 'Herbal Tea', price: 299, category: 'Beverages', stock: 8, status: 'active', images: [] },
  { id: '3', name: 'Ayurvedic Oil', price: 899, category: 'Wellness', stock: 23, status: 'active', images: [] },
  { id: '4', name: 'Handmade Soap', price: 199, category: 'Personal Care', stock: 4, status: 'active', images: [] },
];

export async function fetchProducts(): Promise<Product[]> {
  await new Promise(resolve => setTimeout(resolve, 800));
  return [...mockProducts];
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<Product> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newProduct: Product = {
    ...product,
    id: Date.now().toString(),
  };
  mockProducts.push(newProduct);
  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Omit<Product, 'id'>>): Promise<Product> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const productIndex = mockProducts.findIndex(product => product.id === id);
  if (productIndex === -1) {
    throw new Error('Product not found');
  }
  mockProducts[productIndex] = { ...mockProducts[productIndex], ...updates };
  return mockProducts[productIndex];
}

export async function deleteProduct(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const productIndex = mockProducts.findIndex(product => product.id === id);
  if (productIndex === -1) {
    throw new Error('Product not found');
  }
  mockProducts.splice(productIndex, 1);
}

export async function getProduct(id: string): Promise<Product> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const product = mockProducts.find(product => product.id === id);
  if (!product) {
    throw new Error('Product not found');
  }
  return product;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  minStockLevel: number;
}

export async function fetchInventory(): Promise<InventoryItem[]> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return [
    { id: '1', name: 'Organic Honey', category: 'Food', stock: 45, price: 499, minStockLevel: 10 },
    { id: '2', name: 'Herbal Tea', category: 'Beverages', stock: 8, price: 299, minStockLevel: 15 },
    { id: '3', name: 'Ayurvedic Oil', category: 'Wellness', stock: 23, price: 899, minStockLevel: 5 },
    { id: '4', name: 'Handmade Soap', category: 'Personal Care', stock: 4, price: 199, minStockLevel: 8 },
    { id: '5', name: 'Essential Oil Set', category: 'Wellness', stock: 12, price: 1299, minStockLevel: 6 },
    { id: '6', name: 'Herbal Shampoo', category: 'Personal Care', stock: 0, price: 349, minStockLevel: 10 },
    { id: '7', name: 'Organic Coffee', category: 'Beverages', stock: 18, price: 599, minStockLevel: 12 },
  ];
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  date: string;
  status: 'pending' | 'shipped' | 'completed' | 'cancelled';
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  courier?: string;
  trackingNumber?: string;
}

let mockOrders: Order[] = [
  {
    id: 'ORD001',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    totalAmount: 1500,
    date: '2023-09-01',
    status: 'pending',
    items: [
      { productId: '1', productName: 'Organic Honey', quantity: 2, price: 499 },
      { productId: '2', productName: 'Herbal Tea', quantity: 1, price: 299 }
    ],
    shippingAddress: { street: '123 Main St', city: 'Mumbai', state: 'Maharashtra', zipCode: '400001', country: 'India' },
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD002',
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    totalAmount: 2500,
    date: '2023-09-02',
    status: 'shipped',
    items: [
      { productId: '3', productName: 'Ayurvedic Oil', quantity: 1, price: 899 },
      { productId: '4', productName: 'Handmade Soap', quantity: 3, price: 199 }
    ],
    shippingAddress: { street: '456 Elm St', city: 'Delhi', state: 'Delhi', zipCode: '110001', country: 'India' },
    paymentMethod: 'PayPal'
  },
  {
    id: 'ORD003',
    customerName: 'Alice Johnson',
    customerEmail: 'alice@example.com',
    totalAmount: 3500,
    date: '2023-09-03',
    status: 'completed',
    items: [
      { productId: '5', productName: 'Essential Oil Set', quantity: 2, price: 1299 },
      { productId: '2', productName: 'Herbal Tea', quantity: 1, price: 299 }
    ],
    shippingAddress: { street: '789 Oak St', city: 'Bangalore', state: 'Karnataka', zipCode: '560001', country: 'India' },
    paymentMethod: 'Debit Card'
  },
  {
    id: 'ORD004',
    customerName: 'Bob Brown',
    customerEmail: 'bob@example.com',
    totalAmount: 4500,
    date: '2023-09-04',
    status: 'cancelled',
    items: [
      { productId: '1', productName: 'Organic Honey', quantity: 3, price: 499 },
      { productId: '3', productName: 'Ayurvedic Oil', quantity: 2, price: 899 }
    ],
    shippingAddress: { street: '321 Pine St', city: 'Chennai', state: 'Tamil Nadu', zipCode: '600001', country: 'India' },
    paymentMethod: 'Credit Card'
  },
];

export async function fetchOrders(): Promise<Order[]> {
  await new Promise(resolve => setTimeout(resolve, 800));
  return [...mockOrders];
}

export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<Order> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const orderIndex = mockOrders.findIndex(order => order.id === orderId);
  if (orderIndex === -1) {
    throw new Error('Order not found');
  }
  mockOrders[orderIndex] = { ...mockOrders[orderIndex], ...updates };
  return mockOrders[orderIndex];
}

export interface SalesData {
  totalRevenue: number;
  totalOrders: number;
  totalRefunds: number;
  averageOrderValue: number;
  monthlyTrend: {
    labels: string[];
    data: number[];
  };
}

export async function fetchSalesData(): Promise<SalesData> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return {
    totalRevenue: 1254300,
    totalOrders: 342,
    totalRefunds: 25000,
    averageOrderValue: 3667,
    monthlyTrend: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      data: [120000, 150000, 180000, 210000, 240000, 270000, 300000]
    }
  };
}

export interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  customerEmail: string;
  date: string;
}

export async function fetchTransactions(): Promise<Transaction[]> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return [
    {
      id: 'TXN001',
      orderId: 'ORD001',
      amount: 1500,
      status: 'completed',
      paymentMethod: 'Credit Card',
      customerEmail: 'john@example.com',
      date: '2023-09-01T10:30:00Z'
    },
    {
      id: 'TXN002',
      orderId: 'ORD002',
      amount: 2500,
      status: 'pending',
      paymentMethod: 'PayPal',
      customerEmail: 'jane@example.com',
      date: '2023-09-02T14:45:00Z'
    },
    {
      id: 'TXN003',
      orderId: 'ORD003',
      amount: 3500,
      status: 'completed',
      paymentMethod: 'Debit Card',
      customerEmail: 'alice@example.com',
      date: '2023-09-03T09:15:00Z'
    },
    {
      id: 'TXN004',
      orderId: 'ORD004',
      amount: 4500,
      status: 'failed',
      paymentMethod: 'Credit Card',
      customerEmail: 'bob@example.com',
      date: '2023-09-04T16:20:00Z'
    },
    {
      id: 'TXN005',
      orderId: 'ORD005',
      amount: 1200,
      status: 'refunded',
      paymentMethod: 'UPI',
      customerEmail: 'sarah@example.com',
      date: '2023-09-05T11:30:00Z'
    }
  ];
}

export interface Blog {
  id: string;
  title: string;
  author: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  tags: string[];
  status: 'published' | 'draft';
  createdAt: string;
  updatedAt: string;
}

let mockBlogs: Blog[] = [
  {
    id: '1',
    title: 'The Benefits of Organic Honey',
    author: 'Dr. Sarah Chen',
    content: 'Full content about organic honey benefits...',
    excerpt: 'Discover the amazing health benefits of pure organic honey and how it can improve your daily life.',
    featuredImage: '/api/placeholder/400/250',
    tags: ['health', 'nutrition', 'organic'],
    status: 'published',
    createdAt: '2023-08-15',
    updatedAt: '2023-08-15'
  },
  {
    id: '2',
    title: 'Ayurvedic Practices for Modern Life',
    author: 'Rajesh Kumar',
    content: 'Full content about Ayurvedic practices...',
    excerpt: 'Learn how ancient Ayurvedic wisdom can be applied to modern lifestyle for better health and wellness.',
    featuredImage: '/api/placeholder/400/250',
    tags: ['ayurveda', 'wellness', 'lifestyle'],
    status: 'published',
    createdAt: '2023-08-20',
    updatedAt: '2023-08-20'
  },
  {
    id: '3',
    title: 'Sustainable Farming Methods',
    author: 'Priya Sharma',
    content: 'Full content about sustainable farming...',
    excerpt: 'Explore eco-friendly farming techniques that help preserve our environment while producing quality crops.',
    tags: ['sustainability', 'farming', 'eco-friendly'],
    status: 'draft',
    createdAt: '2023-08-25',
    updatedAt: '2023-08-25'
  },
  {
    id: '4',
    title: 'Herbal Remedies for Common Ailments',
    author: 'Dr. Sarah Chen',
    content: 'Full content about herbal remedies...',
    excerpt: 'Natural solutions for everyday health issues using traditional herbal knowledge.',
    featuredImage: '/api/placeholder/400/250',
    tags: ['herbal', 'remedies', 'health'],
    status: 'published',
    createdAt: '2023-09-01',
    updatedAt: '2023-09-01'
  }
];

export async function fetchBlogs(): Promise<Blog[]> {
  await new Promise(resolve => setTimeout(resolve, 800));
  return [...mockBlogs];
}

export async function addBlog(blog: Omit<Blog, 'id' | 'createdAt' | 'updatedAt'>): Promise<Blog> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newBlog: Blog = {
    ...blog,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockBlogs.push(newBlog);
  return newBlog;
}

export async function updateBlog(id: string, updates: Partial<Omit<Blog, 'id' | 'createdAt'>>): Promise<Blog> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const blogIndex = mockBlogs.findIndex(blog => blog.id === id);
  if (blogIndex === -1) {
    throw new Error('Blog not found');
  }
  mockBlogs[blogIndex] = {
    ...mockBlogs[blogIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  return mockBlogs[blogIndex];
}

export async function deleteBlog(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const blogIndex = mockBlogs.findIndex(blog => blog.id === id);
  if (blogIndex === -1) {
    throw new Error('Blog not found');
  }
  mockBlogs.splice(blogIndex, 1);
}

export async function getBlog(id: string): Promise<Blog> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const blog = mockBlogs.find(blog => blog.id === id);
  if (!blog) {
    throw new Error('Blog not found');
  }
  return blog;
}
