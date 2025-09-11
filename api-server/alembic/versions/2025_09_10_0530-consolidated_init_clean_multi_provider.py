"""Consolidated initial migration with multi-provider architecture

Revision ID: consolidated_init
Revises: 
Create Date: 2025-09-10 05:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
import pgvector.sqlalchemy

# revision identifiers, used by Alembic.
revision = 'consolidated_init'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create tenants table
    op.create_table('tenants',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('settings', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('global_rate_limit', sa.Integer(), nullable=False, server_default='1000'),
        sa.Column('feature_flags', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )
    
    # Create AI providers master table
    op.create_table('ai_providers_master',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('base_url', sa.String(length=255), nullable=False),
        sa.Column('supported_models', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('default_settings', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    
    # Create tenant AI providers table
    op.create_table('tenant_ai_providers',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('tenant_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('ai_provider_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('provider_name', sa.String(length=100), nullable=False),
        sa.Column('api_key', sa.Text(), nullable=False),
        sa.Column('base_url', sa.String(length=255), nullable=True),
        sa.Column('custom_settings', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['ai_provider_id'], ['ai_providers_master.id'], name='fk_tenant_ai_provider_master'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tenant_id', 'ai_provider_id', name='uq_tenant_ai_provider')
    )
    
    # Create datasets table
    op.create_table('datasets',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('tenant_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('metadata', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tenant_id', 'name', name='uq_dataset_tenant_name')
    )
    
    # Create API keys table
    op.create_table('api_keys',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('tenant_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('key_hash', sa.String(length=255), nullable=False),
        sa.Column('key_prefix', sa.String(length=20), nullable=False),
        sa.Column('scopes', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('rate_limit', sa.Integer(), nullable=False, server_default='1000'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key_hash')
    )
    
    # Create bots table
    op.create_table('bots',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('tenant_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('tenant_ai_provider_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('system_prompt', sa.Text(), nullable=True),
        sa.Column('model', sa.String(length=100), nullable=False, server_default='gpt-3.5-turbo'),
        sa.Column('temperature', sa.Float(), nullable=False, server_default='0.7'),
        sa.Column('max_tokens', sa.Integer(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('allowed_domains', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('settings', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['tenant_ai_provider_id'], ['tenant_ai_providers.id'], name='fk_bot_tenant_ai_provider'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tenant_id', 'name', name='uq_bot_tenant_name')
    )
    
    # Create documents table
    op.create_table('documents',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('dataset_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('source_type', sa.String(length=50), nullable=False),
        sa.Column('source_url', sa.String(length=1000), nullable=True),
        sa.Column('file_path', sa.String(length=1000), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('content_hash', sa.String(length=64), nullable=False),
        sa.Column('tags', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('metadata', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='pending'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['dataset_id'], ['datasets.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create scopes table
    op.create_table('scopes',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('bot_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('dataset_filters', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('guardrails', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['bot_id'], ['bots.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('bot_id', 'name', name='uq_scope_bot_name')
    )
    
    # Create conversations table
    op.create_table('conversations',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('bot_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('session_id', sa.String(length=255), nullable=True),
        sa.Column('title', sa.String(length=500), nullable=True),
        sa.Column('user_ip', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['bot_id'], ['bots.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create chunks table
    op.create_table('chunks',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('document_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('embedding', pgvector.sqlalchemy.Vector(1536), nullable=True),
        sa.Column('token_count', sa.Integer(), nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=False),
        sa.Column('start_char', sa.Integer(), nullable=False),
        sa.Column('end_char', sa.Integer(), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create messages table
    op.create_table('messages',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('conversation_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('citations', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('token_usage', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('response_time_ms', sa.Integer(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('sequence_number', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create audit_logs table
    op.create_table('audit_logs',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('tenant_id', sa.UUID(as_uuid=False), nullable=True),
        sa.Column('user_id', sa.String(length=255), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('resource_type', sa.String(length=100), nullable=False),
        sa.Column('resource_id', sa.String(length=255), nullable=True),
        sa.Column('details', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('idx_tenant_ai_providers_tenant', 'tenant_ai_providers', ['tenant_id'])
    op.create_index('idx_tenant_ai_providers_provider', 'tenant_ai_providers', ['ai_provider_id'])
    op.create_index('idx_api_key_hash', 'api_keys', ['key_hash'])
    op.create_index('idx_api_key_prefix', 'api_keys', ['key_prefix'])
    op.create_index('idx_bot_tenant_ai_provider', 'bots', ['tenant_ai_provider_id'])
    op.create_index('idx_document_content_hash', 'documents', ['content_hash'])
    op.create_index('idx_document_status', 'documents', ['status'])
    op.create_index('idx_conversation_session_id', 'conversations', ['session_id'])
    op.create_index('idx_conversation_bot_id', 'conversations', ['bot_id'])
    op.create_index('idx_chunk_document_id', 'chunks', ['document_id'])
    op.create_index('idx_chunk_embedding', 'chunks', ['embedding'], postgresql_using='ivfflat', postgresql_with={'lists': 100})
    op.create_index('idx_message_conversation_id', 'messages', ['conversation_id'])
    op.create_index('idx_message_sequence', 'messages', ['conversation_id', 'sequence_number'])
    op.create_index('idx_audit_log_tenant_id', 'audit_logs', ['tenant_id'])
    op.create_index('idx_audit_log_action', 'audit_logs', ['action'])
    op.create_index('idx_audit_log_created_at', 'audit_logs', ['created_at'])
    
    # Insert default OpenAI provider
    op.execute("""
        INSERT INTO ai_providers_master (id, name, type, base_url, supported_models, default_settings, is_active)
        VALUES (
            'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
            'OpenAI',
            'openai',
            'https://api.openai.com',
            '["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gpt-4o"]',
            '{"temperature": 0.7, "max_tokens": 4000}',
            true
        )
        ON CONFLICT (name) DO NOTHING
    """)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('audit_logs')
    op.drop_table('messages')
    op.drop_table('chunks')
    op.drop_table('conversations')
    op.drop_table('scopes')
    op.drop_table('documents')
    op.drop_table('bots')
    op.drop_table('api_keys')
    op.drop_table('datasets')
    op.drop_table('tenant_ai_providers')
    op.drop_table('ai_providers_master')
    op.drop_table('tenants')