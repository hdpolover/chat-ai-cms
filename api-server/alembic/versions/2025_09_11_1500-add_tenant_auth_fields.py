"""Add tenant authentication fields

Revision ID: add_tenant_auth_fields
Revises: 0196733d92c4
Create Date: 2025-09-11 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_tenant_auth_fields'
down_revision = '0196733d92c4'
branch_labels = None
depends_on = None


def upgrade():
    # Add authentication fields to tenants table
    op.add_column('tenants', sa.Column('email', sa.String(length=255), nullable=True))
    op.add_column('tenants', sa.Column('password_hash', sa.String(length=255), nullable=True))
    op.add_column('tenants', sa.Column('is_email_verified', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('tenants', sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('tenants', sa.Column('login_attempts', sa.Integer(), nullable=False, server_default=sa.text('0')))
    op.add_column('tenants', sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True))
    
    # Create index on email for faster lookups
    op.create_index('idx_tenant_email', 'tenants', ['email'], unique=True)
    
    # Update existing tenants to have email same as owner_email (if exists)
    op.execute("""
        UPDATE tenants 
        SET email = owner_email 
        WHERE owner_email IS NOT NULL AND owner_email != '';
    """)


def downgrade():
    # Remove indexes first
    op.drop_index('idx_tenant_email', table_name='tenants')
    
    # Remove columns
    op.drop_column('tenants', 'locked_until')
    op.drop_column('tenants', 'login_attempts')
    op.drop_column('tenants', 'last_login_at')
    op.drop_column('tenants', 'is_email_verified')
    op.drop_column('tenants', 'password_hash')
    op.drop_column('tenants', 'email')