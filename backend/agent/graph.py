from langgraph.graph import StateGraph, END
from agent.state import AgentState
from agent.nodes import generate_pipeline_node, execute_query_node, formulate_response_node


def build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("generate_pipeline", generate_pipeline_node)
    graph.add_node("execute_query", execute_query_node)
    graph.add_node("formulate_response", formulate_response_node)

    graph.set_entry_point("generate_pipeline")
    graph.add_edge("generate_pipeline", "execute_query")
    graph.add_edge("execute_query", "formulate_response")
    graph.add_edge("formulate_response", END)

    return graph.compile()


agent_graph = build_graph()