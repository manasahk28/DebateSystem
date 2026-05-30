import os
# Set a dummy GROQ_API_KEY in the environment before importing and instantiating anything
os.environ["GROQ_API_KEY"] = "gsk_mock_api_key_for_unit_testing_purposes_only"

import pytest
from unittest.mock import MagicMock
from nodes.topic_generator_node import GenerateTopicNode
from configurations.llm_config import llm_config_map
from debate_state import DebateState

def test_topic_generator_cleaning():
    # Instantiate the node with a standard config
    node = GenerateTopicNode(llm_config_map["gpt-4.1"], temperature=0.1)
    
    # Test cases mapping raw LLM outputs to expected cleaned topics
    test_cases = [
        # Format 1: Quoted topic inside conversational text
        (
            'Sure! Here\'s a debate topic:\n"AI in healthcare"',
            'AI in healthcare'
        ),
        # Format 2: Quoted topic inside conversational text (single quotes)
        (
            "Sure! Here's a debate topic:\n'AI in healthcare'",
            'AI in healthcare'
        ),
        # Format 3: No quotes, but multiline conversational intro
        (
            "Sure! Here's a debate topic:\nAI in healthcare",
            'AI in healthcare'
        ),
        # Format 4: Quoted topic with conversational intro on same line
        (
            'Sure! Here\'s a debate topic: "AI in healthcare"',
            'AI in healthcare'
        ),
        # Format 5: Conversational prefix on same line, no quotes
        (
            "Sure! Here's a debate topic: AI in healthcare",
            'AI in healthcare'
        ),
        # Format 6: Just the topic, clean
        (
            "AI in healthcare",
            'AI in healthcare'
        ),
        # Format 7: Topic first, then some explanation
        (
            "AI in healthcare\nThis is a very important topic to discuss.",
            'AI in healthcare'
        ),
        # Format 8: Another style of prefix
        (
            "Sure! The debate topic is: AI in healthcare",
            'AI in healthcare'
        ),
        # Format 9: Quoted topic on first line, explanation on next lines
        (
            '"AI in healthcare"\nExplanation here...',
            'AI in healthcare'
        )
    ]
    
    for raw_output, expected_topic in test_cases:
        # Mock the execute_chain method to return the raw_output
        node.execute_chain = MagicMock(return_value=raw_output)
        
        # Call the node with an empty state
        state: DebateState = {
            "debate_id": "test-id",
            "debate_topic": "",
            "messages": [],
            "round_number": 1
        }
        
        result = node(state)
        assert result["debate_topic"] == expected_topic, f"Failed for raw output: {repr(raw_output)}. Got: {repr(result['debate_topic'])}"
