#!/usr/bin/env python3
"""
Fix Redis connection configuration for RQ compatibility
"""
import os
import redis
from rq import Queue

# Create Redis connection specifically for RQ without decode_responses
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Create Redis client for RQ (without decode_responses)
redis_rq_client = redis.from_url(REDIS_URL, decode_responses=False)

# Test connection and clear problematic keys
print("🔧 Fixing Redis RQ Connection...")

try:
    # Test basic connection
    redis_rq_client.ping()
    print("✅ Redis connection working")
    
    # Clear RQ-related keys that might have encoding issues
    patterns_to_clear = [
        'rq:*',
        'rq:queue:*',
        'rq:job:*',
        'rq:worker:*',
        'rq:pubsub:*'
    ]
    
    for pattern in patterns_to_clear:
        keys = redis_rq_client.keys(pattern)
        if keys:
            redis_rq_client.delete(*keys)
            print(f"🧹 Cleared {len(keys)} keys matching {pattern}")
    
    # Test queue creation
    queue = Queue('document_processing', connection=redis_rq_client)
    print(f"✅ Queue created successfully, length: {len(queue)}")
    
    print("🎉 Redis RQ connection fixed!")
    print("Restart the worker now: docker restart chataicmsapi-worker-1")
    
except Exception as e:
    print(f"❌ Error: {e}")