import sqlite3
import pandas as pd


class dbManager:
    def __init__(self, db):
        self.db = db

    # Loads csv file in database.sqlite3
    def loadCsvToDb(self, csvFile, token):
        # Conenct to db
        conn = sqlite3.connect(self.db)
        cursor = conn.cursor()
        userId = self.idByToken(cursor, token)

        # Check userId
        if userId is None:
            return 'invalidUser'
        
        # Check if record already exists
        # savedFile = csvFile.filename + str(userId)
        cursor.execute("SELECT 1 FROM userFiles WHERE uId = ? AND savedFile = ?", (userId, csvFile.filename))
        if cursor.fetchone():
            conn.close()
            return 'inDatabase'  # Record already exists
        
        # load the data into a Pandas DataFrame
        file = pd.read_csv(csvFile)

        # write the data to a sqlite table and save file to user
        cursor.execute("""
        INSERT INTO userFiles (uId, savedFile) VALUES (?, ?)
        """, [userId, csvFile.filename])
        file.to_sql(csvFile.filename + str(userId), conn, if_exists='append', index = False)
        conn.commit()
        conn.close()
        return True
    

    # Fetches saved csv files from database
    def fetchCsvFromDb(self, filename):
        
        # Conenct to db
        conn = sqlite3.connect(self.db)

        query = f"SELECT * FROM '{filename}'"
        df = pd.read_sql_query(query, conn)
        conn.close()

        return df
    
    # Check if csv table exists
    def tableExists(self, table):
        conn = sqlite3.connect(self.db)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT name FROM sqlite_master WHERE type='table' AND name=?;
        """, (table,))
        result = cursor.fetchone()
        cursor.close()
        return result is not None
    
    def idByToken(self, cursor, token):
        cursor.execute("""
            SELECT value FROM tokens WHERE token=?;
        """, (token,))
        result = cursor.fetchone()
        
        # Convert tuple into list
        return result[0] if result else None
    
    def getChosenFiles(self, token):
        conn = sqlite3.connect(self.db)
        cursor = conn.cursor()
        userId = self.idByToken(cursor, token)
        cursor.execute("""
            SELECT savedFile FROM userFiles WHERE uId=? AND inUse=?;
        """, (userId, True,))
        chosenFiles = cursor.fetchall()
        cursor.close()
        return [file[0]+str(userId) for file in chosenFiles]


    
