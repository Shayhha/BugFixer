from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from abc import ABC
import pyodbc
import os


# initialize app with flask for backend connection with front end react
app = Flask(__name__)
cors = CORS(app, origins='*')
globalUser = None # this is global user for logged in user
db = None # this is sql database instance for making queries 

# ====================================================SQLHelper-Class================================================== #

# class for handling SQL commands for various features in website
class SQLHelper(ABC):
    connection = None # connecction string for SQL server database
    cursor = None # cursor for executig SQL commands
 
    @app.route('/register', methods=['POST'])
    def register():
        data = request.get_json()
        print(data)
        email = data.get('email')
        userName = data.get('userName')
        fName = data.get('fName')
        lName = data.get('lName')
        userType = data.get('userType')
        
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "User with this email already exists"})
        if not all([email,userName,fName,lName,userType]):
            return jsonify({'error':"missing fields"})
        globalUser=User(email,userName,fName,lName,userType)

        try:
            db.session.add(globalUser)
            db.session.commit()
            return jsonify({"message":"User registered successfully"})
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)})

 

    # method for connecting to SQL server database
    def connect(self):
        # load environment variables from env file
        load_dotenv()  
        # getting necessary database credentials from env file for database connection
        connectionString = os.getenv('DB_CONNECTION_STRING')
        self.connection = pyodbc.connect(connectionString)
        self.cursor = self.connection.cursor() #initialize cursor 
    
    # method for closing database connection
    def close(self):
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()

    # method for searching user in db, returns user obj if found else returns none
    def searchUser(self, email, password):
        try:
            query = 'SELECT * FROM Users WHERE email = ? AND password = ?'
            self.cursor.execute(query, (email, password,))
            user = self.cursor.fetchone() # use fetchone to find single user 
            if user: # if user found
                return User(user[0], user[1], user[2], user[3], user[4], user[5]) # return user object
            else: # else return none 
                return None
        except Exception as e:
            print(f'Error: {e}')
            return None
        
    # method for updating user userName, fName, lName  in db, returns true or false
    def updateUserInfo(self, userId, newUserName, newFname, newLname):
        try:
            query = 'UPDATE Users SET userName = ?, fname = ?, lname = ? WHERE userId = ?'
            self.cursor.execute(query, (newUserName, newFname, newLname, userId,))
            self.connection.commit()  # commit the transaction for update
            if self.cursor.rowcount > 0:
                return True
            else:
                return False  # user not found
        except Exception as e:
            print(f'Error: {e}')
            return False
    
    # method for checking passowrd of user in db, returns true or false
    def checkPassword(self, userId, password):
        try:
            query = 'SELECT * FROM Users WHERE userId = ? AND password = ?'
            self.cursor.execute(query, (userId, password,))
            user = self.cursor.fetchone()
            if user:
                return True
            else:
                return False
        except Exception as e:
            print(f'Error: {e}')
            return False

    # method for updating passowrd of user in db, returns true or false
    def updatePassword(self, userId, newPassword, oldPassword):
        try:
            query = 'UPDATE Users SET password = ? WHERE userId = ? AND password = ?'
            self.cursor.execute(query, (newPassword, userId, oldPassword,))
            self.connection.commit()  # commit the transaction for update
            if self.cursor.rowcount > 0:
                return True
            else:
                return False 
        except Exception as e:
            print(f'Error: {e}')
            return False
        
    # method for searching bug in db by its name\title, returns bug dict, else none
    def searchBug(self, bugName):
        try:
            query = 'SELECT * FROM Bugs WHERE bugName LIKE ?'
            self.cursor.execute(query, ('%' + bugName + '%',))
            bugs = self.cursor.fetchall()
            bugDict = [dict(zip([column[0] for column in self.cursor.description], row)) for row in bugs]
            return bugDict
        except Exception as e:
            print(f'Error: {e}')
            return None
        
    def insert_bug(self, bugName, projectId, createdId, assignedId, bugDesc, status, priority, importance, numOfComments, creationDate, openDate, closeDate):
        try:
            # SQL insert statement
            insert_sql = """
            INSERT INTO Bugs (bugName, projectId, createdId, assignedId, bugDesc, status, priority, importance, numOfComments, creationDate, openDate, closeDate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            
            # Execute the insert statement
            self.cursor.execute(insert_sql, (bugName, projectId, createdId, assignedId, bugDesc, status, priority, importance, numOfComments, creationDate, openDate, closeDate))
            
            # Commit the transaction
            self.connection.commit()
            print("\nData inserted successfully")
            return True
        except Exception as e:
            print(f"\nError inserting data: {e}")
            return False

# ==================================================================================================================== #

# ======================================================User-Class==================================================== #
# class that represents user in website
class User:
    # constructor of user class
    def __init__(self, userId, email, userName, fName, lName, userType):
        self.userId = userId
        self.email = email
        self.userName = userName
        self.fName = fName
        self.lName = lName
        self.userType = userType

    # method for getting a dictionary representation of user object
    def toDict(self):
        userDict = {
            'userId': self.userId,
            'email': self.email,
            'username': self.userName,
            'fName': self.fName,
            'lName': self.lName,
            'userType': self.userType
        }
        return userDict

# ==================================================================================================================== #

# =====================================================BugFixer======================================================= #

# class that includes various fucntions for interacting with db and using various features in website
class BugFixer(ABC):
    # function for refister of user into the website 
    @app.route('/register', methods=['POST'])
    def register():
        data = request.get_json()
        print(data)
        email = data.get('email')
        userName = data.get('userName')
        fName = data.get('fName')
        lName = data.get('lName')
        userType = data.get('userType')
        
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "User with this email already exists"})
        if not all([email,userName,fName,lName,userType]):
            return jsonify({'error':"missing fields"})
        globalUser=User(email,userName,fName,lName,userType)

        try:
            db.session.add(globalUser)
            db.session.commit()
            return jsonify({"message":"User registered successfully"})
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)})

       
    # function for login of user into the website
    @app.route('/homepage/login', methods=['POST'])
    def login():
        data = request.get_json()
        user = db.searchUser(data.get('email'), data.get('password'))
        if user is not None: # if user was found
            global globalUser 
            globalUser = user # set globalUser object
            return jsonify(user.toDict())
        else: # else user's credentials aren't valid
             return jsonify({'error': 'Invalid credentials'})
        
    # function for changing password of user
    @app.route('/userSettings/changePassword', methods=['POST'])
    def changePassword():
        data = request.get_json()
        if db.checkPassword(globalUser.userId, data.get('oldPassword')):
            if db.updatePassword(globalUser.userId, data.get('newpassword'), data.get('oldPassword')):
                return jsonify({'success': 'Changed password succusfully'})
            else:
                return jsonify({'error': 'failed to perform database query'})
        else:
            return jsonify({'error': 'Old password is incorrect'})
        
              # function to logout from the website  
    @app.route('/homepage/logout', methods=['POST'])
    def logout():
        global globalUser
        if globalUser:
            globalUser = None
            return jsonify({'message':'logged out successfully'})
        else:
            return jsonify({'error':'No user is logged in'})
        
    # function for changing user's info like userName, fname, lname
    @app.route('/userSettings/changeUserInfo', methods=['POST'])
    def changeUserInfo():
        data = request.get_json()
        if db.updateUserInfo(globalUser.userId, data.get('newUserName'), data.get('newFname'), data.get('newLname')):
            return jsonify({'success': 'Changed user info succusfully'})
        else:
            return jsonify({'error': 'failed to perform database query'})
        
    # function for searching bugs by name/title
    @app.route('/homePage/search', methods=['POST'])
    def searchBugs():
        data = request.get_json()
        bugDict = db.searchBug(data.get('searchResult')) # search all matching bugs in db
        if bugDict is not None: 
            return jsonify(bugDict) # return matched bugs in json form
        else: 
            return jsonify({'error': 'failed to perform database query'})

    @app.route('/api/get_bugs', methods=['GET'])
    def getBugs():
        try:
            db.cursor.execute('SELECT * FROM Bugs') 
            bugs = db.cursor.fetchall()
            print('Connected successfully to database')
            bugList = [dict(zip([column[0] for column in db.cursor.description], row)) for row in bugs]
            return jsonify(bugList)
        except:
            return jsonify('Failed to connect to database.')

    # function that gets from the user new bug data (and adds to the database)
    @app.route('/api/add_bug', methods=['POST'])
    def create_bug():
        bug_data = request.json  # Assuming JSON data is sent
        # Process the received data (save to database, etc.)
        print('Received bug data:', bug_data)

        db.insert_bug(bug_data.get('title'), 
                1, 
                1,
                3, 
                bug_data.get('description'), 
                bug_data.get('status'), 
                bug_data.get('priority'), 
                bug_data.get('importance'), 
                0, 
                bug_data.get('creationDate'), 
                bug_data.get('openDate'), 
                None)

        return jsonify({'message': 'Bug data received successfully'})

# ==================================================================================================================== #

# function that checks database users
@app.route('/api/users', methods=['GET'])
def users():
    db.cursor.execute('SELECT * FROM users') 
    users = db.cursor.fetchall()
    userList = [dict(zip([column[0] for column in db.cursor.description], row)) for row in users]
    return jsonify(userList)

# example function for testing Jenkins
def add(a, b):
    """Return the sum of a and b."""
    return a + b

# ========================================================MAIN======================================================== #
# running the python backend app
if __name__ == '__main__':
    # initialize SQL server connection for database functionality
    db = SQLHelper() 
    try:
        db.connect()
        # execute the app and open website
        app.run(debug=True, port=8090)
        # close dabase connection after website closes
        db.close() 
    except:
        print('Failed to connect to database.')
