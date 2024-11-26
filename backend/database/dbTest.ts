import  { dbManager } from './databaseManager'
async function test() {
    const db = new dbManager()
    // const r = await db.createUser({
    //     uId: 4,
    //     email: 'bbb@gmail.com',
    //     password: 'asdw123fF1',
    //     username: 'aaaaaaa',
    //     pId: 5
    //   })
    db.deleteRec('tokens', 'token = ' + '4854035')
}


test()