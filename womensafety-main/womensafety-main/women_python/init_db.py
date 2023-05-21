import sqlite3

connection = sqlite3.connect('database.db')


with open('schema.sql') as f:
    connection.executescript(f.read())

cur = connection.cursor()

cur.execute("INSERT INTO posts (title, suburb, rating ,content) VALUES (?,?,?,?)",
            ('First Post', 'Notting Hill 3168',3,'Content for the first post')
            )

cur.execute("INSERT INTO comments (postid,comment) VALUES (?,?)",(1,'Thanks for the rating'))

connection.commit()
connection.close()