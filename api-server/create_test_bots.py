#!/usr/bin/env python3
"""
Script to create test bots for the tenant.
"""

import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from uuid import uuid4
from datetime import datetime

# Database URL for Docker setup
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/chatbot_db"

def create_test_bots():
    """Create test bots for the tenant."""
    
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    
    with Session() as session:
        try:
            # Get tenant and AI providers
            result = session.execute(
                text("""
                    SELECT 
                        t.id as tenant_id,
                        tap.id as provider_id,
                        tap.provider_name
                    FROM tenants t
                    LEFT JOIN tenant_ai_providers tap ON t.id = tap.tenant_id
                    WHERE t.email = 'tenant@example.com' AND tap.is_active = true
                """)
            )
            
            providers = result.fetchall()
            
            if not providers:
                print("❌ No active AI providers found for tenant")
                return
            
            # Create test bots for each provider
            for provider in providers:
                tenant_id, provider_id, provider_name = provider
                
                # Check if bot already exists
                existing = session.execute(
                    text("SELECT id FROM bots WHERE tenant_ai_provider_id = :provider_id"),
                    {"provider_id": provider_id}
                ).fetchone()
                
                if existing:
                    print(f"✅ Bot already exists for {provider_name}")
                    continue
                
                bot_id = str(uuid4())
                
                # Determine model and settings based on provider
                if provider_name.lower() == 'openai':
                    model = 'gpt-3.5-turbo'
                    bot_name = 'OpenAI Assistant'
                    system_prompt = 'You are a helpful AI assistant powered by OpenAI.'
                elif provider_name.lower() == 'anthropic':
                    model = 'claude-3-haiku-20240307'
                    bot_name = 'Claude Assistant'
                    system_prompt = 'You are Claude, an AI assistant created by Anthropic.'
                else:
                    model = 'gpt-3.5-turbo'
                    bot_name = f'{provider_name} Assistant'
                    system_prompt = f'You are an AI assistant powered by {provider_name}.'
                
                # Insert bot
                session.execute(
                    text("""
                        INSERT INTO bots (
                            id, name, description, tenant_id, tenant_ai_provider_id,
                            model, system_prompt, temperature, max_tokens, is_active,
                            settings, is_public, allowed_domains, created_at, updated_at
                        ) VALUES (
                            :id, :name, :description, :tenant_id, :provider_id,
                            :model, :system_prompt, :temperature, :max_tokens, :is_active,
                            :settings, :is_public, :allowed_domains, :created_at, :updated_at
                        )
                    """),
                    {
                        "id": bot_id,
                        "name": bot_name,
                        "description": f"Test bot using {provider_name} for demonstration",
                        "tenant_id": tenant_id,
                        "provider_id": provider_id,
                        "model": model,
                        "system_prompt": system_prompt,
                        "temperature": 0.7,
                        "max_tokens": 2048,
                        "is_active": True,
                        "settings": "{}",
                        "is_public": False,
                        "allowed_domains": "{}",
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                )
                
                print(f"✅ Created bot: {bot_name} (ID: {bot_id}) with {provider_name}")
            
            session.commit()
            print("✅ All test bots created successfully")
            
        except Exception as e:
            print(f"❌ Error creating bots: {e}")
            session.rollback()
        finally:
            engine.dispose()

if __name__ == "__main__":
    create_test_bots()