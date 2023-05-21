from operator import sub
from webbrowser import get
from flask import Flask, render_template, request, url_for, flash, redirect
import sqlite3
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your secret key'

@app.route('/')
def index():
    return render_template('index.html')

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

# Change here when adding stuff to request
# Unit Test Done
@app.route('/create', methods=('GET', 'POST'))
def create():
    if request.method == 'POST':
        title = request.form['title']
        suburb = request.form['suburb']
        rating = request.form['rating']
        content = request.form['content']

        if not title:
            flash('Title is required!')
        else:
            conn = get_db_connection()
            conn.execute('INSERT INTO posts (title, suburb,rating,content) VALUES (?,?,?,?)',
                        (title, suburb,rating,content))
            conn.commit()
            conn.close()
            return redirect(url_for('rating'))

    return render_template('create.html')

# Unit Test Done
def get_post(post_id):
    conn = get_db_connection()
    post = conn.execute('SELECT * FROM posts WHERE id = ?',
                        (post_id,)).fetchone()
    conn.close()
    if post is None:
        abort(404)
    return post

# Unit Test Done
def get_comment(comment_id):
    conn = get_db_connection()
    comment = conn.execute('SELECT * FROM comments WHERE commentid = ?',
    (comment_id,)).fetchone()
    conn.close()
    return comment

# Create and get normal Posts
@app.route('/rating/<int:post_id>')
def post(post_id):
    post = get_post(post_id)
    conn = get_db_connection()
    comments = conn.execute('SELECT * FROM comments where postid = ?',(post_id,)).fetchall()
    # comments = conn.execute('SELECT c.commentid, c.comment FROM comments c JOIN posts p \
    #                       ON c.postid = ?;',(post_id,)).fetchall()
    return render_template('post.html', post=post,comments = comments)

# Unit Test Done
@app.route('/rating/<int:post_id>/newcomment',methods=('GET','POST'))
def addComment(post_id):
    conn = get_db_connection()
    if request.method == 'POST':
        comment = request.form['comment']
        if not comment:
            # flash('Add words to add Comment')
            return redirect(url_for('post',post_id=post_id))
            # return redirect(url_for('addComment',post_id=post_id))
        
        conn.execute('INSERT INTO comments (postid,comment) VALUES (?,?)',(post_id,comment))
        conn.commit()
        # comments = conn.execute('SELECT c.commentid, c.comment FROM comments c JOIN posts p \
        #                   ON c.commentid = p.id;').fetchall()
        conn.close()
        return redirect(url_for('post',post_id=post_id))
    return render_template('comment.html')


# Get the Filter Posts
# Unit Test Done
def get_filter_post(suburb_name):
    conn = get_db_connection()
    post = conn.execute('SELECT * FROM posts WHERE suburb = ?',(suburb_name,)).fetchall()
    conn.close()
    if post is None:
        abort(404)
    return post

# Get Filter Posts and Average Table Check later tonight if it works
# Unit Test Done for filter function
@app.route('/filter',methods =('GET','POST'))
def create_filter():
    if request.method == "POST":
        suburbRes = request.form['suburbFilter']
        post = get_filter_post(suburbRes)
        conn = get_db_connection()
        averageRating = conn.execute('SELECT suburb, ROUND(AVG(rating),2) as AVG FROM POSTS WHERE suburb = ?',(suburbRes,)).fetchall()
        return render_template('ratingFilter.html',posts = post,avg_rating = averageRating) 
        # return redirect(url_for('filterPosts'),suburb)
    return render_template('create_filter.html')

# Rating Page
@app.route('/rating', methods=('GET', 'POST'))
def rating():
    conn = get_db_connection()
    posts = conn.execute('SELECT * FROM posts').fetchall()
    conn.close()
    return render_template('rating.html',posts= posts)

@app.route('/ratingAll',methods=('GET','POST'))
def ratingAll():
    conn = get_db_connection()
    posts = conn.execute('SELECT * FROM posts').fetchall()
    conn.close()
    return render_template('showAllRatings.html',posts= posts)


