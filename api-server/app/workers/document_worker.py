"""Document processing worker for background tasks."""
import os
import sys
from pathlib import Path

import structlog
from rq import Worker

# Add the parent directory to the path so we can import from app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.deps import redis_client

logger = structlog.get_logger()


def main():
    """Run the document processing worker."""
    logger.info("Starting document processing worker")
    
    # Create worker
    worker = Worker(['document_processing'], connection=redis_client)
    logger.info("Document worker started, listening for jobs...")
    worker.work()


if __name__ == '__main__':
    main()