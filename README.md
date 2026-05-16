Qill  Real-Time Chat Application
A full-stack real-time messaging platform built with Django, React, and WebSockets, featuring offline message support and cloud-based media storage.
🎥 Demo
https://youtu.be/CjQONxKs7W4
Live Demo: qill.onrender.com
✨ Features
Real-time messaging via WebSocket connections
Typing indicators showing when users are composing messages
Read receipts to track message delivery and read status
Media sharing with Cloudinary integration for images and files
Offline message persistence using IndexedDB for reliable message delivery
Optimized WebSocket architecture using a single consolidated connection for efficiency
🛠️ Tech Stack
Backend:
Django
Django Channels (WebSocket support)
PostgreSQL
Cloudinary (media storage)
Frontend:
React
IndexedDB (offline storage)
WebSocket API
🏗️ Architecture Highlights
Single WebSocket endpoint handling all real-time operations (typing, messages, receipts) for improved efficiency
IndexedDB hydration ensuring messages persist locally before server confirmation
Optimistic UI updates with proper revalidation strategies
Migrated from dual WebSocket endpoints to a unified connection model for better resource management
🚀 Getting Started
clone repo,
cd to backend 
install dependencies using pip install requirements
env variables needed, 
💡 Technical Challenges Solved
Redesigned conversation initialization architecture from an obfuscated multi-endpoint system to a clean, professional single-endpoint model
Resolved distributed async issues by properly separating HTTP responses from WebSocket channel updates
Implemented optimistic UI updates with proper rollback handling for failed operations
Built offline-first messaging with IndexedDB to handle intermittent connectivity
📝 Future Enhancements
Message retry mechanism for failed sends
End-to-end encryption
Group chat functionality
Voice/video calling
