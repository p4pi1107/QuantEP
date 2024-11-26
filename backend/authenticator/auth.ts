import validator from 'validator';

class CustomError extends Error {
  statusCode: any;
  constructor(message, statusCode) {
   super(message)
   this.statusCode = statusCode
  }
}

interface tokensStruct {
  [tokens: string]: number;
}
 

import { dbManager, User } from '../database/databaseManager';

interface authUserId { authUserId: number };
interface error  { error: string };
interface v2RtrType  { authUserId: number, token: string };
interface result { result: boolean }

/**
 *
 * @param {string} email -user email
 * @param {string} password - user password
 * @returns {{authUserId: number}|{error: string}} - on error, returns {error: String}, otherwise returns a {authUserId: Number}
 */
async function checkLoginStatus(email: string, password: string, db: dbManager) {
  const users: User[]  = await db.getUsers()

  const user = users.find(user => user.email === email);
  console.log(user)

  if (!user) {
    throw new CustomError('User does not exist.', 400)
  }

  if (user.password !== password) {
    throw new CustomError('Password is incorrect.', 400)
  }

  return { authUserId: user.uId };
}

async function login(email: string, password: string, db: dbManager) : Promise<v2RtrType> {
  try {
    const loginid = await checkLoginStatus(email, password, db);
    const tokens: tokensStruct = await db.getTokens()
    let usertoken = Math.floor(Math.random() * 10000000);
    // make sure it isn't duplicate
    while (usertoken.toString() in tokens) {
      usertoken = Math.floor(Math.random() * 10000000);
    }
    const tokenStr = usertoken.toString();
    // assigning authUserId to token
    await db.createToken(tokenStr, loginid.authUserId);
    return { authUserId: loginid.authUserId, token: tokenStr };
  } catch (error) {
    throw(error)
  } 
}

async function verifyToken(token: string, db: dbManager): Promise<result> {
  try {
    const valid = await db.idByToken(token)
    return { result: (valid.length != 0) }
  } catch (error) {
    throw(error)
  }
}

/**
 *
 * @param {string} email - Email address of user
 * @param {string} password - password of user
 * @param {string} namefirst - First name of user
 * @param {string} namelast - Last name of usr
 * @returns {{authUserId: number}|{error: string}} - on error, returns {error: String}, otherwise returns a {authUserId: Number}
 */
async function checkRegisterStatus(email: string, password: string, username: string, db: dbManager) {
  if (!(validator.isEmail(email))) {

    throw new CustomError("Email is not valid", 400)
  }

  const users: User[]  = await db.getUsers()
  // if ((data.users || []).length === 0) {
  //   data.users = [];
  // }
  // error checks
  if (users.map(user => user.email).includes(email)) {
    throw new CustomError('Email address already exists.', 400)
  }

  if (password.length < 8) {
    throw new CustomError('Password cannot be less than 8 characters long.', 400)
  }

  if (username === '') {
    throw new CustomError('Empty username.', 400)
  }

  if (username.length > 50) {
    throw new CustomError('Username too long.', 400)
  }

  // check if username is in data structure
  // now unique handle
  const assignedId = users.length;
  let pId: number;
  if (assignedId === 0) {
    pId = 1;
  } else {
    pId = 2;
  }

  await db.createUser({
    uId: assignedId,
    email: email,
    password: password,
    username: username,
    pId: pId
  })
  return { authUserId: assignedId };
}

async function register(email: string, password: string, username: string, db: dbManager): Promise<v2RtrType|any> {
  try {
    const data = await checkRegisterStatus(email, password, username, db);
    // if (data.status != undefined) {
    //   return {status: data.status, message: data.msg}
    // }
    const tokens = await db.getTokens();
    let usertoken = Math.floor(Math.random() * 10000000);
    // make sure it isn't duplicate
    while (usertoken.toString() in tokens) {
      usertoken = Math.floor(Math.random() * 10000000);
    }
    const tokenStr = usertoken.toString();
    // assigning authUserId to token
    await db.createToken(tokenStr, data.authUserId)
    return { authUserId: data.authUserId, token: tokenStr };
  } catch (error) {
    throw(error)
  }
}

async function logout(token: string, db: dbManager): Promise<{}> {
  try {
    const tokens = await db.getTokens()
    if (tokens[token] == undefined) {
      throw new CustomError('Token is not valid.', 403)
    }
    db.deleteRec('tokens', `token = ${token}`);
    return {}
  } catch (error) {
    throw(error)
  }
}



export { checkLoginStatus, checkRegisterStatus, login, register, logout, v2RtrType, verifyToken };
