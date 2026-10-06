from intelligence.rca_engine import RCAEngine

def test_rca_engine_single_anomaly():
    engine = RCAEngine()
    engine.add_dependency("api-gateway", "order-service")
    engine.add_dependency("order-service", "db-simulator")
    
    res = engine.rank_root_causes(["order-service"])
    assert len(res) == 1
    assert res[0]["service"] == "order-service"
    assert res[0]["rank"] == 1

def test_rca_engine_chain_anomaly():
    engine = RCAEngine()
    engine.add_dependency("api-gateway", "order-service")
    engine.add_dependency("order-service", "db-simulator")
    
    # Both api-gateway and order-service are anomalous.
    # order-service should be ranked higher because it is downstream.
    res = engine.rank_root_causes(["api-gateway", "order-service"])
    assert len(res) == 2
    
    # Check ordering
    assert res[0]["service"] == "order-service"
    assert res[1]["service"] == "api-gateway"
    
    # Check evidence inclusion
    assert any("upstream" in e for e in res[0]["evidence"])
    assert any("downstream" in e for e in res[1]["evidence"])
