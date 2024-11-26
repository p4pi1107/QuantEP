import { login, register, v2RtrType } from "../authenticator/auth";
import { dbManager } from "./databaseManager";

const db = new dbManager()
db.initDb()

describe('register', () => {
  test('Email is invalid', async () => {
    expect(await register('userA@@email.com', 'userA_password', 'Bob', db)).toThrow(Error);
  });

  test('Correct register', async () => {
    const user: v2RtrType = await register('userA@email.com', 'userA_password', 'Bob', db);
    const loginReturn = await login('userA@email.com', 'userA_password', db) 
    expect(loginReturn).toStrictEqual({
      token: expect.any(String),
      authUserId: user.authUserId
    })
  });
  test('correct logout', async () => {
    
  })
});

// describe('login', () => {
//     test('Empty email', async () => {
//       expect(await login('', 'userA_password', db)).toThrow(Error);
//     });
//     test('Correct login', async () => {
//     //   const user = authRegisterV1('userA@email.com', 'userA_password', 'Bob', 'Bobson') as ValidAuthReturn;
//       const loginReturn = await login('bbb@gmail.com', 'asdw123fF1', db) 
//       expect(loginReturn).toStrictEqual({
//         token: expect.any(String),
//         authUserId: 4
//       })
//     });
//   });


  
  