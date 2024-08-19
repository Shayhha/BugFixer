describe('Open app and check that there are notifications in the notifications popup', () => {

    it('login into the app and click the notifications bell icon', () => {
        // Visit the Landing page
        cy.visit(`${Cypress.env('baseUrl')}/login`);
        cy.viewport(Cypress.env('viewportWidth'), Cypress.env('viewportHeight'));

        // Get the email input, type into it
        cy.get('[data-testid="cypress-login-email-input"]').type('max@max.com')
        
        // Get the password input, type into it
        cy.get('[data-testid="cypress-login-password-input"]').type('Max123')
    
    
    
        // Intercept the login POST request
        cy.intercept('POST', 'http://127.0.0.1:8090/homepage/login').as('loginRequest');
    
        // Click the login button
        cy.get('.login-button').click();
    
        // Wait for the request to complete
        cy.wait('@loginRequest').then((interception) => {
            // Assert that the response status is 200
            expect(interception.response.statusCode).to.eq(200);
    
            // Wait for redirection
            cy.url().should('include', '/admin');
        });
    
        // Wait to see that everything loads properly
        cy.wait(1000);
    
    
    
        // Select and click the logout icon
        cy.get('[data-testid="cypress-notification-dropdown"]').last().click().wait(1000);

        // Select and click the Logout button
        cy.get('[data-testid="cypress-notification-bell-icon"]').click({ force: true });

        // Assert that the admin page is opened
        cy.url().should('include', '/admin');



        // Select and click the logout icon
        cy.get('[data-testid="cypress-logout-dropdown"]').last().click();
    
        // Select and click the Logout button
        cy.get('[data-testid="cypress-logout-button"]').click({ force: true });
    
        // Assert that the landing page is opened
        cy.url().should('not.include', '/admin');
    });
  });
  