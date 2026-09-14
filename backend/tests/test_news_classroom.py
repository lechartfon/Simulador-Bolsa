"""Tests de noticias, aulas y leaderboard."""


def _admin_headers(client):
    from database import SessionLocal
    from models import User

    client.post("/register", json={"email": "admin@local.test", "password": "DemoAdmin123!"})
    db = SessionLocal()
    try:
        # En tests con SQLite la sesión es otra; promovemos por email en la sesión del test si existe.
        user = db.query(User).filter(User.email == "admin@local.test").first()
        if user:
            user.role = "admin"
            db.commit()
    finally:
        db.close()
    login = client.post("/login", json={"username": "admin@local.test", "password": "DemoAdmin123!"})
    assert login.status_code == 200, login.text
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_news_validation(client, db_session):
    # Crear admin directamente en la sesión del test (SQLite temporal).
    from models import User
    from passlib.hash import bcrypt

    db_session.add(User(email="admin@local.test", hashed_password=bcrypt.hash("DemoAdmin123!"), role="admin"))
    db_session.commit()

    login = client.post("/login", json={"username": "admin@local.test", "password": "DemoAdmin123!"})
    assert login.status_code == 200, login.text
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    bad_scheme = client.post(
        "/news/", json={"title": "t", "content": "c", "url": "javascript:alert(1)"}, headers=headers
    )
    assert bad_scheme.status_code == 400

    ok = client.post(
        "/news/", json={"title": "Guía", "content": "Contenido", "url": "https://example.com/guia"}, headers=headers
    )
    assert ok.status_code == 201, ok.text

    listing = client.get("/news/").json()
    assert any(n["title"] == "Guía" for n in listing)


def test_classroom_join_and_leaderboard_masks_email(client):
    client.post("/register", json={"email": "profe@local.test", "password": "DemoTrader123!"})
    token = client.post("/login", json={"username": "profe@local.test", "password": "DemoTrader123!"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    created = client.post("/classrooms", json={"name": "Clase 1"}, headers=headers)
    assert created.status_code == 200, created.text
    classroom_id = created.json()["id"]

    client.post("/register", json={"email": "alumno@local.test", "password": "DemoTrader123!"})
    token2 = client.post("/login", json={"username": "alumno@local.test", "password": "DemoTrader123!"}).json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}
    joined = client.post("/classrooms/join", json={"code": created.json()["code"]}, headers=headers2)
    assert joined.status_code == 200, joined.text

    # Unirse dos veces debe fallar por restricción única.
    again = client.post("/classrooms/join", json={"code": created.json()["code"]}, headers=headers2)
    assert again.status_code == 400

    board = client.get(f"/classrooms/{classroom_id}/leaderboard", headers=headers).json()
    assert len(board) == 2
    assert all("alumno@local.test" not in m["email"] for m in board)
