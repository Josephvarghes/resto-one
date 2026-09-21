def test_login_success(client):
    res = client.post("/api/auth/login", json={"name": "admin", "password": "admin123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "admin"
    assert data["name"] == "admin"


def test_login_invalid_credentials(client):
    res = client.post("/api/auth/login", json={"name": "admin", "password": "wrongpassword"})
    assert res.status_code == 401
    assert "Incorrect username or password" in res.json()["detail"]


def test_get_me(client, auth_headers):
    res = client.get("/api/auth/me", headers=auth_headers["admin"])
    assert res.status_code == 200
    assert res.json()["name"] == "admin"
    assert res.json()["role"] == "admin"


def test_role_authorization_forbidden(client, auth_headers):
    # Waiter trying to access kitchen queue should be forbidden
    res = client.get("/api/kitchen/queue", headers=auth_headers["waiter"])
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]


def test_unauthenticated_access_rejected(client):
    res = client.get("/api/kitchen/queue")
    assert res.status_code == 401
