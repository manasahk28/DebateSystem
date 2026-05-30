import os
import json
# Set a dummy GROQ_API_KEY in the environment before importing and instantiating anything
os.environ["GROQ_API_KEY"] = "gsk_mock_api_key_for_unit_testing_purposes_only"

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

# ── Required Test 1 & 4: Happy Path and SSE Completion ───────────────────────

@patch('nodes.topic_generator_node.GenerateTopicNode.execute_chain')
@patch('nodes.pro_debater_node.ProDebaterNode.execute_chain')
@patch('nodes.con_debater_node.ConDebaterNode.execute_chain')
@patch('nodes.fact_checker_node.FactCheckNode.execute_chain')
@patch('nodes.judge_node.JudgeNode.execute_chain')
def test_full_debate_happy_path(mock_judge, mock_fc, mock_con, mock_pro, mock_topic):
    """
    Required Test 1 & 4: Checks happy path (topic -> PRO -> CON -> Judge -> END)
    and ensures SSE {"type": "complete"} is correctly sent.
    """
    mock_topic.return_value = "AI in healthcare"
    mock_pro.return_value = "Pro statement on AI."
    mock_con.return_value = "Con statement on AI."
    mock_fc.return_value = '{"binary_score": "yes", "justification": "Valid study reference."}'
    
    from nodes.judge_node import DebateVerdict
    mock_judge.return_value = DebateVerdict(winner="pro", justification="PRO constructed better arguments.")
    
    response = client.post("/debate/start", json={"topic": "AI in healthcare"})
    assert response.status_code == 200
    
    lines = []
    for line in response.iter_lines():
        if line.startswith("data:"):
            payload = json.loads(line[5:].strip())
            lines.append(payload)
            
    # Verify events
    assert any(ev["type"] == "started" for ev in lines)
    assert any(ev["type"] == "turn" and ev["speaker"] == "pro" for ev in lines)
    assert any(ev["type"] == "turn" and ev["speaker"] == "con" for ev in lines)
    assert any(ev["type"] == "turn" and ev["speaker"] == "judge" for ev in lines)
    
    # Required Test 4: SSE Completion event is sent as the very last message
    assert lines[-1]["type"] == "complete"
    
    # Assert done event details
    done_ev = next(ev for ev in lines if ev["type"] == "done")
    assert done_ev["winner"] == "pro"
    assert done_ev["total_messages"] > 4


# ── Required Test 2: Retry Path ──────────────────────────────────────────────

@patch('nodes.topic_generator_node.GenerateTopicNode.execute_chain')
@patch('nodes.pro_debater_node.ProDebaterNode.execute_chain')
@patch('nodes.con_debater_node.ConDebaterNode.execute_chain')
@patch('nodes.fact_checker_node.FactCheckNode.execute_chain')
@patch('nodes.judge_node.JudgeNode.execute_chain')
def test_full_debate_retry_path(mock_judge, mock_fc, mock_con, mock_pro, mock_topic):
    """
    Required Test 2: Mocks a fact-check failure, asserting that the flow
    routes back to PRO for retry and incrementing retry_count to 1.
    """
    mock_topic.return_value = "AI in healthcare"
    mock_pro.return_value = "Pro statement containing claims."
    mock_con.return_value = "Con statement."
    
    # First fact-check fails, subsequent ones pass
    mock_fc.side_effect = [
        '{"binary_score": "no", "justification": "Factual error."}',  # Fail
        '{"binary_score": "yes", "justification": "Corrected and valid."}', # Pass (retry)
        '{"binary_score": "yes", "justification": "Valid."}', # Pass (con opening)
        '{"binary_score": "yes", "justification": "Valid."}', # Pass (pro counter)
        '{"binary_score": "yes", "justification": "Valid."}', # Pass (con final)
        '{"binary_score": "yes", "justification": "Valid."}',
        '{"binary_score": "yes", "justification": "Valid."}'
    ]
    
    from nodes.judge_node import DebateVerdict
    mock_judge.return_value = DebateVerdict(winner="con", justification="CON was more persuasive.")
    
    response = client.post("/debate/start", json={"topic": "AI in healthcare"})
    assert response.status_code == 200
    
    lines = []
    for line in response.iter_lines():
        if line.startswith("data:"):
            lines.append(json.loads(line[5:].strip()))
            
    # Verify fact-check update / dispute events are present
    assert any(ev["type"] == "fact_check_update" and ev["validated"] is False for ev in lines)
    assert any(ev["type"] == "turn" and ev["speaker"] == "fact_checker" for ev in lines)
    
    # We should have multiple turns for the pro speaker (the initial and the retried one)
    pro_turns = [ev for ev in lines if ev["type"] == "turn" and ev["speaker"] == "pro"]
    assert len(pro_turns) == 2


# ── Required Test 3: Empty Topic Submission ──────────────────────────────────

def test_empty_topic_submission():
    """
    Required Test 3: Expects 400 Bad Request when an empty/whitespace topic is sent.
    """
    response = client.post("/debate/start", json={"topic": "   "})
    assert response.status_code == 400
    assert response.json()["detail"] == "Topic required"


# ── Required Test 5: Judge Parsing Failure Fallback ──────────────────────────

@patch('nodes.topic_generator_node.GenerateTopicNode.execute_chain')
@patch('nodes.pro_debater_node.ProDebaterNode.execute_chain')
@patch('nodes.con_debater_node.ConDebaterNode.execute_chain')
@patch('nodes.fact_checker_node.FactCheckNode.execute_chain')
@patch('nodes.judge_node.JudgeNode.execute_chain')
def test_judge_parsing_failure_fallback(mock_judge, mock_fc, mock_con, mock_pro, mock_topic):
    """
    Required Test 5: Mocks an exception inside JudgeNode during parsing (invalid JSON/model output).
    Asserts that the system doesn't crash, falling back cleanly to a 'draw'.
    """
    mock_topic.return_value = "AI in healthcare"
    mock_pro.return_value = "Pro statement."
    mock_con.return_value = "Con statement."
    mock_fc.return_value = '{"binary_score": "yes", "justification": "Valid."}'
    
    # Mock judge execution to raise a parsing exception
    mock_judge.side_effect = Exception("Malformed JSON/Pydantic output from LLM.")
    
    response = client.post("/debate/start", json={"topic": "AI in healthcare"})
    assert response.status_code == 200
    
    lines = []
    for line in response.iter_lines():
        if line.startswith("data:"):
            lines.append(json.loads(line[5:].strip()))
            
    # Verify done event winner fallback is "draw"
    done_ev = next(ev for ev in lines if ev["type"] == "done")
    assert done_ev["winner"] == "draw"
