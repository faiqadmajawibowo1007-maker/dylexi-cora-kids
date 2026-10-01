"""
Cora Kids - Dylexi Application Server (Python 3)
Standalone HTTP & REST API server with zero external dependencies.
Features authentication with role-based access (Siswa, Guru/Tim, Orang Tua).
"""

import http.server
import socketserver
import json
import os
import sys
import webbrowser

# Ensure UTF-8 output on Windows console
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

PORT = 8080
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# ========================================================
# PREDEFINED USER ACCOUNTS (3 Guru, 3 Ortu, 3 Siswa)
# ========================================================
ACCOUNTS = {
    # 3 Akun Guru / Tim
    "rahma.kartika@sekolahkita.sch.id": {
        "email": "rahma.kartika@sekolahkita.sch.id",
        "password": "guru123",
        "name": "Rahma Kartika, S.Psi",
        "role": "guru",
        "title": "Koordinator GPK & Konselor",
        "institution": "SD Inklusi Pelita Harapan",
        "avatar": "👩‍🏫"
    },
    "budi.santoso@sekolahkita.sch.id": {
        "email": "budi.santoso@sekolahkita.sch.id",
        "password": "guru123",
        "name": "Budi Santoso, S.Pd",
        "role": "guru",
        "title": "Guru Kelas 2 Inklusi",
        "institution": "SD Inklusi Pelita Harapan",
        "avatar": "👨‍🏫"
    },
    "dewi.lestari@sekolahkita.sch.id": {
        "email": "dewi.lestari@sekolahkita.sch.id",
        "password": "guru123",
        "name": "Dewi Lestari, M.Pd",
        "role": "guru",
        "title": "Terapis Wicara & Fonetik",
        "institution": "SD Inklusi Pelita Harapan",
        "avatar": "👩‍⚕️"
    },

    # 3 Akun Orang Tua
    "hendra.zidan@gmail.com": {
        "email": "hendra.zidan@gmail.com",
        "password": "ortu123",
        "name": "Hendra Zidan",
        "role": "orangtua",
        "child_name": "Reynarif Zidan",
        "child_class": "Kelas 2-B Inklusi",
        "institution": "SD Inklusi Pelita Harapan",
        "avatar": "👨"
    },
    "siti.aminah@gmail.com": {
        "email": "siti.aminah@gmail.com",
        "password": "ortu123",
        "name": "Siti Aminah",
        "role": "orangtua",
        "child_name": "Nabila Putri",
        "child_class": "Kelas 2-A Inklusi",
        "institution": "SD Inklusi Pelita Harapan",
        "avatar": "🧕"
    },
    "yuli.iriana@gmail.com": {
        "email": "yuli.iriana@gmail.com",
        "password": "ortu123",
        "name": "Yuli Iriana",
        "role": "orangtua",
        "child_name": "Dimas Arya",
        "child_class": "Kelas 2-B Inklusi",
        "institution": "SD Inklusi Pelita Harapan",
        "avatar": "👩"
    },

    # 3 Akun Siswa
    "reya@corakids.id": {
        "email": "reya@corakids.id",
        "password": "1234",
        "name": "Reya Narendra",
        "role": "siswa",
        "class": "Kelas 2-A Inklusi",
        "coins": 240,
        "streak": 3,
        "avatar": "👦"
    },
    "zidan@corakids.id": {
        "email": "zidan@corakids.id",
        "password": "1234",
        "name": "Reynarif Zidan",
        "role": "siswa",
        "class": "Kelas 2-B Inklusi",
        "coins": 180,
        "streak": 5,
        "avatar": "🧒"
    },
    "nabila@corakids.id": {
        "email": "nabila@corakids.id",
        "password": "1234",
        "name": "Nabila Putri",
        "role": "siswa",
        "class": "Kelas 3-A Inklusi",
        "coins": 310,
        "streak": 3,
        "avatar": "👧"
    }
}

