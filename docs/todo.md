
## FIXES
	- Auto expand search bar
	- Z index of the
	- Suggested Query Refinements not displaing on agent assement
	- Evidences with long titles cuts the title from the screen on the modal. ensure evidence modal is constrained by the browser view.
	- ![[Pasted image 20250530200251.png]]
	- ![[Pasted image 20250530200302.png]]
	- Elipsis on incomplete texts and prevent cut on words.
	- Fix report streaming showing [object object]
  - prevent evidence resorting and naming changing after analysis. keep the sorting by retrival time.
  - ensure the iteration limit is respected on auto mode. currently it detects prematurely that the 5 iteration limit was reached. the counting is not working. 

## IMPROVEMENTS
	- Move research log above guidance and add env flag to turn it on or off and make it with fixed height and scrolable and collapsable.
	- Move agent assessment above generated search queries.
	- Pad the analyzis into botton, always show.
	- understand how to show, when to show the information
	- increase the number of retrieved documents
	- redesign the research pipeline to rely on cerebras models, at least for prototyping

## FEATURES
	- Allow write feedback to the agent to better nudge the research
	- Add a natural language overall status 
	- Provide more control to the user: when to stop, when to write the stop loop and write report, etc.
	- Click on the tag to indicate if it's relevant or irrelevant


## TOOLING/DX:
  - use the 'show docs before analysis' to fix the vi.mocv sucessive issues #IMPORTANT
  - Improve the validation scripts.
  - Also the name validation appears to confuse the agent, that instead of check the validations for a task defined for the 
  - Commit when finalizing the phase
  - Report by sprint, not phase
  - phase as commit, sprint as PR.
  - fix running redundant verifications after automatic hook validation
  - autoadd package to context.
 	- Check if before commit it is formatting and running related files when committing
	- Ensure it doesn't allows pull/sync with remote if not all tests passes.

  - change typecheck to typecheck:strict?
    - Actually i think with my current tsconfig.json it has no difference - ask claude for confirmation.

  - too long `bun run test`, change to:
    - bun run test --reporter=basic
    - bun run test --run 2>&1 | tail -20

## BAML feature requests
  - set custom retry policy on tests
  - stop testing run once started on playground 
  - run multi-run tests for consistency check

=============== OTHER ===============

## baml function testing
- Contrast assert and actual llm response
- Then reason about
    - Prompt's Intent, test intent and assertion intent.
- Spot contradictions between each intent.
- Avoids overfit

- When adressing a test failure always take a carefull look at the function signature and related types schema
- Never make edits according to assumptions
- Try to understand step by sep why de function is failing
- Your first step to debug a failing test is carefully analyze the LLM answers tooking for traits that can indicate why it's not behaving as expected. Sometimes models states clearly their problems.
- If `missing required fields` message are got, start by carefully analyzing the function signature, since it may miss some necessary type.

before making any changes look if the necessary types are properly defined
- How the prompt instruct the LLM to make use of these types.
