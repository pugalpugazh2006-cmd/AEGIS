import networkx as nx
from typing import List, Dict, Any

class RCAEngine:
    """
    Explainable root-cause analysis using a directed dependency graph and anomaly evidence.
    """
    def __init__(self):
        self.graph = nx.DiGraph()
        
    def add_dependency(self, source: str, target: str):
        """Adds a directional dependency (source calls target)."""
        self.graph.add_edge(source, target)
        
    def add_service(self, service: str):
        self.graph.add_node(service)
        
    def rank_root_causes(self, anomalous_services: List[str]) -> List[Dict[str, Any]]:
        """
        Given a list of services currently exhibiting anomalies, rank them by root cause probability.
        Rule: If an anomalous service depends on another anomalous service, the downstream service is more likely the root cause.
        """
        if not anomalous_services:
            return []
            
        candidates = []
        for service in anomalous_services:
            if service not in self.graph:
                continue
                
            # Score base on out-degree to other anomalous services
            score = 10.0
            evidence = [f"Service '{service}' is exhibiting anomalous behavior."]
            
            # Find downstream dependencies
            downstream = nx.descendants(self.graph, service)
            downstream_anomalous = [s for s in downstream if s in anomalous_services]
            
            if downstream_anomalous:
                score -= (5.0 * len(downstream_anomalous))
                evidence.append(f"Downgraded score because downstream dependencies {downstream_anomalous} are also anomalous.")
                
            # Find upstream dependents
            upstream = nx.ancestors(self.graph, service)
            upstream_anomalous = [s for s in upstream if s in anomalous_services]
            
            if upstream_anomalous:
                score += (5.0 * len(upstream_anomalous))
                evidence.append(f"Upgraded score because it is affecting upstream dependencies {upstream_anomalous}.")
                
            candidates.append({
                "service": service,
                "score": max(0.0, score), # Keep non-negative
                "evidence": evidence
            })
            
        # Sort descending by score
        candidates.sort(key=lambda x: x["score"], reverse=True)
        
        # Convert raw scores into ranks
        for i, candidate in enumerate(candidates):
            candidate["rank"] = i + 1
            
        return candidates
