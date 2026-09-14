"""Aplica migraciones Alembic. Uso: python migrate.py"""
import os
from alembic import command
from alembic.config import Config

HERE = os.path.dirname(__file__)


def main() -> None:
    cfg = Config(os.path.join(HERE, "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(HERE, "migrations"))
    command.upgrade(cfg, "head")


if __name__ == "__main__":
    main()
