from flask import Flask, request, jsonify, send_from_directory, redirect, session
import sqlite3
import json
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__, static_folder=".", static_url_path="")
app.secret_key = "bertoai-gizli-anahtar"

def init_db():
    conn = sqlite3.connect("bertoai.db")
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            messages TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()

init_db()

@app.route("/")
def home():
    if "user_id" not in session:
        return redirect("/login.html")
    return send_from_directory(".", "index.html")

@app.route("/login.html")
def login_page():
    return send_from_directory(".", "login.html")

@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    conn = sqlite3.connect("bertoai.db")
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, password FROM users WHERE email = ?",
        (email,)
    )

    user = cursor.fetchone()

    conn.close()

    if user and check_password_hash(user[1], password):
        session["user_id"] = user[0]
        return jsonify({"success": True})

    return jsonify({
        "success": False,
        "message": "E-posta veya şifre yanlış."
    })

@app.route("/register.html")
def register_page():
    return send_from_directory(".", "register.html")

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    hashed_password = generate_password_hash(password)

    try:
        conn = sqlite3.connect("bertoai.db")
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (email, password) VALUES (?, ?)", (email, hashed_password))
        conn.commit()
        conn.close()

        return jsonify({"success": True, "message": "Kayıt başarılı."})

    except:
        return jsonify({"success": False, "message": "Bu e-posta zaten kayıtlı."})


@app.route("/logout")
def logout():
    session.clear()
    return redirect("/login.html")

@app.route("/save_chat", methods=["POST"])
def save_chat():

    if "user_id" not in session:
        return jsonify({"success": False})

    data = request.get_json()

    title = data.get("title")
    messages = json.dumps(data.get("messages"))

    conn = sqlite3.connect("bertoai.db")
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id FROM chats
        WHERE user_id = ? AND title = ?
    """, (session["user_id"], title))

    existing_chat = cursor.fetchone()

    if existing_chat:
        cursor.execute("""
            UPDATE chats
            SET messages = ?
            WHERE id = ?
        """, (messages, existing_chat[0]))
    else:
        cursor.execute("""
            INSERT INTO chats (user_id, title, messages)
            VALUES (?, ?, ?)
        """, (session["user_id"], title, messages))

    conn.commit()
    conn.close()

    return jsonify({"success": True})

@app.route("/delete_chat", methods=["POST"])
def delete_chat():
    if "user_id" not in session:
        return jsonify({"success": False})

    data = request.get_json()
    title = data.get("title")

    conn = sqlite3.connect("bertoai.db")
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM chats
        WHERE user_id = ? AND title = ?
    """, (session["user_id"], title))

    conn.commit()
    conn.close()

    return jsonify({"success": True})


@app.route("/load_chats")
def load_chats():

    if "user_id" not in session:
        return jsonify([])

    conn = sqlite3.connect("bertoai.db")
    cursor = conn.cursor()

    cursor.execute("""
        SELECT title, messages
        FROM chats
        WHERE user_id = ?
        ORDER BY id DESC
    """, (session["user_id"],))

    rows = cursor.fetchall()

    conn.close()

    chats = []

    for row in rows:
        chats.append({
            "title": row[0],
            "messages": json.loads(row[1])
        })

    return jsonify(chats)

if __name__ == "__main__":
    app.run(debug=True)