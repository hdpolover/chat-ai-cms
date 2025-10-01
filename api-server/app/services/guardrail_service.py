"""Service for managing bot guardrails and scope restrictions."""
import structlog
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Bot, Scope
from ..schemas import ChatMessage

logger = structlog.get_logger()


class GuardrailService:
    """Service for enforcing bot guardrails and scope restrictions."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def validate_query(self, bot: Bot, message_content: str) -> Tuple[bool, Optional[str]]:
        """
        Validate if a user query is within the bot's allowed scope.
        
        Returns:
            Tuple[bool, Optional[str]]: (is_allowed, refusal_or_redirect_message)
        """
        if not bot.scopes:
            # No scopes configured, allow all queries
            return True, None

        # Check each scope's guardrails
        for scope in bot.scopes:
            if not scope.is_active:
                continue

            guardrails = scope.guardrails or {}
            strictness_level = guardrails.get("strictness_level", "moderate")  # strict, moderate, lenient
            
            # Check topic restrictions based on strictness level
            allowed_topics = guardrails.get("allowed_topics", [])
            forbidden_topics = guardrails.get("forbidden_topics", [])
            
            # Handle forbidden topics first (always blocked regardless of strictness)
            if forbidden_topics and self._matches_topics(message_content, forbidden_topics):
                response_message = self._get_smart_response(message_content, guardrails, scope.name, "forbidden")
                logger.info(
                    "Query blocked by forbidden topics",
                    bot_id=bot.id,
                    scope=scope.name,
                    strictness=strictness_level,
                    query_preview=message_content[:100]
                )
                return False, response_message
            
            # Handle allowed topics based on strictness level
            if allowed_topics:
                topic_match_strength = self._get_topic_match_strength(message_content, allowed_topics)
                
                if strictness_level == "strict":
                    # Must have strong topic match
                    if topic_match_strength < 0.7:
                        response_message = self._get_smart_response(message_content, guardrails, scope.name, "off_topic")
                        logger.info(
                            "Query blocked by strict topic restrictions",
                            bot_id=bot.id,
                            scope=scope.name,
                            match_strength=topic_match_strength,
                            query_preview=message_content[:100]
                        )
                        return False, response_message
                        
                elif strictness_level == "moderate":
                    # Allow some flexibility, redirect if somewhat related
                    if topic_match_strength < 0.3:
                        response_message = self._get_smart_response(message_content, guardrails, scope.name, "redirect")
                        logger.info(
                            "Query redirected by moderate topic restrictions",
                            bot_id=bot.id,
                            scope=scope.name,
                            match_strength=topic_match_strength,
                            query_preview=message_content[:100]
                        )
                        return False, response_message
                    elif topic_match_strength < 0.5:
                        # Partially related, allow but add guidance
                        return True, None  # Let it through with system prompt guidance
                        
                elif strictness_level == "lenient":
                    # Very flexible, only block clearly unrelated topics
                    if topic_match_strength < 0.1:
                        response_message = self._get_smart_response(message_content, guardrails, scope.name, "gentle_redirect")
                        logger.info(
                            "Query gently redirected by lenient restrictions",
                            bot_id=bot.id,
                            scope=scope.name,
                            match_strength=topic_match_strength,
                            query_preview=message_content[:100]
                        )
                        return False, response_message

        return True, None

    def _matches_topics(self, content: str, topics: List[str]) -> bool:
        """Check if content matches any of the specified topics."""
        return self._get_topic_match_strength(content, topics) > 0.3
    
    def _get_topic_match_strength(self, content: str, topics: List[str]) -> float:
        """Get the strength of topic matching (0.0 to 1.0)."""
        content_lower = content.lower()
        max_strength = 0.0
        
        for topic in topics:
            topic_lower = topic.lower()
            strength = 0.0
            
            # Direct topic match (highest strength)
            if topic_lower in content_lower:
                strength = max(strength, 1.0)
            
            # Partial word matches
            content_words = content_lower.split()
            topic_words = topic_lower.split()
            
            # Check for word overlap
            matching_words = set(content_words) & set(topic_words)
            if matching_words:
                overlap_ratio = len(matching_words) / len(topic_words)
                strength = max(strength, 0.6 * overlap_ratio)
            
            # Domain-specific indicators
            strength = max(strength, self._get_domain_specific_strength(content_lower, topics))
            
            # Support-specific intelligence for common support queries
            if any(support_term in topics for support_term in ['support', 'help', 'account', 'login', 'technical']):
                support_indicators = ['password', 'reset', 'login', 'account', 'profile', 'username', 
                                    'recover', 'access', 'issue', 'problem', 'help', 'support']
                if any(indicator in content_lower for indicator in support_indicators):
                    strength = max(strength, 0.8)  # High strength for support queries
            
            max_strength = max(max_strength, strength)
        
        return min(max_strength, 1.0)
    
    def _get_domain_specific_strength(self, content_lower: str, topics: List[str]) -> float:
        """Get domain-specific matching strength based on topic categories."""
        # Math domain indicators
        if any(math_topic in [t.lower() for t in topics] for math_topic in ['math', 'mathematics', 'algebra', 'calculus', 'geometry']):
            math_indicators = [
                'derivative', 'integral', 'limit', 'theorem', 'proof', 'equation', 'formula',
                'solve', 'calculate', 'compute', 'factor', 'expand', 'simplify', 'graph',
                'function', 'variable', 'coefficient', 'polynomial', 'quadratic', 'linear',
                'trigonometry', 'sine', 'cosine', 'tangent', 'logarithm', 'exponential',
                'matrix', 'vector', 'angle', 'triangle', 'circle', 'radius', 'diameter',
                'area', 'volume', 'perimeter', 'pythagorean', 'hypotenuse', 'adjacent',
                'probability', 'statistics', 'mean', 'median', 'mode', 'standard deviation',
                'fraction', 'decimal', 'percentage', 'ratio', 'proportion', 'number'
            ]
            math_symbols = ['+', '-', '*', '/', '=', '<', '>', '≤', '≥', '²', '³', 'x^', 'y=']
            
            # Strong indicators
            strong_matches = sum(1 for indicator in math_indicators if indicator in content_lower)
            symbol_matches = sum(1 for symbol in math_symbols if symbol in content_lower)
            
            if strong_matches >= 2 or symbol_matches >= 1:
                return 0.8
            elif strong_matches >= 1:
                return 0.6
        
        # Customer support domain indicators
        if any(support_topic in [t.lower() for t in topics] for support_topic in ['support', 'customer support', 'technical support', 'help']):
            support_indicators = [
                'help', 'issue', 'problem', 'bug', 'error', 'fix', 'broken', 'not working',
                'account', 'login', 'password', 'billing', 'payment', 'subscription',
                'refund', 'cancel', 'upgrade', 'downgrade', 'feature', 'how to', 'tutorial'
            ]
            
            matches = sum(1 for indicator in support_indicators if indicator in content_lower)
            if matches >= 2:
                return 0.7
            elif matches >= 1:
                return 0.5
        
        return 0.0

    def _get_smart_response(self, query: str, guardrails: Dict[str, Any], scope_name: str, response_type: str) -> str:
        """Get intelligent response based on query and response type."""
        allowed_topics = guardrails.get("allowed_topics", [])
        custom_message = guardrails.get("refusal_message")
        
        # Use custom message if provided and it's a strict refusal
        if custom_message and response_type in ["forbidden", "off_topic"]:
            return custom_message
        
        # Generate context-aware responses
        if response_type == "forbidden":
            return f"I can't discuss that topic. Let me help you with {self._get_topic_examples(allowed_topics)} instead. What would you like to know?"
        
        elif response_type == "off_topic":
            return f"That's outside my area of expertise. I specialize in {self._get_topic_examples(allowed_topics)}. How can I help you with these topics?"
        
        elif response_type == "redirect":
            closest_topic = self._find_closest_topic(query, allowed_topics)
            if closest_topic:
                return f"I see you're asking about something that might relate to {closest_topic}. I'd be happy to help with {self._get_topic_examples(allowed_topics)}. Could you rephrase your question to focus on these areas?"
            else:
                return f"I specialize in {self._get_topic_examples(allowed_topics)}. How can I help you with one of these topics instead?"
        
        elif response_type == "gentle_redirect":
            return f"While that's interesting, I'm best at helping with {self._get_topic_examples(allowed_topics)}. Is there anything in these areas I can assist you with?"
        
        # Fallback
        return f"I focus on {self._get_topic_examples(allowed_topics)}. What can I help you with in these areas?"
    
    def _get_topic_examples(self, topics: List[str]) -> str:
        """Get a friendly string of topic examples."""
        if not topics:
            return "my specialized areas"
        
        if len(topics) <= 3:
            return ", ".join(topics)
        else:
            return f"{', '.join(topics[:3])} and other related topics"
    
    def _find_closest_topic(self, query: str, topics: List[str]) -> Optional[str]:
        """Find the topic most similar to the query."""
        query_lower = query.lower()
        best_match = None
        best_score = 0.0
        
        for topic in topics:
            # Simple word overlap scoring
            query_words = set(query_lower.split())
            topic_words = set(topic.lower().split())
            
            if topic_words & query_words:  # If there's any overlap
                score = len(topic_words & query_words) / len(topic_words | query_words)
                if score > best_score:
                    best_score = score
                    best_match = topic
        
        return best_match if best_score > 0.1 else None

    def build_knowledge_restriction_prompt(self, bot: Bot) -> str:
        """Build system prompt additions for knowledge restrictions."""
        if not bot.scopes:
            return ""

        restrictions = []
        
        for scope in bot.scopes:
            if not scope.is_active:
                continue

            guardrails = scope.guardrails or {}
            strictness_level = guardrails.get("strictness_level", "moderate")
            
            # Knowledge boundaries
            knowledge_boundaries = guardrails.get("knowledge_boundaries", {})
            if knowledge_boundaries:
                strict_mode = knowledge_boundaries.get("strict_mode", False)
                allowed_sources = knowledge_boundaries.get("allowed_sources", [])
                
                if strict_mode:
                    restrictions.append(
                        "IMPORTANT: You must ONLY use information from the provided context and knowledge base. "
                        "Do not use your general training knowledge for answers."
                    )
                
                if allowed_sources:
                    sources_str = ", ".join(allowed_sources)
                    restrictions.append(f"Only reference information from these sources: {sources_str}")

            # Topic restrictions with strictness-aware guidance
            allowed_topics = guardrails.get("allowed_topics", [])
            forbidden_topics = guardrails.get("forbidden_topics", [])
            
            if allowed_topics:
                topics_str = ", ".join(allowed_topics)
                
                if strictness_level == "strict":
                    restrictions.append(
                        f"You ONLY answer questions directly related to: {topics_str}. "
                        f"Refuse any questions outside these exact topics."
                    )
                elif strictness_level == "moderate":
                    restrictions.append(
                        f"You specialize in: {topics_str}. "
                        f"For questions somewhat related to these topics, provide helpful guidance. "
                        f"For unrelated questions, politely redirect to your areas of expertise."
                    )
                elif strictness_level == "lenient":
                    restrictions.append(
                        f"Your primary expertise is in: {topics_str}. "
                        f"Try to be helpful while gently guiding conversations toward these topics when appropriate."
                    )
            
            if forbidden_topics:
                topics_str = ", ".join(forbidden_topics)
                restrictions.append(
                    f"Never discuss or provide information about: {topics_str}. "
                    f"Always decline such requests politely."
                )

            # Response guidelines
            response_guidelines = guardrails.get("response_guidelines", {})
            if response_guidelines:
                max_length = response_guidelines.get("max_response_length")
                if max_length:
                    restrictions.append(f"Keep responses under {max_length} words.")
                
                citation_required = response_guidelines.get("require_citations", False)
                if citation_required:
                    restrictions.append("Always cite your sources when using information from the context.")
                    
                friendly_tone = response_guidelines.get("maintain_friendly_tone", True)
                if friendly_tone:
                    restrictions.append("Always maintain a helpful and friendly tone, even when redirecting topics.")

        if restrictions:
            return "\n\nKNOWLEDGE AND SCOPE RESTRICTIONS:\n" + "\n".join(f"- {r}" for r in restrictions)
        
        return ""

    def should_use_context_only(self, bot: Bot) -> bool:
        """Check if bot should use only provided context and not general knowledge."""
        if not bot.scopes:
            return False

        for scope in bot.scopes:
            if not scope.is_active:
                continue

            guardrails = scope.guardrails or {}
            knowledge_boundaries = guardrails.get("knowledge_boundaries", {})
            
            if knowledge_boundaries.get("strict_mode", False):
                return True

        return False

    def get_conversation_context_limit(self, bot: Bot) -> int:
        """Get the maximum number of previous messages to include in context."""
        if not bot.scopes:
            return 10  # Default limit

        max_context = 10
        for scope in bot.scopes:
            if not scope.is_active:
                continue

            guardrails = scope.guardrails or {}
            context_settings = guardrails.get("context_settings", {})
            scope_limit = context_settings.get("max_conversation_history", 10)
            max_context = max(max_context, scope_limit)

        return max_context