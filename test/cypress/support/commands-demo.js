/**
 * Demo-pacing helpers shared by the tutorial-replay specs (tutorialBasic.cy.js,
 * tutorialAdvanced.cy.js, tutorialAdvancedJobScheduler.cy.js).
 *
 * Controlled entirely by Cypress.env("DEMO_MODE"):
 *  - "pause": live presenter demo — cy.pause() before/after each step, cursor glides visibly.
 *  - "video": recorded demo video — short waits for readability, cursor glides visibly.
 *  - unset:   GUI run-through test — no pauses/waits/glide, full speed.
 */

let demoCursor = { x: 100, y: 100 };

/**
 * @returns {boolean} true when DEMO_MODE calls for visible cursor movement
 */
function isVisualMode() {
  return ["pause", "video"].includes(Cypress.env("DEMO_MODE"));
}

Cypress.Commands.add("demoStep", (label)=>{
  cy.log(`STEP: ${label}`);
  const mode = Cypress.env("DEMO_MODE");
  if (mode === "pause") {
    cy.pause();
  } else if (mode === "video") {
    cy.wait(1000);
  }
});

/**
 * Glides the real (CDP-level) mouse cursor from its last known position to the
 * center of `selector` in small increments, so a human watching sees continuous
 * motion rather than a teleport. No-op unless DEMO_MODE is "pause" or "video".
 */
Cypress.Commands.add("demoMoveTo", (selector, options = {})=>{
  if (!isVisualMode()) {
    return;
  }
  const steps = options.steps ?? 10;
  const stepDelay = options.stepDelay ?? 35;
  cy.get(selector).then(($el)=>{
    const rect = $el[0].getBoundingClientRect();
    const targetX = Math.round(rect.left + rect.width / 2);
    const targetY = Math.round(rect.top + rect.height / 2);
    const { x: startX, y: startY } = demoCursor;
    for (let i = 1; i <= steps; i++) {
      const x = Math.round(startX + ((targetX - startX) * i) / steps);
      const y = Math.round(startY + ((targetY - startY) * i) / steps);
      cy.get("body").realMouseMove(x, y);
      cy.wait(stepDelay);
    }
    demoCursor = { x: targetX, y: targetY };
  });
});

/**
 * Visible click: glide the cursor there first (pause/video modes only), then
 * perform the real functional click.
 */
Cypress.Commands.add("demoClick", (selector)=>{
  cy.demoMoveTo(selector);
  cy.get(selector).click();
});
