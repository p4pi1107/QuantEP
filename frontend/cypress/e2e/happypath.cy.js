
describe('Happy Path', () => {
  it('passes UI test 1', () => {
    //user name and passowrd
    const mockUser = 'liam'
    const mockEmail = 'liam@email.com'
    const mockPassword = 'YatLong1!'
    
    cy.visit('http://localhost:3001/')
    
    cy.get('.custom-link').click()
    //register
    cy.get('#username').type(mockUser)
    cy.get('#register-email').type(mockEmail)
    cy.get('#register-password').type(mockPassword)
    cy.get('#confirm-password').type(mockPassword)
    cy.get('.MuiButtonBase-root').click()
    //logout
    cy.get('.navbar-right > :nth-child(3)').click()

    //login again
    cy.get('#login-email').type(mockEmail)
    cy.get('#login-password').type(mockPassword)
    cy.get('.MuiButtonBase-root').click()
    // go to events upload page and upload file
    cy.get('[href="/custom"]').click()
    //cy.get('.import-button').click()
    cy.get('input[type=file]').selectFile(['cypress/fixtures/AAPL.csv', 'cypress/fixtures/AAIC.csv'] , { force: true })
    cy.get('.upload-button').click()
    // confirm the stocks
    cy.get(':nth-child(2) > .MuiButtonBase-root > .PrivateSwitchBase-input').check()
    cy.get(':nth-child(3) > .MuiButtonBase-root > .PrivateSwitchBase-input').check()
    cy.get('.css-1p4tu8n > .MuiButton-root').click()
    //no custom events, so click submit events
    cy.get('.css-q3h30c-MuiButtonBase-root-MuiButton-root').click()
    //wait and logout
    cy.wait(7000)
    cy.get('.navbar-right > :nth-child(3)').click()

  })
})