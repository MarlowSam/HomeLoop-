# HomeLoop 

> A full-stack real estate platform connecting property agents with buyers and renters — featuring listings, booking management, live chat, and earnings tracking.

---

## About

HomeLoop is a real estate web platform that empowers property agents to list residential properties, commercial spaces, and short-term rentals (BnBs). Users can browse listings, book property visits, communicate with agents in real time, and track their activity through a personal dashboard.

Agents benefit from flexible subscription plans (monthly, bi-annual, or annual) and a dedicated earnings dashboard to monitor performance.

---

## Features

- **Property Listings** — Agents can post residential, commercial, and BnB properties with full details and media
- **Booking & Visit Scheduling** — Users can request and track property visit bookings
- **Real-Time Chat** — Built-in messaging system for direct agent-to-user communication
- **User Reviews** — Users can leave reviews on properties they have visited
- **Dashboard** — Agents track earnings and bookings; users track their visit history
- **Subscription Plans** — Agents subscribe monthly, bi-annually, or annually
- **Authentication** — Secure user and agent login and signup flows

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Auth | JWT (JSON Web Tokens) |

---

## Project Structure

```
HomeLoop-/
├── public/              # Frontend files
│   ├── *.html           # Page templates
│   ├── *.css            # Stylesheets
│   └── *.js             # Client-side scripts
├── routes/              # Express API routes
│   ├── agents.js
│   ├── auth.js
│   ├── bookings.js
│   ├── properties.js
│   ├── chat.js
│   └── payments.js
├── .gitignore
├── LICENSE
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/MarlowSam/HomeLoop-.git
cd HomeLoop-
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:
```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=homeloop
JWT_SECRET=your_jwt_secret
PORT=3000
```

4. **Set up the database**

Import the MySQL schema and run the server:
```bash
node server.js
```

5. **Open in browser**
```
http://localhost:3000
```

---

## Author

**MarlowSam**
GitHub: [@MarlowSam](https://github.com/MarlowSam)

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
