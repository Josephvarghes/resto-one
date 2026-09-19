from datetime import datetime, timedelta, timezone
from app.core.security import get_password_hash
from app.db.session import engine, SessionLocal, Base
from app.models.models import User, GuestSession, Dish, Order, OrderItem, WaiterCall


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Users if not present
        users_data = [
            {"name": "admin", "password": "admin123", "role": "admin"},
            {"name": "waiter", "password": "waiter123", "role": "waiter"},
            {"name": "kitchen", "password": "kitchen123", "role": "kitchen"},
            {"name": "billing", "password": "billing123", "role": "billing"},
        ]

        users_map = {}
        for u in users_data:
            existing = db.query(User).filter(User.name == u["name"]).first()
            if not existing:
                user = User(
                    name=u["name"],
                    password_hash=get_password_hash(u["password"]),
                    role=u["role"],
                )
                db.add(user)
                db.flush()
                users_map[u["role"]] = user
            else:
                users_map[u["role"]] = existing

        # 2. Seed Dishes if not present
        if db.query(Dish).count() == 0:
            dishes = [
                # Starters
                Dish(
                    name="Paneer Tikka Royale",
                    price=260.0,
                    category="Starters",
                    image_url="https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80",
                    is_available=True,
                    description="Cottage cheese marinated in Kashmiri chillies, mustard oil, and hung yogurt, charred over open embers.",
                ),
                Dish(
                    name="Chilli Paneer Crisps",
                    price=240.0,
                    category="Starters",
                    image_url="https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=80",
                    is_available=True,
                    description="Wok-tossed crisp paneer cubes with bell peppers, spring onions, and spicy dark soy reduction.",
                ),
                Dish(
                    name="Truffle Mushroom Arancini",
                    price=290.0,
                    category="Starters",
                    image_url="https://images.unsplash.com/photo-1541529086526-db283c563270?w=800&auto=format&fit=crop&q=80",
                    is_available=True,
                    description="Golden arborio rice croquettes stuffed with wild forest mushrooms and aromatic black truffle aioli.",
                ),
                Dish(
                    name="Crispy Lotus Stem Honey Chilli",
                    price=250.0,
                    category="Starters",
                    image_url="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
                    is_available=True,
                    description="Thin lotus root crisps glazed with roasted sesame seeds, honey, and Sichuan chili flakes.",
                ),
                Dish(
                    name="Smoked Malai Soya Chaap",
                    price=270.0,
                    category="Starters",
                    image_url="https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80",
                    is_available=True,
                    description="Tender soya chaap steeped in cardamom-infused cream, cashew paste, and charred in the clay oven.",
                ),
                # Mains
                Dish(
                    name="Dal Makhani Grand Cru",
                    price=320.0,
                    category="Mains",
                    image_url="https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
                    is_available=True,
                    description="Slow-simmered black lentils for 24 hours with vine-ripened tomatoes, churned white butter, and fresh cream.",
                ),
                Dish(
                    name="Paneer Butter Masala",
                    price=340.0,
                    category="Mains",
                    image_url="https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80",
                    is_available=True,
                    description="Silken cottage cheese simmered in a velvety makhani gravy enriched with roasted fenugreek leaves.",
                ),
                Dish(
                    name="Dum Handi Veg Biryani",
                    price=380.0,
                    category="Mains",
                    image_url="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
                    is_available=True,
                    description="Long-grain basmati rice layered with seasonal vegetables, saffron, mint, and sealed in clay handi.",
                ),
                Dish(
                    name="Wild Mushroom Risotto",
                    price=410.0,
                    category="Mains",
                    image_url="https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=800&auto=format&fit=crop&q=80",
                    is_available=True,
                    description="Creamy carnaroli rice with porcini and shimeji mushrooms, aged parmesan, and thyme butter.",
                ),
                Dish(
                    name="Butter Naan (Basket of 2)",
                    price=90.0,
                    category="Breads",
                    image_url="https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80",
                    is_available=True,
                    description="Traditional clay oven leavened bread brushed generously with farm-fresh butter.",
                ),
                Dish(
                    name="Garlic Roti (Basket of 2)",
                    price=80.0,
                    category="Breads",
                    image_url="https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80",
                    is_available=True,
                    description="Whole wheat tandoori rotis studded with crushed roasted garlic and coriander.",
                ),
                # Desserts
                Dish(
                    name="Belgian Chocolate Fondant",
                    price=260.0,
                    category="Desserts",
                    image_url="https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80",
                    is_available=True,
                    description="Warm molten center dark chocolate lava cake paired with Madagascar vanilla bean gelato.",
                ),
                Dish(
                    name="Kesari Rasmalai Tres Leches",
                    price=240.0,
                    category="Desserts",
                    image_url="https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
                    is_available=True,
                    description="Delicate saffron cottage cheese dumplings soaked in condensed milk sponge and silver leaf.",
                ),
                Dish(
                    name="Artisanal Pistachio Kulfi",
                    price=190.0,
                    category="Desserts",
                    image_url="https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&auto=format&fit=crop&q=80",
                    is_available=True,
                    description="Dense traditional frozen dairy dessert churned with roasted Iranian pistachios and cardamom.",
                ),
                # Beverages
                Dish(
                    name="Kaffir Lime & Mint Cooler",
                    price=160.0,
                    category="Beverages",
                    image_url="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80",
                    is_available=True,
                    description="Crushed fresh garden mint, kaffir lime leaves, rock salt, and sparkling water.",
                ),
                Dish(
                    name="Smoked Peach Iced Tea",
                    price=180.0,
                    category="Beverages",
                    image_url="https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop&q=80",
                    is_available=True,
                    description="Cold brewed Darjeeling black tea infused with smoked peach purée and sweet basil.",
                ),
                Dish(
                    name="Royal Masala Chai",
                    price=110.0,
                    category="Beverages",
                    image_url="https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80",
                    is_available=True,
                    description="Assam tea leaves boiled with crushed green cardamom, ginger, cloves, and whole milk.",
                ),
            ]
            db.add_all(dishes)
            db.commit()

        # 3. Seed demo orders if none exist
        if db.query(Order).count() == 0:
            now = datetime.now(timezone.utc)
            demo_session = GuestSession(
                session_token="g_demo_guest_01",
                table_no=4,
                created_at=now - timedelta(hours=2),
                last_active=now,
            )
            db.add(demo_session)
            db.flush()

            dish_paneer = db.query(Dish).filter(Dish.name == "Paneer Tikka Royale").first()
            dish_biryani = db.query(Dish).filter(Dish.name == "Dum Handi Veg Biryani").first()
            dish_cooler = db.query(Dish).filter(Dish.name == "Kaffir Lime & Mint Cooler").first()

            # Active order #1 for demo
            order1 = Order(
                guest_session_id=demo_session.id,
                table_no=4,
                status="accepted",
                created_at=now - timedelta(minutes=25),
                updated_at=now - timedelta(minutes=15),
            )
            db.add(order1)
            db.flush()

            if dish_paneer:
                db.add(OrderItem(order_id=order1.id, dish_id=dish_paneer.id, quantity=1, price_at_order=dish_paneer.price, note="Mild spice"))
            if dish_cooler:
                db.add(OrderItem(order_id=order1.id, dish_id=dish_cooler.id, quantity=2, price_at_order=dish_cooler.price))

            # Sample historical paid order for analytics
            order_paid = Order(
                guest_session_id=demo_session.id,
                table_no=2,
                status="paid",
                created_at=now - timedelta(hours=3),
                updated_at=now - timedelta(hours=2),
            )
            db.add(order_paid)
            db.flush()

            if dish_biryani:
                db.add(OrderItem(order_id=order_paid.id, dish_id=dish_biryani.id, quantity=2, price_at_order=dish_biryani.price))

            # Sample pending waiter call
            waiter_call = WaiterCall(
                table_no=4,
                guest_session_id=demo_session.id,
                status="pending",
                created_at=now - timedelta(minutes=5),
            )
            db.add(waiter_call)

            db.commit()

        print("Database successfully seeded.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
