def test_guest_session_and_menu(client):
    # Create guest session
    res = client.post("/api/session", json={"table_no": 7})
    assert res.status_code == 200
    session_data = res.json()
    assert "session_token" in session_data
    assert session_data["table_no"] == 7

    # Get dishes
    dishes_res = client.get("/api/dishes")
    assert dishes_res.status_code == 200
    dishes = dishes_res.json()
    assert len(dishes) >= 5


def test_order_placement_and_total_calculation(client):
    # Session
    s_res = client.post("/api/session", json={"table_no": 3})
    token = s_res.json()["session_token"]

    # Dishes
    dishes = client.get("/api/dishes").json()
    dish_1 = dishes[0]  # price: 260.0
    dish_2 = dishes[1]  # price: 320.0

    # Place order: 2x dish_1 (520) + 1x dish_2 (320) = 840
    order_payload = {
        "table_no": 3,
        "items": [
            {"dish_id": dish_1["id"], "quantity": 2, "note": "Medium spice"},
            {"dish_id": dish_2["id"], "quantity": 1},
        ],
    }
    order_res = client.post(
        "/api/orders",
        json=order_payload,
        headers={"X-Session-Token": token},
    )
    assert order_res.status_code == 200
    order_id = order_res.json()["order_id"]
    assert order_res.json()["status"] == "placed"

    # Verify history
    hist_res = client.get("/api/orders/history", headers={"X-Session-Token": token})
    assert hist_res.status_code == 200
    orders = hist_res.json()
    assert len(orders) == 1
    assert orders[0]["id"] == order_id
    expected_total = round((dish_1["price"] * 2) + (dish_2["price"] * 1), 2)
    assert orders[0]["total_amount"] == expected_total
    assert len(orders[0]["items"]) == 2


def test_full_order_lifecycle(client, auth_headers):
    # 1. Place order
    s_res = client.post("/api/session", json={"table_no": 2})
    token = s_res.json()["session_token"]
    dishes = client.get("/api/dishes").json()

    order_res = client.post(
        "/api/orders",
        json={"items": [{"dish_id": dishes[0]["id"], "quantity": 1}]},
        headers={"X-Session-Token": token},
    )
    order_id = order_res.json()["order_id"]

    # 2. Kitchen accepts order
    accept_res = client.post(f"/api/kitchen/orders/{order_id}/accept", headers=auth_headers["kitchen"])
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "accepted"

    # 3. Kitchen marks done -> ready_to_serve
    done_res = client.post(f"/api/kitchen/orders/{order_id}/done", headers=auth_headers["kitchen"])
    assert done_res.status_code == 200
    assert done_res.json()["status"] == "ready_to_serve"

    # 4. Billing marks served
    served_res = client.post(
        f"/api/billing/orders/{order_id}/status",
        json={"status": "served"},
        headers=auth_headers["billing"],
    )
    assert served_res.status_code == 200
    assert served_res.json()["status"] == "served"

    # 5. Billing marks paid
    paid_res = client.post(
        f"/api/billing/orders/{order_id}/status",
        json={"status": "paid"},
        headers=auth_headers["billing"],
    )
    assert paid_res.status_code == 200
    assert paid_res.json()["status"] == "paid"