# Edit Comment
# Unit Test Done
@app.route('/editComment/<int:post_id>/<int:commentid>',methods =('GET','POST'))
def editComment(post_id,commentid):
    comment = get_comment(commentid)
    if request.method == 'POST':
        comment = request.form['comment']
        if not comment:
            # flash('comment is required')
            return redirect(url_for('post',post_id = post_id))
        else:
            conn = get_db_connection()
            conn.execute('UPDATE comments SET comment = ? WHERE commentid = ?',
                         (comment,commentid))
            conn.commit()
            conn.close()
            return redirect(url_for('post',post_id = post_id))
    return render_template('editcomment.html',comment = comment)

# Edit Post add more stuff to edit
# Unit Test Done
@app.route('/rating/<int:id>/edit', methods=('GET', 'POST'))
def edit(id):
    post = get_post(id)

    if request.method == 'POST':
        title = request.form['title']
        content = request.form['content']
        suburb = request.form['suburb']
        rating = request.form['rating']

        if not title:
            flash('Title is required!')
        else:
            conn = get_db_connection()
            conn.execute('UPDATE posts SET title = ?, content = ? ,suburb =?,rating =?'
                         ' WHERE id = ?',
                         (title, content, suburb,rating,id))
            conn.commit()
            conn.close()
            return redirect(url_for('rating'))

    return render_template('edit.html', post=post)

# Delete Posts
# Unit Test Done
@app.route('/<int:id>/delete', methods=('POST',))
def delete(id):
    post = get_post(id)
    conn = get_db_connection()
    conn.execute('DELETE FROM posts WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    # flash('"{}" was successfully deleted!'.format(post['title']))
    return redirect(url_for('rating'))

# Unit Test Done
@app.route('/<int:post_id>/<int:commentid>/deleteComment',methods = ('POST',))
def deleteComment(post_id,commentid):
    comment = get_comment(commentid)
    conn = get_db_connection()
    conn.execute('DELETE FROM comments WHERE commentid = ?', (commentid,))
    conn.commit()
    conn.close()
    return redirect(url_for('post',post_id = post_id))



@app.route('/test')
def test():
    return render_template('Test.html')

# @app.route('/map', methods=('GET','POST'))
# def map():
#     return render_template('map.html')


@app.route('/map',methods=('GET','POST'))
def map():
    conn = get_db_connection()
    table = conn.execute('SELECT suburb FROM posts').fetchall()

    # suburbRes = request.form['suburbFilter']
    # post = get_filter_post(suburbRes)
    #averageRating = conn.execute('SELECT suburb, (AVG(rating)) as AVG FROM posts').fetchall()
    #averageRating = conn.execute('(SELECT * FROM ((SELECT DISTINCT suburb, rating FROM posts) as T) ').fetchall()

    #averageRating = conn.execute('SELECT suburb,title,ROUND(AVG(rating),1) FROM (SELECT * FROM (SELECT id, suburb, title, rating FROM posts GROUP BY suburb ) ORDER BY id DESC) AS x GROUP BY suburb').fetchall()
    
    #averageRating = conn.execute('SELECT * FROM (SELECT suburb, title, ROUND(AVG(rating),1) FROM posts ORDER BY id DESC) AS x GROUP BY suburb').fetchall()

    #averageRating = conn.execute('SELECT * FROM posts').fetchall

    string = "SELECT suburb, title, ROUND(AVG(rating),1), content FROM (SELECT id,title,rating,suburb,content FROM posts ORDER BY id DESC) GROUP BY suburb"
    averageRating = conn.execute(string).fetchall()
    
# SELECT
#   *
# FROM (SELECT
#   *
# FROM messages
# ORDER BY id DESC) AS x
# GROUP BY name


    #print('test',test)

    #title = conn.execute('SELECT suburb, title FROM posts GROUP BY suburb').fetchall()

    #averageRating = conn.execute('SELECT * FROM (SELECT suburb, title, (SELECT ROUND(AVG(rating),1) FROM posts group by suburb) FROM posts ORDER BY id DESC) AS x GROUP BY suburb').fetchall()



    conn.close()
    
    table = [tuple(post) for post in table]
    posts = json.dumps(table)

    # title = [tuple(title2) for title2 in title]
    # title2 = json.dumps(title)

    
    averageRating = [tuple(rating) for rating in averageRating]
    rating = json.dumps(averageRating)

    


    # print(posts)
   
    # print(title2)
    

    return render_template('map.html',all_posts= averageRating  )


@app.route('/about', methods=('GET','POST'))
def about():
    return render_template('about.html')
