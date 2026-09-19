# Database Schema (SQLite)

```sql
-- Users (Staff)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL, -- waiter | kitchen | billing | admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Guest Sessions
CREATE TABLE guest_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_token VARCHAR(64) NOT NULL UNIQUE,
    table_no INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dishes
CREATE TABLE dishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(150) NOT NULL,
    price REAL NOT NULL,
    image_url TEXT,
    category VARCHAR(50) NOT NULL,
    is_available BOOLEAN DEFAULT 1,
    description TEXT
);

-- Orders
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_session_id INTEGER REFERENCES guest_sessions(id),
    waiter_id INTEGER REFERENCES users(id),
    table_no INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'placed', -- placed, confirmed, accepted, preparing, ready_to_serve, served, paid
    is_delayed BOOLEAN DEFAULT 0,
    delay_reason TEXT,
    delay_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    dish_id INTEGER NOT NULL REFERENCES dishes(id),
    quantity INTEGER NOT NULL,
    note TEXT,
    price_at_order REAL NOT NULL
);

-- Chat Sessions & Messages
CREATE TABLE chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_session_id INTEGER NOT NULL REFERENCES guest_sessions(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(10) NOT NULL, -- user | ai
    message TEXT NOT NULL,
    dish_recommendation_id INTEGER REFERENCES dishes(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Waiter Calls
CREATE TABLE waiter_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_no INTEGER NOT NULL,
    guest_session_id INTEGER REFERENCES guest_sessions(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | acknowledged
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Order Status Enum:
- `placed`: Order sent by guest or waiter.
- `confirmed`: Order acknowledged by front-of-house/system.
- `accepted`: Kitchen has accepted the order into preparation.
- `preparing`: Kitchen actively cooking.
- `ready_to_serve`: Kitchen marked dish as done. Ready for pickup.
- `served`: Dish delivered to table.
- `paid`: Billing staff settled payment.
