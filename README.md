# ☁️ PiCloud

**PiCloud** is a self-hosted, local-network cloud storage service built for Raspberry Pi (and any Linux machine).  
It allows you to upload, organize, preview, and stream files directly from your own server — no external cloud, no subscriptions, no Docker.

> Built as a learning project and evolved into a fully working home cloud.

---

## ✨ Features

- 🔐 Password-protected access (JWT authentication)
- 📁 Multi-file upload & download (drag & drop)
- 🗂️ Folder system (move files between folders)
- 🎞️ Video streaming with thumbnails (currently not working)
- 🎵 Audio streaming (MP3, etc.) (currently not working)
- 🖼️ Image previews
- 📊 Storage statistics
- 🌗 Light / Dark theme toggle
- ⚡ Optional real-time activity logging
- 🚀 Runs as a systemd service (auto-start on boot)

All data is stored locally using simple JSON files — no database required.

---

## 🧱 Tech Stack

### Backend
- Node.js
- Express
- Multer (file uploads)
- FFmpeg (video thumbnails)
- JWT authentication
- JSON file storage

### Frontend
- React (Vite)
- Tailwind CSS
- Native HTML5 audio & video

### Platform
- Raspberry Pi OS (Lite recommended)
- Linux systemd service

---

## 📂 Project Structure

```
picloud/
├── client/           # React frontend (Vite)
│   └── dist/         # Production build (generated)
├── server/           # Node.js backend
│   └── src/
├── picloud_storage/  # Uploads, thumbnails, JSON data
└── README.txt
```

---

## 🚀 Running Locally (Development)

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001

---

## 📦 Deployment on Raspberry Pi (Production)

### 1️⃣ Install dependencies
```bash
sudo apt update
sudo apt install -y nodejs npm ffmpeg git
```

### 2️⃣ Clone the repository
```bash
git clone <your-repo-url> ~/cloud
cd ~/cloud
```

### 3️⃣ Create storage directories
```bash
mkdir -p ~/picloud_storage/{uploads,thumbs,data}
```

### 4️⃣ Backend setup
```bash
cd server
npm install
nano .env
```

Example `.env`:
```env
PORT=3001
JWT_SECRET=change_this_to_a_long_random_string
UPLOAD_DIR=/home/<user>/picloud_storage/uploads
THUMBS_DIR=/home/<user>/picloud_storage/thumbs
DATA_DIR=/home/<user>/picloud_storage/data
NODE_ENV=production
```

---

### 5️⃣ Build frontend
```bash
cd ../client
npm install
npm run build
```

---

### 6️⃣ Run as a systemd service

Create service file:
```bash
sudo nano /etc/systemd/system/picloud.service
```

```ini
[Unit]
Description=PiCloud
After=network.target

[Service]
Type=simple
User=<user>
WorkingDirectory=/home/<user>/cloud/server
EnvironmentFile=/home/<user>/cloud/server/.env
ExecStart=/usr/bin/node /home/<user>/cloud/server/src/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable & start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable picloud
sudo systemctl start picloud
```

View logs:
```bash
sudo journalctl -u picloud -f
```

---

## 🌐 Accessing PiCloud

From another device on your local network:
```
http://<PI_IP>:3001
```

Optional hostname:
```bash
sudo apt install -y avahi-daemon
```

Then access via:
```
http://picloud.local:3001
```

---

## 🔒 Security Notes

- Designed for **local network use**
- No HTTPS by default
- Do **not expose directly to the internet**
- Use strong passwords and JWT secrets

---

## 🛠️ Possible Future Improvements

- Drag & drop folder moves
- Multiple user accounts
- External drive support
- HTTPS via reverse proxy
- File sharing links
- Mobile UI improvements

---

## 🎓 Why This Project Exists

PiCloud was built as:
- a learning project (Node.js, React, Linux, systemd)
- a practical home cloud alternative
- a Raspberry Pi challenge

It covers the full stack: frontend, backend, OS-level deployment, permissions, and networking.

---

## 📜 License

MIT License — use it, modify it, break it, fix it 😄
