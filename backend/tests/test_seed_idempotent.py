"""El seed debe poder ejecutarse dos veces sin duplicar."""
from seed import seed_companies_and_prices, seed_demo_activity


def test_seed_is_idempotent(db_session):
    companies = seed_companies_and_prices(db_session)
    seed_demo_activity(db_session, companies)

    from models import Classroom, Company, News, User

    n_users = db_session.query(User).count()
    n_companies = db_session.query(Company).count()
    n_news = db_session.query(News).count()
    n_class = db_session.query(Classroom).count()

    companies2 = seed_companies_and_prices(db_session)
    seed_demo_activity(db_session, companies2)

    assert db_session.query(User).count() == n_users
    assert db_session.query(Company).count() == n_companies
    assert db_session.query(News).count() == n_news
    assert db_session.query(Classroom).count() == n_class
