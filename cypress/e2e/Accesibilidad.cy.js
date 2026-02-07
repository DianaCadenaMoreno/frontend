import 'cypress-axe';

describe('Accesibilidad', () => {
  beforeEach(() => {
    //cy.visit('http://localhost:3000'); 
    cy.visit('https://code-flow.vercel.app/')
    cy.injectAxe();
  });
  
  it('debería pasar las pruebas de accesibilidad', () => {
    cy.get('[data-testid="ContrastIcon"]').should('be.visible').click();
    cy.checkA11y();
  });
});
