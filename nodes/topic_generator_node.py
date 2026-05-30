from typing import Dict, Any
from langchain_core.runnables.base import RunnableSequence
from nodes.base_component import BaseComponent
from debate_state import DebateState
from prompts.topic_generator_prompts import SYSTEM_PROMPT, HUMAN_PROMPT


class GenerateTopicNode(BaseComponent):
    def __init__(self, llm_config, temperature: float = 0.7, transcript_logger: Any = None):
        super().__init__(llm_config, temperature, transcript_logger=transcript_logger)
        # Create the prompt chain.
        self.chain: RunnableSequence = self.create_chain(
            system_template=SYSTEM_PROMPT,
            human_template=HUMAN_PROMPT
        )

    def __call__(self, state: DebateState) -> Dict[str, str]:
        """
        Generates a debate topic and assigns positions to the two debaters.
        """
        super().__call__(state)

        debate_topic = state.get("debate_topic", "").strip()
        if not debate_topic:
            raw_topic = self.execute_chain({})
            
            import re
            
            # 1. First attempt: If the model wraps the actual topic in quotes inside conversational text, extract it.
            # We look for a double or single quoted block that is at least 5 characters long.
            # For single quotes, we ensure it's not just an apostrophe in a word (like "here's") by matching boundary characters.
            quote_match = re.search(r'"([^"]{5,})"', raw_topic)
            if not quote_match:
                quote_match = re.search(r"(?:\s|^|\:)\'([^\']{5,})\'(?:\s|$|\.|\,)", raw_topic)
            
            if quote_match:
                debate_topic = quote_match.group(1).strip()
            else:
                # 2. Second attempt: Check each line of the raw response to find the first line
                # that is not just a conversational intro.
                lines = [l.strip() for l in raw_topic.split("\n") if l.strip()]
                
                conversational_prefixes = [
                    "sure!", "here's a debate topic:", "here is a debate topic:", 
                    "here's a topic:", "here is a topic:", "topic:", "debate topic:",
                    "the debate topic is:", "sure, here is a debate topic:", "sure,"
                ]
                
                selected_line = ""
                for line in lines:
                    cleaned_line = line.strip()
                    lowered = cleaned_line.lower()
                    
                    # Iteratively strip conversational prefixes from the start of the line
                    changed = True
                    while changed:
                        changed = False
                        for prefix in conversational_prefixes:
                            if lowered.startswith(prefix):
                                cleaned_line = cleaned_line[len(prefix):].strip()
                                lowered = cleaned_line.lower()
                                changed = True
                    
                    # Strip quotes and conversational artifacts
                    cleaned_line = cleaned_line.replace('"', '').replace("Sure!", "").strip()
                    
                    # If this line is not just a short conversational intro/outro and has meaningful length, select it
                    if cleaned_line and len(cleaned_line) > 3:
                        selected_line = cleaned_line
                        break
                
                if selected_line:
                    debate_topic = selected_line
                elif lines:
                    # Fallback to the first line, as suggested by the user
                    debate_topic = lines[0]
                else:
                    debate_topic = raw_topic
            
            # 3. Final cleanups (as requested by user: strip quotes, remove Sure! prefix/remnants)
            debate_topic = (
                debate_topic
                .replace('"', '')
                .replace("Sure!", "")
                .strip()
            )

        # Store the topic and assign stances in the DebateState
        positions = {
            "pro": "In favor of the topic",
            "con": "Against the topic"
        }

        first_speaker = "pro"
        # self.logger.info("Welcome to our debate panel! Today's debate topic is: %s", debate_topic)

        self.logger.info("[bold green]┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓[/]")
        self.logger.info("[bold green]┃        DEBATE SESSION STARTED        ┃[/]")
        self.logger.info("[bold green]┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛[/]")
        self.logger.info("")
        self.logger.info("🏛️  [bold]Topic:[/] %s", debate_topic)
        self.logger.info("👥 [bold]Positions:[/]")
        self.logger.info("   ▸ [cyan]PRO:[/] In favor of the topic")
        self.logger.info("   ▸ [magenta]CON:[/] Against the topic")

        if self.transcript_logger:
            self.transcript_logger.log_turn(
                state.get("debate_id"),
                debate_topic,
                state.get("round_number", 1),
                "topic_generator",
                "topic",
                debate_topic,
                True,
            )

        return {
            "debate_topic": debate_topic,
            "positions": positions,
            "stage": "opening",
            "speaker": first_speaker
        }
