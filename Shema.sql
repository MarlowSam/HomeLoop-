-- ============================================
-- HOMELOOP DATABASE SCHEMA
-- ============================================

CREATE DATABASE IF NOT EXISTS homeloop;
USE homeloop;

-- ============================================
-- 1️⃣ USERS TABLE
-- ============================================
CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'agent', 'admin') DEFAULT 'user',
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires DATETIME,
  failed_login_attempts INT DEFAULT 0,
  account_locked_until DATETIME,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_verification_token (verification_token),
  INDEX idx_reset_token (password_reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 2️⃣ AGENTS TABLE
-- ============================================
CREATE TABLE agents (
  agent_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  licence_number VARCHAR(100) UNIQUE NOT NULL,
  agency_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  profile_picture VARCHAR(500),
  bio TEXT,
  years_experience INT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_documents TEXT, -- JSON array of document URLs
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_licence (licence_number),
  INDEX idx_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 3️⃣ PROPERTIES TABLE
-- ============================================
CREATE TABLE properties (
  property_id INT PRIMARY KEY AUTO_INCREMENT,
  agent_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  property_type ENUM('house', 'apartment', 'condo', 'townhouse', 'land') NOT NULL,
  listing_type ENUM('sale', 'rent') NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  bedrooms INT,
  bathrooms DECIMAL(3,1),
  square_feet INT,
  lot_size INT,
  year_built YEAR,
  
  -- Address fields
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Kenya',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  
  -- Status
  status ENUM('draft', 'active', 'pending', 'sold', 'rented', 'inactive') DEFAULT 'draft',
  
  -- Features (stored as JSON)
  features JSON, -- ["parking", "pool", "garden", "security"]
  amenities JSON, -- ["gym", "elevator", "wifi"]
  
  -- Media
  images JSON, -- Array of image URLs
  video_url VARCHAR(500),
  virtual_tour_url VARCHAR(500),
  
  -- SEO
  slug VARCHAR(255) UNIQUE,
  
  -- Stats
  views_count INT DEFAULT 0,
  favorites_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at DATETIME,
  deleted_at DATETIME,
  
  FOREIGN KEY (agent_id) REFERENCES agents(user_id) ON DELETE CASCADE,
  INDEX idx_agent_id (agent_id),
  INDEX idx_status (status),
  INDEX idx_listing_type (listing_type),
  INDEX idx_property_type (property_type),
  INDEX idx_city (city),
  INDEX idx_price (price),
  INDEX idx_created (created_at),
  INDEX idx_slug (slug),
  FULLTEXT INDEX idx_search (title, description, address_line1, city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 4️⃣ FAVORITES TABLE
-- ============================================
CREATE TABLE favorites (
  favorite_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  property_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_favorite (user_id, property_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_property_id (property_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 5️⃣ PROPERTY INQUIRIES TABLE
-- ============================================
CREATE TABLE inquiries (
  inquiry_id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  user_id INT NOT NULL,
  agent_id INT NOT NULL,
  message TEXT NOT NULL,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  user_phone VARCHAR(20),
  status ENUM('new', 'read', 'replied', 'closed') DEFAULT 'new',
  replied_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(user_id) ON DELETE CASCADE,
  INDEX idx_property_id (property_id),
  INDEX idx_user_id (user_id),
  INDEX idx_agent_id (agent_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 6️⃣ REVIEWS TABLE
-- ============================================
CREATE TABLE reviews (
  review_id INT PRIMARY KEY AUTO_INCREMENT,
  agent_id INT NOT NULL,
  user_id INT NOT NULL,
  property_id INT,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (agent_id) REFERENCES agents(user_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE SET NULL,
  INDEX idx_agent_id (agent_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 7️⃣ APPOINTMENTS TABLE
-- ============================================
CREATE TABLE appointments (
  appointment_id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  user_id INT NOT NULL,
  agent_id INT NOT NULL,
  appointment_date DATETIME NOT NULL,
  appointment_type ENUM('viewing', 'consultation', 'inspection') DEFAULT 'viewing',
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(user_id) ON DELETE CASCADE,
  INDEX idx_property_id (property_id),
  INDEX idx_user_id (user_id),
  INDEX idx_agent_id (agent_id),
  INDEX idx_date (appointment_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 8️⃣ SAVED SEARCHES TABLE
-- ============================================
CREATE TABLE saved_searches (
  search_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  search_name VARCHAR(255) NOT NULL,
  search_criteria JSON NOT NULL, -- {"city": "Nairobi", "priceMin": 5000000, "priceMax": 10000000}
  email_alerts BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 9️⃣ NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  notification_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'new_message', 'appointment_confirmed', 'price_drop', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_id INT, -- property_id, inquiry_id, etc.
  related_type VARCHAR(50), -- 'property', 'inquiry', 'appointment'
  is_read BOOLEAN DEFAULT FALSE,
  read_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 🔟 ACTIVITY LOGS TABLE (for security audit)
-- ============================================
CREATE TABLE activity_logs (
  log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL, -- 'login', 'logout', 'signup', 'password_change', etc.
  ip_address VARCHAR(45),
  user_agent TEXT,
  status ENUM('success', 'failed') DEFAULT 'success',
  details JSON, -- Additional context
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample user
INSERT INTO users (email, password_hash, role, email_verified) 
VALUES 
  ('user@test.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'user', TRUE),
  ('agent@test.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'agent', TRUE);

-- Insert sample agent
INSERT INTO agents (user_id, full_name, licence_number, agency_name, phone_number, is_verified)
VALUES 
  (2, 'John Doe', 'LIC123456', 'Prime Properties Kenya', '+254700000000', TRUE);

-- Insert sample property
INSERT INTO properties (
  agent_id, title, description, property_type, listing_type, price,
  bedrooms, bathrooms, square_feet, address_line1, city, status,
  features, images, slug
) VALUES (
  2,
  'Modern 3 Bedroom Apartment in Westlands',
  'Beautiful modern apartment with stunning views of the city. Located in the heart of Westlands with easy access to shopping malls, restaurants, and schools.',
  'apartment',
  'sale',
  15000000.00,
  3,
  2.5,
  1500,
  'Mwanzi Road',
  'Nairobi',
  'active',
  '["parking", "security", "backup_generator", "water_backup"]',
  '["https://example.com/image1.jpg", "https://example.com/image2.jpg"]',
  'modern-3-bedroom-apartment-westlands'
);

-- ============================================
-- TRIGGERS (Optional - for automation)
-- ============================================

-- Update agent rating when new review is added
DELIMITER $
CREATE TRIGGER update_agent_rating_after_review
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
  UPDATE agents
  SET 
    rating = (SELECT AVG(rating) FROM reviews WHERE agent_id = NEW.agent_id AND status = 'approved'),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE agent_id = NEW.agent_id AND status = 'approved')
  WHERE user_id = NEW.agent_id;
END$
DELIMITER ;

-- Update property favorites count
DELIMITER $
CREATE TRIGGER update_favorites_count
AFTER INSERT ON favorites
FOR EACH ROW
BEGIN
  UPDATE properties
  SET favorites_count = favorites_count + 1
  WHERE property_id = NEW.property_id;
END$
DELIMITER ;

DELIMITER $
CREATE TRIGGER update_favorites_count_delete
AFTER DELETE ON favorites
FOR EACH ROW
BEGIN
  UPDATE properties
  SET favorites_count = favorites_count - 1
  WHERE property_id = OLD.property_id;
END$
DELIMITER ;

-- ============================================
-- VIEWS (Optional - for complex queries)
-- ============================================

-- View: Active properties with agent details
CREATE VIEW active_properties_view AS
SELECT 
  p.*,
  a.full_name AS agent_name,
  a.phone_number AS agent_phone,
  a.agency_name,
  a.rating AS agent_rating,
  a.total_reviews AS agent_reviews
FROM properties p
JOIN agents a ON p.agent_id = a.user_id
WHERE p.status = 'active' AND p.deleted_at IS NULL;

-- View: Agent dashboard stats
CREATE VIEW agent_stats_view AS
SELECT 
  a.user_id,
  a.full_name,
  COUNT(p.property_id) AS total_listings,
  SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) AS active_listings,
  SUM(CASE WHEN p.status = 'sold' THEN 1 ELSE 0 END) AS sold_listings,
  SUM(CASE WHEN p.status = 'rented' THEN 1 ELSE 0 END) AS rented_listings,
  SUM(p.views_count) AS total_views,
  COUNT(DISTINCT i.inquiry_id) AS total_inquiries,
  a.rating,
  a.total_reviews
FROM agents a
LEFT JOIN properties p ON a.user_id = p.agent_id AND p.deleted_at IS NULL
LEFT JOIN inquiries i ON a.user_id = i.agent_id
GROUP BY a.user_id;

-- HomeLoop Chat System Database Schema

-- 1. Conversations Table
CREATE TABLE conversations (
    conversation_id INT PRIMARY KEY AUTO_INCREMENT,
    property_id INT NOT NULL,
    buyer_id INT NOT NULL COMMENT 'references users.user_id where role=user',
    agent_id INT NOT NULL COMMENT 'references users.user_id where role=agent',
    status ENUM('active', 'archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one conversation per property-buyer-agent combo
    UNIQUE KEY unique_conversation (property_id, buyer_id, agent_id),
    
    -- Indexes for fast queries
    INDEX idx_buyer (buyer_id),
    INDEX idx_agent (agent_id),
    INDEX idx_property (property_id),
    INDEX idx_last_message (last_message_at DESC),
    
    -- Foreign keys
    FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Messages Table
CREATE TABLE messages (
    message_id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL COMMENT 'references users.user_id',
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_conversation_time (conversation_id, created_at DESC),
    INDEX idx_unread (conversation_id, is_read, sender_id),
    
    -- Foreign keys
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. User Online Status Table (for real-time presence)
CREATE TABLE user_online_status (
    user_id INT PRIMARY KEY,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    socket_id VARCHAR(255),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: Add indexes to existing tables for better chat performance
-- (Run these only if they don't exist)

-- Add index to users table for faster role lookups
CREATE INDEX idx_user_role ON users(role);

-- Add index to properties table for faster agent property lookups
CREATE INDEX idx_property_agent ON properties(agent_id);

-- Verify tables created successfully
SHOW TABLES LIKE '%conversation%';
SHOW TABLES LIKE '%message%';
SHOW TABLES LIKE '%online%';