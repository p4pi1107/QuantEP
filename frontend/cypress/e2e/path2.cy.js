
describe('Happy Path 2', () => {
  it('passes UI test 2', () => {
    // different from happy path, in a way that it tests the UI for adding custom events
    //user name and passowrd
    const mockUser = 'liam2'
    const mockEmail = 'liam2@email.com'
    const mockPassword = 'YatLong2!'
    
    //visit the app page
    cy.visit('http://localhost:3001/')
    // click register link
    cy.get('.custom-link').click()
    //register
    cy.get('#username').type(mockUser)
    cy.get('#register-email').type(mockEmail)
    cy.get('#register-password').type(mockPassword)
    cy.get('#confirm-password').type(mockPassword)
    cy.get('.MuiButtonBase-root').click()
    // go to events upload page and upload file
    cy.get('[href="/custom"]').click()
    //cy.get('.import-button').click()
    cy.get('input[type=file]').selectFile(['cypress/fixtures/AAPL.csv', 'cypress/fixtures/AAIC.csv', 'cypress/fixtures/GOOG.csv'] , { force: true })
    cy.get('.upload-button').click()
    // confirm the stocks
    cy.get(':nth-child(2) > .MuiButtonBase-root > .PrivateSwitchBase-input').check()
    cy.get(':nth-child(3) > .MuiButtonBase-root > .PrivateSwitchBase-input').check()
    cy.get('.css-1p4tu8n > .MuiButton-root').click()

    // create custome events
    // add event 1
    cy.get('#mui-component-select-condition').click()
    cy.get('[data-value="Price Up"]').click()
    cy.get(':nth-child(2) > .MuiInputBase-root > .MuiInputBase-input').type(2)
    cy.get('#mui-component-select-action').click()
    cy.get('[data-value="Buy"]').click()
    //add event 2
    cy.get('.css-1yuhvjn > .css-jcwuwq-MuiButtonBase-root-MuiButton-root').click()
    cy.get(':nth-child(2) > :nth-child(1) > .MuiInputBase-root > #mui-component-select-condition').click()
    cy.get('[data-value="Price Down"]').click()
    cy.get(':nth-child(2) > :nth-child(2) > .MuiInputBase-root > .MuiInputBase-input').type(1)
    cy.get(':nth-child(2) > :nth-child(3) > .MuiInputBase-root > #mui-component-select-action').click()
    cy.get('[data-value="Sell"]').click()
    // submit events
    cy.get('.css-q3h30c-MuiButtonBase-root-MuiButton-root').click()
  })
})