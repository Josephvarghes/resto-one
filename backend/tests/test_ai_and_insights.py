def test_ai_chat_concierge(client):
    # Setup session
    s_res = client.post("/api/session", json={"table_no": 5})
    token = s_res.json()["session_token"]

    # Initial history contains welcome message
    hist_res = client.get("/api/chat/history", headers={"X-Session-Token": token})
    assert hist_res.status_code == 200
    assert len(hist_res.json()) >= 1
    assert hist_res.json()[0]["sender"] == "ai"

    # Send user message asking for spicy dish
    chat_res = client.post(
        "/api/chat/message",
        json={"message": "I would love something spicy and crispy for starters"},
        headers={"X-Session-Token": token},
    )
    assert chat_res.status_code == 200
    data = chat_res.json()
    assert data["sender"] == "ai"
    assert len(data["message"]) > 0

    # Recommendation card should be attached
    if data.get("dish_recommendation"):
        assert "name" in data["dish_recommendation"]
        assert "price" in data["dish_recommendation"]


def test_admin_analytics_and_force_refresh_insights(client, auth_headers):
    # 1. Check Analytics
    analytics_res = client.get("/api/admin/analytics?range=daily", headers=auth_headers["admin"])
    assert analytics_res.status_code == 200
    adata = analytics_res.json()
    assert "total_orders" in adata
    assert "total_revenue" in adata
    assert "top_selling_dishes" in adata

    # 2. Get Insights (cached initially)
    insights_res_1 = client.get("/api/admin/insights", headers=auth_headers["admin"])
    assert insights_res_1.status_code == 200
    data_1 = insights_res_1.json()
    assert "insights" in data_1
    assert len(data_1["insights"]) == 3

    # Subsequent request without force returns cached = True
    insights_res_2 = client.get("/api/admin/insights", headers=auth_headers["admin"])
    assert insights_res_2.status_code == 200
    data_2 = insights_res_2.json()
    assert data_2["cached"] is True

    # 3. Test force=true parameter busts cache
    insights_res_forced = client.get("/api/admin/insights?force=true", headers=auth_headers["admin"])
    assert insights_res_forced.status_code == 200
    data_forced = insights_res_forced.json()
    assert data_forced["cached"] is False
    assert len(data_forced["insights"]) == 3
