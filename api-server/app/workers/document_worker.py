"""Document processing worker for background tasks."""
import os
import sys
import time
from pathlib import Path

import structlog
import redis
from rq import Worker
from rq.exceptions import NoSuchJobError

# Add the parent directory to the path so we can import from app
sys.path.insert(0, str(Path(__file__).parent.parent))

logger = structlog.get_logger()


def main():
    """Run the document processing worker with error handling."""
    logger.info("Starting document processing worker")
    
    # Create Redis connection for RQ (without decode_responses)
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_conn = redis.from_url(redis_url, decode_responses=False)
    
    max_retries = 3
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            # Clear any stale data from Redis to avoid compatibility issues
            logger.info("Cleaning up stale Redis data...")
            try:
                # Clear RQ related keys that might have compatibility issues
                keys = redis_conn.keys(b'rq:queue:*:intermediate')
                if keys:
                    redis_conn.delete(*keys)
                    logger.info(f"Cleared {len(keys)} stale intermediate queue keys")
            except Exception as e:
                logger.warning(f"Could not clear stale data: {e}")
            
            # Create worker with error handling
            worker = Worker(['document_processing'], connection=redis_conn)
            logger.info("Document worker started, listening for jobs...")
            
            # Start worker
            worker.work(with_scheduler=True)
            
        except KeyboardInterrupt:
            logger.info("Worker stopped by user")
            break
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            retry_count += 1
            if retry_count < max_retries:
                logger.info(f"Retrying worker startup ({retry_count}/{max_retries})...")
                time.sleep(5)
            else:
                logger.error("Max retries reached, exiting")
                break


if __name__ == '__main__':
    main()