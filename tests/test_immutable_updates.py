import os
# Set a dummy GROQ_API_KEY in the environment before importing and instantiating anything
os.environ["GROQ_API_KEY"] = "gsk_mock_api_key_for_unit_testing_purposes_only"

import pytest
from unittest.mock import MagicMock
from nodes.pro_debater_node import ProDebaterNode
from nodes.con_debater_node import ConDebaterNode
from configurations.llm_config import llm_config_map
from debate_state import DebateState

def test_pro_debater_immutable_updates():
    node = ProDebaterNode(llm_config_map["gpt-4.1"], temperature=0.1)
    node.execute_chain = MagicMock(return_value="Mocked PRO opening statement.")
    
    state: DebateState = {
        "debate_id": "test-id",
        "debate_topic": "Should AI be regulated?",
        "messages": [
            {
                "speaker": "moderator",
                "content": "Welcome to the debate.",
                "validated": True,
                "stage": "opening"
            }
        ],
        "stage": "opening",
        "speaker": "pro",
        "memory": {"PRO": [], "CON": []},
        "round_number": 1,
        "retry_count": 0
    }
    
    import copy
    state_before = copy.deepcopy(state)
    
    result = node(state)
    
    # Verify that the input state was NOT mutated in place
    assert state == state_before, "ProDebaterNode mutated state in place!"
    
    # Verify that the returned messages list has the new message appended
    assert len(result["messages"]) == 2
    assert result["messages"][0]["content"] == "Welcome to the debate."
    assert result["messages"][1]["content"] == "Mocked PRO opening statement."
    
    # Verify that the returned memory has the new entry
    assert result["memory"]["PRO"] == ["Mocked PRO opening statement."]
    assert result["memory"]["CON"] == []


def test_con_debater_immutable_updates():
    node = ConDebaterNode(llm_config_map["gpt-4.1"], temperature=0.1)
    node.execute_chain = MagicMock(return_value="Mocked CON rebuttal statement.")
    
    state: DebateState = {
        "debate_id": "test-id",
        "debate_topic": "Should AI be regulated?",
        "messages": [
            {
                "speaker": "pro",
                "content": "PRO statement.",
                "validated": True,
                "stage": "opening"
            }
        ],
        "stage": "rebuttal",
        "speaker": "con",
        "memory": {"PRO": ["PRO statement."], "CON": []},
        "round_number": 1,
        "retry_count": 0
    }
    
    import copy
    state_before = copy.deepcopy(state)
    
    result = node(state)
    
    # Verify that the input state was NOT mutated in place
    assert state == state_before, "ConDebaterNode mutated state in place!"
    
    # Verify returned messages
    assert len(result["messages"]) == 2
    assert result["messages"][0]["content"] == "PRO statement."
    assert result["messages"][1]["content"] == "Mocked CON rebuttal statement."
    
    # Verify returned memory
    assert result["memory"]["PRO"] == ["PRO statement."]
    assert result["memory"]["CON"] == ["Mocked CON rebuttal statement."]


def test_moderator_stage_validation():
    from nodes.debate_moderator_node import DebateModeratorNode
    node = DebateModeratorNode()
    
    # 1. Test valid stage doesn't raise exception
    valid_state: DebateState = {
        "debate_id": "test-id",
        "debate_topic": "Should AI be regulated?",
        "messages": [],
        "stage": "opening",
        "speaker": "pro",
        "memory": {"PRO": [], "CON": []},
        "round_number": 1,
        "retry_count": 0
    }
    # Should not raise exception
    result = node(valid_state)
    assert result.goto == "con_debater_node"
    
    # 2. Test invalid stage raises ValueError
    invalid_state: DebateState = {
        "debate_id": "test-id",
        "debate_topic": "Should AI be regulated?",
        "messages": [],
        "stage": "counterrr",
        "speaker": "pro",
        "memory": {"PRO": [], "CON": []},
        "round_number": 1,
        "retry_count": 0
    }
    with pytest.raises(ValueError, match="Invalid stage: counterrr"):
        node(invalid_state)
