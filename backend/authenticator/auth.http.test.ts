import request from 'sync-request';

let SERVER_URL = "http://127.0.0.1"
let PORT = "3000"
type HttpVerb = 'GET' | 'POST' | 'PUT' | 'DELETE';

function http(method: HttpVerb, route: string, token?: string, payload?: object) {
  let qs; let json = {};
  if (payload) ['GET', 'DELETE'].includes(method.toUpperCase()) ? qs = payload : json = payload;
  return request(method, `${SERVER_URL}:${PORT}` + route, { qs, json, headers: { token: token } });
}

// beforeEach(() => {
//   http('DELETE', '/clear');
// });
// afterEach(() => {
//   http('DELETE', '/clear');
// });

// describe('register', () => {
//   test('register error', () => {
//     expect(http('POST', '/register', null, { email: 'userA@mail.com', password: 'passw', username: 'John' }).statusCode).toEqual(400)
//   });
//   test('register correct', () => {
//     expect(JSON.parse(http('POST', '/register', null, { email: 'userA@mail.com', password: 'password123', username: 'John' }).getBody() as string)).toStrictEqual(expect.objectContaining(
//       {
//         token: expect.any(String),
//         authUserId: expect.any(Number)
//       }
//     ));
//   });
// });

// describe('/login', () => {
//   test('login error', () => {
//     expect(http('POST', '/login', null, { email: 'userA@mail.com', password: 'password123' }).statusCode).toEqual(400)
//   });
//   test('login correct', () => {
//     const user = JSON.parse(http('POST', '/register', null, { email: 'userA@mail.com', password: 'password123', username: 'John' }).getBody() as string);
//     expect(JSON.parse(http('POST', '/login', null, { email: 'userA@mail.com', password: 'password123' }).getBody() as string)).toStrictEqual(expect.objectContaining({
//       token: expect.any(String),
//       authUserId: user.authUserId
//     }));
//   });
// });

describe('/logout', () => {
  test('Invalid token', () => {
    expect(http('POST', '/logout', '78e625a6-dba3-41fd-808c-b7860e3664a9').statusCode).toEqual(403)
  });
  test('Valid token', () => {
    const registerCall = http('POST', '/register', null, { email: 'userA@mail.com', password: 'password123', username: 'John' })
    const response = JSON.parse(registerCall.getBody() as string);
    expect(JSON.parse(http('POST', '/logout', response.token).getBody() as string)).toStrictEqual(expect.objectContaining({}));
  });
});

