flowchart LR

subgraph 0["app"]
subgraph 1["actions"]
2["researchAgentOrchestrator.ts"]
end
3["layout.tsx"]
4["globals.css"]
5["page.tsx"]
end
subgraph 6["components"]
subgraph 7["domain"]
subgraph 8["guidance"]
9["guidance-strategy.tsx"]
subgraph T["modals"]
U["settings-modal.tsx"]
end
V["research-lifecycle.tsx"]
end
subgraph F["legal-research"]
G["evidence-analysis.tsx"]
subgraph H["modals"]
I["analysis-reasoning-modal.tsx"]
L["case-modal.tsx"]
end
end
subgraph M["report-generation"]
N["synthesis-reporting.tsx"]
subgraph O["modals"]
P["synthesis-reasoning-modal.tsx"]
end
Q["report-drafter.tsx"]
end
end
subgraph J["ui"]
K["modal.tsx"]
W["button.tsx"]
end
subgraph R["layout"]
S["header.tsx"]
end
end
subgraph A["lib"]
subgraph B["hooks"]
C["useResearchAgent.ts"]
end
subgraph D["state"]
E["researchAtoms.ts"]
end
X["utils.ts"]
Y["config.ts"]
subgraph Z["schemas"]
10["env.ts"]
11["common.ts"]
12["index.ts"]
13["utils.ts"]
end
subgraph 14["utils"]
15["exaSearchUtil.ts"]
end
end
3-->4
5-->9
5-->G
5-->N
5-->S
9-->C
9-->E
C-->2
C-->2
C-->E
C-->E
E-->2
G-->I
G-->L
G-->E
G-->E
I-->K
I-->E
L-->K
N-->P
N-->Q
N-->E
P-->K
Q-->E
S-->U
S-->V
U-->K
V-->2
V-->E
W-->X
Y-->10
12-->11
12-->10
12-->13
