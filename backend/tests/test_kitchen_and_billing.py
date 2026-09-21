def test_kitchen_queue_and_delay(client, auth_headers):
    # Setup order
    s_res = client.post("/api/session", json={"table_no": 4})
    token = s_res.json()["session_token"]
    dishes = client.get("/api/dishes").json()

    order_res = client.post(
        "/api/orders",
        json={"items": [{"dish_id": dishes[0]["id"], "quantity": 1}]},
        headers={"X-Session-Token": token},
    )
    order_id = order_res.json()["order_id"]

    # Check kitchen queue
    queue_res = client.get("/api/kitchen/queue", headers=auth_headers["kitchen"])
    assert queue_res.status_code == 200
    queue = queue_res.json()
    assert any(o["id"] == order_id for o in queue)

    # Report kitchen delay
    delay_res = client.post(
        f"/api/kitchen/orders/{order_id}/delay",
        json={"minutes": 15, "reason": "Freshly baking bread in tandoor"},
        headers=auth_headers["kitchen"],
    )
    assert delay_res.status_code == 200
    delayed_order = delay_res.json()
    assert delayed_order["is_delayed"] is True
    assert delayed_order["delay_minutes"] == 15
    assert delayed_order["delay_reason"] == "Freshly baking bread in tandoor"


def test_billing_unpaid_vs_paid(client, auth_headers):
    # Place order
    s_res = client.post("/api/session", json={"table_no": 6})
    token = s_res.json()["session_token"]
    dishes = client.get("/api/dishes").json()

    order_res = client.post(
        "/api/orders",
        json={"items": [{"dish_id": dishes[0]["id"], "quantity": 2}]},
        headers={"X-Session-Token": token},
    )
    order_id = order_res.json()["order_id"]

    # Verify order shows in unpaid bills
    unpaid_res = client.get("/api/billing/orders?paid=false", headers=auth_headers["billing"])
    assert unpaid_res.status_code == 200
    assert any(o["id"] == order_id for o in unpaid_res.json())

    # Settle bill
    settle_res = client.post(
        f"/api/billing/orders/{order_id}/status",
        json={"status": "paid"},
        headers=auth_headers["billing"],
    )
    assert settle_res.status_code == 200

    # Verify order is now in paid list and no longer in unpaid list
    unpaid_after = client.get("/api/billing/orders?paid=false", headers=auth_headers["billing"])
    assert not any(o["id"] == order_id for o in unpaid_after.json())

    paid_res = client.get("/api/billing/orders?paid=true", headers=auth_headers["billing"])
    assert any(o["id"] == order_id for o in paid_res.json())
