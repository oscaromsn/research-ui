flowchart LR

subgraph 0["app"]
subgraph 1["actions"]
2["researchAgentOrchestrator.ts"]
end
6["layout.tsx"]
7["globals.css"]
B["page.tsx"]
end
subgraph 3["lib"]
subgraph 4["utils"]
5["exaSearchUtil.ts"]
end
H["utils.ts"]
subgraph I["hooks"]
J["useResearchAgent.ts"]
end
subgraph K["state"]
L["researchAtoms.ts"]
end
13["config.ts"]
subgraph 14["schemas"]
15["env.ts"]
16["common.ts"]
17["index.ts"]
18["utils.ts"]
end
end
subgraph 8["components"]
subgraph 9["providers"]
A["jotai-provider.tsx"]
end
subgraph C["domain"]
subgraph D["guidance"]
E["guidance-strategy.tsx"]
subgraph Z["modals"]
10["settings-modal.tsx"]
end
11["research-lifecycle.tsx"]
end
subgraph M["legal-research"]
N["evidence-analysis.tsx"]
subgraph O["modals"]
P["analysis-reasoning-modal.tsx"]
R["case-modal.tsx"]
end
end
subgraph S["report-generation"]
T["synthesis-reporting.tsx"]
subgraph U["modals"]
V["synthesis-reasoning-modal.tsx"]
end
W["report-drafter.tsx"]
end
end
subgraph F["ui"]
G["switch.tsx"]
Q["modal.tsx"]
12["button.tsx"]
end
subgraph X["layout"]
Y["header.tsx"]
end
end
2-->5
6-->7
6-->A
B-->E
B-->N
B-->T
B-->Y
E-->G
E-->J
E-->L
G-->H
J-->2
J-->2
J-->L
J-->L
L-->2
N-->P
N-->R
N-->L
N-->L
P-->Q
P-->L
R-->Q
T-->V
T-->W
T-->L
V-->Q
W-->L
Y-->10
Y-->11
10-->Q
11-->2
11-->L
12-->H
13-->15
17-->16
17-->15
17-->18
