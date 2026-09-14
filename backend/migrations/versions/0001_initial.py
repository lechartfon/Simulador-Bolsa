"""Esquema inicial MySQL limpio."""

from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(100), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="user"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.CheckConstraint("role IN ('user', 'admin')", name="ck_user_role"),
    )
    op.create_table(
        "companies",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("symbol", sa.String(10), nullable=False, unique=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_table(
        "wallets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("balance", sa.DECIMAL(12, 2), nullable=False, server_default="50000.00"),
        sa.CheckConstraint("balance >= 0", name="ck_wallet_balance_non_negative"),
    )
    op.create_table(
        "stock_prices",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("timestamp", sa.DateTime(), nullable=False),
        sa.Column("price", sa.DECIMAL(12, 2), nullable=False),
        sa.Column("company_id", sa.Integer(), sa.ForeignKey("companies.id"), nullable=False, index=True),
        sa.CheckConstraint("price > 0", name="ck_stock_price_positive"),
    )
    op.create_index("ix_stock_prices_company_timestamp", "stock_prices", ["company_id", "timestamp"])
    op.create_table(
        "transactions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("company_id", sa.Integer(), sa.ForeignKey("companies.id"), nullable=False, index=True),
        sa.Column("type", sa.Enum("buy", "sell", name="transactiontype"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("price_per_share", sa.DECIMAL(12, 2), nullable=False),
        sa.Column("timestamp", sa.DateTime(), nullable=True),
        sa.CheckConstraint("quantity > 0", name="ck_transaction_quantity_positive"),
        sa.CheckConstraint("price_per_share > 0", name="ck_transaction_price_positive"),
    )
    op.create_index("ix_transactions_user_company", "transactions", ["user_id", "company_id"])
    op.create_table(
        "classrooms",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("code", sa.String(10), nullable=False, unique=True),
        sa.Column("creator_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_table(
        "classroom_memberships",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("classroom_id", sa.Integer(), sa.ForeignKey("classrooms.id"), nullable=False),
        sa.Column("is_teacher", sa.Boolean(), nullable=True),
        sa.Column("joined_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("user_id", "classroom_id", name="uq_membership_user_classroom"),
    )
    op.create_table(
        "news",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("content", sa.String(2000), nullable=False),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("news")
    op.drop_table("classroom_memberships")
    op.drop_table("classrooms")
    op.drop_index("ix_transactions_user_company", table_name="transactions")
    op.drop_table("transactions")
    op.drop_index("ix_stock_prices_company_timestamp", table_name="stock_prices")
    op.drop_table("stock_prices")
    op.drop_table("wallets")
    op.drop_table("companies")
    op.drop_table("users")
    sa.Enum("buy", "sell", name="transactiontype").drop(op.get_bind(), checkfirst=True)
