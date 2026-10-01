from http.server import BaseHTTPRequestHandler
import json
import urllib.parse

# 9 Predefined Accounts
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
        "avatar": "👨‍💼"
    },
    "siti.aminah@gmail.com": {
        "email": "siti.aminah@gmail.com",
        "password": "ortu123",
        "name": "Siti Aminah",
        "role": "orangtua",
        "child_name": "Nabila Putri Amanda",
        "child_class": "Kelas 3-B Inklusi",
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
        "avatar": "👩‍💼"
    },
    # 3 Akun Siswa (PIN)
    "reya@corakids.id": {
        "email": "reya@corakids.id",
        "password": "1234",
        "name": "Reya Narendra",
        "role": "siswa",
        "class": "Kelas 2 SD Inklusi",
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
        "streak": 2,
        "avatar": "🧒"
    },
    "nabila@corakids.id": {
        "email": "nabila@corakids.id",
        "password": "1234",
        "name": "Nabila Putri Amanda",
        "role": "siswa",
        "class": "Kelas 3-B Inklusi",
        "coins": 310,
        "streak": 5,
        "avatar": "👧"
    }
}

STUDENTS = [
    {
        "id": "1",
        "name": "Reynarif Zidan",
        "parent": "Hendra Zidan",
        "class": "Kelas 2-B Inklusi",
        "diagnosis": "Disleksia Visual & Fonemik",
        "diagnosis_type": "disleksia",
        "iep_progress": 82,
        "target": "On Track",
        "focus_score": "88% Fonem b vs d",
        "streak": "5 Hari Beruntun",
        "status_badge": "Aktif Belajar",
        "status_class": "badge-mint",
        "notes": "Menunjukkan kemajuan pesat pada kanvas sensorik."
    },
    {
        "id": "2",
        "name": "Nabila Putri",
        "parent": "Siti Aminah",
        "class": "Kelas 3-B Inklusi",
        "diagnosis": "Diskalkulia Spasial",
        "diagnosis_type": "diskalkulia",
        "iep_progress": 68,
        "target": "Perlu Review",
        "focus_score": "74% Nilai Tempat Bilangan",
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
    elif "lelah" in msg or "susah" in msg or "bingung" in msg:
        return (
            "Tidak apa-apa sayang, istirahat sejenak ya. Tarik nafas panjang... hembuskan perlahan. "
            "Otakmu sangat istimewa dan kreatif! Belajar di Cora Kids tidak ada ujian, kita bermain sambil bersenang-senang!"
        )
    else:
        return (
            f"Pertanyaan yang bagus sekali! Mengenai '{user_message}', "
            "kuncinya adalah membaca dengan tenang tanpa terburu-buru. "
            "Cora selalu ada di sampingmu untuk membacakan setiap kata yang sulit!"
        )

class handler(BaseHTTPRequestHandler):
    def send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.endswith("/api/accounts") or path == "/api/accounts":
            demo_list = []
            for email, data in ACCOUNTS.items():
                demo_list.append({
                    "email": email,
                    "password": data["password"],
                    "name": data["name"],
                    "role": data["role"],
                    "avatar": data.get("avatar", "👤"),
                    "title": data.get("title", ""),
                    "institution": data.get("institution", ""),
                    "child_name": data.get("child_name", ""),
                    "child_class": data.get("child_class", ""),
                    "class": data.get("class", ""),
                    "coins": data.get("coins", 0),
                    "streak": data.get("streak", 0)
                })
            self.send_json(200, demo_list)

        elif path.endswith("/api/students") or path == "/api/students":
            self.send_json(200, STUDENTS)

        elif path.endswith("/api/state") or path == "/api/state":
            user_state = {
                "name": "Reya Narendra",
                "role": "siswa",
                "coins": 240,
                "streak": 3,
                "completed_missions": 2,
                "total_missions": 3,
                "stars": 8
            }
            self.send_json(200, user_state)

        else:
            self.send_json(404, {"error": "Endpoint not found"})

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)

        try:
            req_json = json.loads(post_data.decode("utf-8")) if post_data else {}
        except Exception:
            req_json = {}

        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.endswith("/api/login") or path == "/api/login":
            email = req_json.get("email", "").strip().lower()
            password = req_json.get("password", "").strip()

            account = ACCOUNTS.get(email)
            if account and account["password"] == password:
                user_info = dict(account)
                del user_info["password"]
                self.send_json(200, {
                    "success": True,
                    "user": user_info,
                    "message": f"Selamat datang, {user_info['name']}!"
                })
            else:
                self.send_json(401, {
                    "success": False,
                    "message": "Akun atau Kata Sandi salah! Silakan coba lagi dengan akun yang benar."
                })

        elif path.endswith("/api/broadcast") or path == "/api/broadcast":
            msg = req_json.get("message", "Pengingat latihan fonik harian.")
            self.send_json(200, {
                "success": True,
                "message": f"Siaran berhasil dikirimkan ke 24 orang tua siswa terhubung! Pesan: '{msg[:40]}...'"
            })

        elif path.endswith("/api/chat") or path == "/api/chat":
            user_msg = req_json.get("message", "")
            reply = generate_cora_ai_reply(user_msg)
            self.send_json(200, {"reply": reply, "user_message": user_msg})

        elif path.endswith("/api/progress") or path == "/api/progress":
            pts = req_json.get("points", 10)
            self.send_json(200, {"success": True, "message": f"+{pts} koin diperoleh!"})

        else:
            self.send_json(404, {"error": "Endpoint not found"})
