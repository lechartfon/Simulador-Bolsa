"""Tests mínimos de compra/venta: el precio lo decide el servidor."""
from decimal import Decimal

from models import Company, StockPrice, User, Wallet
from passlib.hash import bcrypt


def _auth(client, email="trader@local.test"):
    client.post("/register", json={"email": email, "password": "DemoTrader123!"})
    return client.post("/login", json={"username": email, "password": "DemoTrader123!"}).json()["access_token"]


def _seed_company(db_session, symbol="TST", name="Test SA", price="100.00"):
    company = Company(symbol=symbol, name=name)
    db_session.add(company)
    db_session.commit()
    db_session.refresh(company)
    db_session.add(StockPrice(company_id=company.id, price=Decimal(price)))
    db_session.commit()
    return company


def test_buy_uses_server_price(client, db_session):
    token = _auth(client)
    company = _seed_company(db_session)
    headers = {"Authorization": f"Bearer {token}"}

    # Aunque el cliente intente enviar otro precio, la API lo ignora (ya no lo acepta).
    r = client.post("/comprar", json={"company_id": company.id, "quantity": 2}, headers=headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["detalles"]["precio_por_accion"] == 100.0
    assert body["detalles"]["costo_total"] == 200.0

    wallet = client.get("/wallet", headers=headers).json()
    assert wallet["balance"] == 50000 - 200.0


def test_buy_rejects_bad_quantity(client, db_session):
    token = _auth(client, "trader2@local.test")
    company = _seed_company(db_session, symbol="TST2", name="Test 2 SA")
    headers = {"Authorization": f"Bearer {token}"}
    for qty in (0, -3):
        r = client.post("/comprar", json={"company_id": company.id, "quantity": qty}, headers=headers)
        assert r.status_code == 422, r.text


def test_buy_insufficient_funds(client, db_session):
    token = _auth(client, "pobre@local.test")
    company = _seed_company(db_session, symbol="CARO", name="Cara SA", price="60000.00")
    headers = {"Authorization": f"Bearer {token}"}
    r = client.post("/comprar", json={"company_id": company.id, "quantity": 1}, headers=headers)
    assert r.status_code == 400


def test_sell_flow_and_limits(client, db_session):
    token = _auth(client, "vendedor@local.test")
    company = _seed_company(db_session, symbol="VND", name="Vende SA", price="50.00")
    headers = {"Authorization": f"Bearer {token}"}

    # Vender sin tener acciones
    r = client.post("/vender", json={"company_id": company.id, "quantity": 1}, headers=headers)
    assert r.status_code == 400

    # Comprar y vender
    assert client.post("/comprar", json={"company_id": company.id, "quantity": 4}, headers=headers).status_code == 200
    ok = client.post("/vender", json={"company_id": company.id, "quantity": 3}, headers=headers)
    assert ok.status_code == 200, ok.text
    assert ok.json()["detalles"]["dinero_recibido"] == 150.0

    # Vender más de lo disponible
    too_much = client.post("/vender", json={"company_id": company.id, "quantity": 5}, headers=headers)
    assert too_much.status_code == 400
