"""Tests mínimos de autenticación y autorización."""


def test_register_and_login(client):
    r = client.post("/register", json={"email": "Demo@Local.Test", "password": "DemoTrader123!"})
    assert r.status_code == 200, r.text

    # Email duplicado (normalizado a minúsculas)
    r2 = client.post("/register", json={"email": "demo@local.test", "password": "DemoTrader123!"})
    assert r2.status_code == 400

    # Email inválido
    r3 = client.post("/register", json={"email": "no-es-email", "password": "DemoTrader123!"})
    assert r3.status_code == 400

    # Contraseña corta
    r4 = client.post("/register", json={"email": "otro@local.test", "password": "corta"})
    assert r4.status_code == 422

    login = client.post("/login", json={"username": "demo@local.test", "password": "DemoTrader123!"})
    assert login.status_code == 200, login.text
    body = login.json()
    assert body["access_token"]
    assert body["user"]["role"] == "user"

    bad = client.post("/login", json={"username": "demo@local.test", "password": "incorrecta123"})
    assert bad.status_code == 400


def test_protected_requires_token(client):
    r = client.get("/wallet")
    assert r.status_code in (401, 403)

    r2 = client.get("/wallet", headers={"Authorization": "Bearer invalido"})
    assert r2.status_code == 401


def test_news_requires_admin(client):
    client.post("/register", json={"email": "user@local.test", "password": "DemoTrader123!"})
    login = client.post("/login", json={"username": "user@local.test", "password": "DemoTrader123!"}).json()
    headers = {"Authorization": f"Bearer {login['access_token']}"}
    r = client.post("/news/", json={"title": "t", "content": "c", "url": "https://example.com/x"}, headers=headers)
    assert r.status_code == 403
