def test_waiter_call_and_acknowledge(client, auth_headers):
    # Guest calls waiter
    s_res = client.post("/api/session", json={"table_no": 8})
    token = s_res.json()["session_token"]

    call_res = client.post("/api/waiter-call", json={"table_no": 8}, headers={"X-Session-Token": token})
    assert call_res.status_code == 200
    call_id = call_res.json()["call"]["id"]

    # Waiter checks active calls
    calls_list = client.get("/api/waiter/calls", headers=auth_headers["waiter"]).json()
    assert any(c["id"] == call_id for c in calls_list)

    # Waiter acknowledges call
    ack_res = client.post(f"/api/waiter/calls/{call_id}/ack", headers=auth_headers["waiter"])
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "acknowledged"

    # Call should no longer appear in pending calls list
    calls_after = client.get("/api/waiter/calls", headers=auth_headers["waiter"]).json()
    assert not any(c["id"] == call_id for c in calls_after)


def test_waiter_order_placement_on_behalf_of_table(client, auth_headers):
    dishes = client.get("/api/dishes").json()

    # Waiter places order for Table 9
    order_payload = {
        "table_no": 9,
        "items": [{"dish_id": dishes[0]["id"], "quantity": 3, "note": "Floor order"}],
    }
    w_order = client.post("/api/waiter/orders", json=order_payload, headers=auth_headers["waiter"])
    assert w_order.status_code == 200
    assert w_order.json()["table_no"] == 9
    order_id = w_order.json()["order_id"]

    # Check waiter orders
    orders = client.get("/api/waiter/orders", headers=auth_headers["waiter"]).json()
    assert any(o["id"] == order_id for o in orders)
