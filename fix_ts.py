import os
import glob
import re

files = glob.glob('d:/AEGIS/frontend/src/components/**/*.tsx', recursive=True)

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix React imports
    content = content.replace("import React from 'react';\n", "")
    content = content.replace("import React, {", "import {")
    content = content.replace("import React, { useEffect, useState, useCallback } from 'react';", "import { useEffect, useState, useCallback } from 'react';")

    # Fix Dashboard
    if 'Dashboard.tsx' in file:
        content = content.replace("const [lastUpdated, setLastUpdated] = useState<Date | null>(null);", "")
        content = content.replace("setLastUpdated(new Date());", "")

    # Fix KPICards
    if 'KPICards.tsx' in file:
        content = content.replace("healthyCount,", "")
        content = content.replace("healthyCount: number,", "")

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed TS errors")
