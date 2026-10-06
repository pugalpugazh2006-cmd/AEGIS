import os

with open("d:/AEGIS/frontend/src/components/Dashboard.tsx", "r", encoding="utf-8") as f:
    dashboard = f.read()

dashboard = dashboard.replace("healthyCount={healthyServices.length}", "")

with open("d:/AEGIS/frontend/src/components/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(dashboard)


with open("d:/AEGIS/frontend/src/components/ui/IntelligencePipeline.tsx", "r", encoding="utf-8") as f:
    pipeline = f.read()

# Add React import back at the top
if "import React" not in pipeline:
    pipeline = "import React from 'react';\n" + pipeline

with open("d:/AEGIS/frontend/src/components/ui/IntelligencePipeline.tsx", "w", encoding="utf-8") as f:
    f.write(pipeline)

print("Fixed errors")
