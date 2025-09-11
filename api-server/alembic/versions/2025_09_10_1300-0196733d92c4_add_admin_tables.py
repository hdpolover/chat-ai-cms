"""add_admin_tables

Revision ID: 0196733d92c4
Revises: consolidated_init
Create Date: 2025-09-10 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0196733d92c4'
down_revision = 'consolidated_init'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create admin_users table
    op.create_table('admin_users',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='admin'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('idx_admin_user_email', 'admin_users', ['email'])

    # Create system_settings table
    op.create_table('system_settings',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('key', sa.String(length=255), nullable=False),
        sa.Column('value', sa.JSON(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key')
    )
    op.create_index('idx_system_settings_key', 'system_settings', ['key'])

    # Create global_ai_providers table
    op.create_table('global_ai_providers',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('provider_type', sa.String(length=50), nullable=False),
        sa.Column('config', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index('idx_global_ai_provider_type', 'global_ai_providers', ['provider_type'])

    # Update tenants table to add missing fields from the model
    op.add_column('tenants', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('tenants', sa.Column('owner_email', sa.String(length=255), nullable=True))
    op.add_column('tenants', sa.Column('plan', sa.String(length=50), nullable=False, server_default='free'))

    # Insert default system settings
    op.execute("""
        INSERT INTO system_settings (id, key, value, description) VALUES
        (
            gen_random_uuid(),
            'ai_provider_default',
            '"openai"',
            'Default AI provider for new tenants'
        ),
        (
            gen_random_uuid(),
            'max_tenants_per_plan',
            '{"free": 10, "pro": 100, "enterprise": 1000}',
            'Maximum tenants allowed per plan'
        ),
        (
            gen_random_uuid(),
            'rate_limits',
            '{"requests_per_minute": 60, "tokens_per_day": 100000}',
            'Default rate limits for API usage'
        ),
        (
            gen_random_uuid(),
            'maintenance_mode',
            'false',
            'System maintenance mode toggle'
        ),
        (
            gen_random_uuid(),
            'registration_enabled',
            'true',
            'Allow new tenant registration'
        )
        ON CONFLICT (key) DO NOTHING
    """)

    # Insert default global AI providers
    op.execute("""
        INSERT INTO global_ai_providers (id, name, provider_type, config, is_active, is_default) VALUES
        (
            gen_random_uuid(),
            'OpenAI',
            'openai',
            '{"base_url": "https://api.openai.com", "models": ["gpt-3.5-turbo", "gpt-4", "gpt-4o"]}',
            true,
            true
        ),
        (
            gen_random_uuid(),
            'Anthropic',
            'anthropic',
            '{"base_url": "https://api.anthropic.com", "models": ["claude-3-sonnet", "claude-3-opus"]}',
            true,
            false
        ),
        (
            gen_random_uuid(),
            'Azure OpenAI',
            'azure',
            '{"base_url": "", "models": ["gpt-3.5-turbo", "gpt-4"]}',
            false,
            false
        )
        ON CONFLICT (name) DO NOTHING
    """)


def downgrade() -> None:
    # Remove added columns from tenants table
    op.drop_column('tenants', 'plan')
    op.drop_column('tenants', 'owner_email')
    op.drop_column('tenants', 'description')
    
    # Drop admin tables
    op.drop_table('global_ai_providers')
    op.drop_table('system_settings')
    op.drop_table('admin_users')