# In-memory student dataset for Admin Portal
STUDENTS_DATA = [
    {
        "id": "1",
        "name": "Reynarif Zidan",
        "parent": "Hendra Zidan",
        "class": "Kelas 2-B Inklusi",
        "diagnosis": "Disleksia Fonemik • Disgrafia Ringan",
        "diagnosis_type": "disleksia",
        "iep_progress": 65,
        "target": "Target Sem 1",
        "focus_score": "88% Akurasi Bunyi Kata",
        "streak": "5 Hari Beruntun",
        "status_badge": "Sangat Baik",
        "status_class": "badge-mint",
        "notes": "Respon visual cepat, butuh penegasan huruf b & d."
    },
    {
        "id": "2",
        "name": "Nabila Putri",
        "parent": "Siti Aminah",
        "class": "Kelas 2-A Inklusi",
        "diagnosis": "Diskalkulia Ringan",
        "diagnosis_type": "diskalkulia",
        "iep_progress": 90,
        "target": "Target Sem 1 Selesai",
        "focus_score": "78% Konsep Jumlah & Angka",
        "streak": "3 Hari Beruntun",
        "status_badge": "Penguatan Manipulatif",
        "status_class": "badge-blue",
        "notes": "Lebih mudah memahami dengan balok angka Cora."
    },
    {
        "id": "3",
        "name": "Dimas Arya",
        "parent": "Yuli Iriana",
        "class": "Kelas 2-B Inklusi",
        "diagnosis": "Disleksia Fonemik",
        "diagnosis_type": "disleksia",
        "iep_progress": 40,
        "target": "Di Bawah Target",
        "focus_score": "52% Diskriminasi Fonem B/D",
        "streak": "1 Hari (Perlu Dorongan)",
        "status_badge": "Sesi Khusus GPK",
        "status_class": "badge-red",
        "notes": "Tertukar huruf cermin b & d saat membaca cepat."
    },
    {
        "id": "4",
        "name": "Jessica Amelia",
        "parent": "Budi Santoso",
        "class": "Kelas 3-A Inklusi",
        "diagnosis": "Disgrafia Motorik Halus",
        "diagnosis_type": "disgrafia",
        "iep_progress": 70,
        "target": "Melampaui Target",
        "focus_score": "94% Kerapian Jalur Tulis",
        "streak": "6 Hari Beruntun",
        "status_badge": "Motorik Tulis Rapi",
        "status_class": "badge-mint",
        "notes": "Latihan tracking garis Cora sangat membantu."
    },
    {
        "id": "5",
        "name": "Kevin Sanjaya",
        "parent": "Maya Kurnia",
        "class": "Kelas 2-A Inklusi",
        "diagnosis": "Sensori & Regulasi Emosi",
        "diagnosis_type": "sensori",
        "iep_progress": 75,
        "target": "On Track",
        "focus_score": "82% Stabilitas Durasi Fokus",
        "streak": "4 Hari Beruntun",
        "status_badge": "Regulasi Mandiri",
        "status_class": "badge-blue",
        "notes": "Menggunakan fitur jeda bebas tekanan secara mandiri."
    }
]

# Rule-based Pedagogical AI responses for Dyslexia Learning Support
def generate_cora_ai_reply(user_message):
    msg = user_message.lower()

    if "b" in msg and "d" in msg:
        return (
            "Huruf 'b' dan 'd' adalah sahabat kembar! "
            "Ingat rumus Cora: huruf 'b' punya tiang lurus dan perut buncit di sebelah kanan (seperti orang tersenyum)! "
            "Sedangkan huruf 'd' perutnya di sebelah kiri, lalu diberi tiang lurus di kanan!"
        )
    elif "p" in msg or "q" in msg:
        return (
            "Huruf 'p' dan 'q' juga seru! Huruf 'p' punya tiang ke bawah dan kepala di kanan atas. "
            "Sedangkan 'q' kepalanya di kiri atas! Jangan terburu-buru ya, lihat arah lengkungannya perlahan."
        )
    elif "cerita" in msg or "dongeng" in msg:
        return (
            "Suatu hari di Hutan Huruf Ceria, Ciko si beruang melihat pohon apel penuh huruf ajaib. "
            "Ciko mencari huruf B untuk membuat Bolu Buah yang lezat. Mau bantu Ciko mencari bahannya?"
        )
    elif "hewan" in msg or "suara" in msg:
        return (
            "Dengarkan baik-baik: 'Kwek... kwek... kwek!' Itu suara bebek! "
            "Kata 'Bebek' diawali dengan huruf apa? Ya, huruf b! Kamu pintar sekali!"
        )
    elif "lelah" in msg or "susah" in msg or "bingung" in msg:
        return (
            "Tidak apa-apa sayang, istirahat sejenak ya. Tarik nafas panjang... hembuskan perlahan. "
            "Otakmu sangat istimewa dan kreatif! Belajar di Cora Kids tidak ada ujian, kita bermain sambil bersenang-senang!"
        )
    elif "terima kasih" in msg or "makasih" in msg:
        return "Sama-sama Reya tersayang! Cora selalu senang menemani petualangan belajarmu!"
    else:
        return (
            f"Pertanyaan yang bagus sekali! Mengenai '{user_message}', "
            "kuncinya adalah membaca dengan tenang tanpa terburu-buru. "
            "Cora selalu ada di sampingmu untuk membacakan setiap kata yang sulit!"
        )

class CoraKidsHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        if self.path == "/api/accounts":
            # Return list of demo accounts for the login cheat card
            demo_list = []
            for email, data in ACCOUNTS.items():
                demo_list.append({
                    "email": email,
                    "password": data["password"],
                    "name": data["name"],
                    "role": data["role"],
                    "avatar": data.get("avatar", "👤"),
                    "title": data.get("title") or data.get("child_name") or data.get("class")
                })
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(demo_list).encode("utf-8"))

        elif self.path == "/api/students":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(STUDENTS_DATA).encode("utf-8"))

        elif self.path == "/api/state":
            user_state = {
                "name": "Reya Narendra",
                "level": "PEMULA 1",
                "coins": 240,
                "streak": 3,
                "completed_missions": 2,
                "total_missions": 3,
                "stars": 8
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(user_state).encode("utf-8"))

        else:
            if self.path == "/" or self.path == "":
                self.path = "/index.html"
            super().do_GET()

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)

        try:
            req_json = json.loads(post_data.decode("utf-8")) if post_data else {}
        except Exception:
            req_json = {}

        if self.path == "/api/login":
            email = req_json.get("email", "").strip().lower()
            password = req_json.get("password", "").strip()
            role_choice = req_json.get("role", "")

            # Check matching account
            account = ACCOUNTS.get(email)
            if account and account["password"] == password:
                user_info = dict(account)
                del user_info["password"]
                res = {
                    "success": True,
                    "user": user_info,
                    "message": f"Selamat datang, {user_info['name']}!"
                }
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(res).encode("utf-8"))
            else:
                res = {
                    "success": False,
                    "message": "Akun atau Kata Sandi salah! Silakan coba lagi dengan akun yang benar."
                }
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(res).encode("utf-8"))

        elif self.path == "/api/broadcast":
            msg = req_json.get("message", "Pengingat latihan fonik harian.")
            res = {
                "success": True,
                "message": f"Siaran berhasil dikirimkan ke 24 orang tua siswa terhubung! Pesan: '{msg[:40]}...'"
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(res).encode("utf-8"))

        elif self.path == "/api/chat":
            user_msg = req_json.get("message", "")
            reply = generate_cora_ai_reply(user_msg)
            res = {"reply": reply, "user_message": user_msg}
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(res).encode("utf-8"))

        elif self.path == "/api/progress":
            pts = req_json.get("points", 10)
            res = {"success": True, "message": f"+{pts} koin diperoleh!"}
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(res).encode("utf-8"))

        else:
            self.send_response(404)
            self.end_headers()

def run_server(port=PORT):
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", port), CoraKidsHandler) as httpd:
            print("=" * 60)
            print("  [Cora Kids] - Dylexi Web Server Running!")
            print(f"  URL: http://localhost:{port}")
            print(f"  Serving from: {STATIC_DIR}")
            print("  Tekan Ctrl+C untuk menghentikan server.")
            print("=" * 60)
            
            if "--open" in sys.argv or "-o" in sys.argv:
                webbrowser.open(f"http://localhost:{port}")
                
            httpd.serve_forever()
    except OSError as e:
        if port < 8090:
            print(f"Port {port} sedang digunakan, mencoba port {port + 1}...")
            run_server(port + 1)
        else:
            raise e

if __name__ == "__main__":
    run_server()
