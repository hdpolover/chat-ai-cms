"""Job queue service for background tasks."""
import os
import structlog
from rq import Queue
import redis

from .document_processing_service import process_document_sync

logger = structlog.get_logger()


class JobQueueService:
    """Service for managing background job queues."""

    def __init__(self):
        """Initialize the job queue service."""
        # Create Redis connection specifically for RQ (without decode_responses)
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis_conn = redis.from_url(redis_url, decode_responses=False)
        self.document_queue = Queue('document_processing', connection=self.redis_conn)

    def enqueue_document_processing(self, document_id: str) -> str:
        """
        Enqueue a document for background processing.
        
        Args:
            document_id: The ID of the document to process
            
        Returns:
            str: The job ID
        """
        try:
            job = self.document_queue.enqueue(
                process_document_sync,
                document_id,
                job_timeout='10m',  # 10 minute timeout
                result_ttl=3600,    # Keep results for 1 hour
                failure_ttl=86400   # Keep failures for 24 hours
            )
            
            logger.info(
                "Document processing job enqueued",
                document_id=document_id,
                job_id=job.id
            )
            
            return job.id
            
        except Exception as e:
            logger.error(
                "Failed to enqueue document processing job",
                document_id=document_id,
                error=str(e)
            )
            raise

    def get_job_status(self, job_id: str) -> dict:
        """
        Get the status of a job.
        
        Args:
            job_id: The ID of the job
            
        Returns:
            dict: Job status information
        """
        try:
            from rq.job import Job
            
            job = Job.fetch(job_id, connection=self.redis_conn)
            
            return {
                'job_id': job_id,
                'status': job.get_status(),
                'result': job.result,
                'exc_info': job.exc_info,
                'created_at': job.created_at.isoformat() if job.created_at else None,
                'started_at': job.started_at.isoformat() if job.started_at else None,
                'ended_at': job.ended_at.isoformat() if job.ended_at else None
            }
            
        except Exception as e:
            logger.error(
                "Failed to get job status",
                job_id=job_id,
                error=str(e)
            )
            return {
                'job_id': job_id,
                'status': 'not_found',
                'error': str(e)
            }

    def get_queue_info(self) -> dict:
        """
        Get information about the document processing queue.
        
        Returns:
            dict: Queue information
        """
        try:
            return {
                'queue_name': 'document_processing',
                'length': len(self.document_queue),
                'failed_job_count': self.document_queue.failed_job_registry.count,
                'scheduled_job_count': self.document_queue.scheduled_job_registry.count,
                'started_job_count': self.document_queue.started_job_registry.count,
                'deferred_job_count': self.document_queue.deferred_job_registry.count
            }
            
        except Exception as e:
            logger.error(
                "Failed to get queue info",
                error=str(e)
            )
            return {'error': str(e)}


# Global instance
job_queue_service = JobQueueService()