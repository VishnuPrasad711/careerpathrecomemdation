# AI Career Recommendation System

An intelligent career guidance platform that uses AI to provide personalized career recommendations, resume analysis, and ATS optimization.

## 🚀 Quick Start

```bash
# Clone and setup
cd ai-career-recommendation-system
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux

# Install and run
pip install -r requirements.txt
cd backend && cp .env.example .env  # Configure your API keys
uvicorn main:app --reload
```

Then open `frontend/index.html` in your browser!

## 🚀 Features

- **AI-Powered Career Recommendations**: Get personalized career advice based on your skills, experience, and goals
- **Resume Upload & Analysis**: Upload PDF resumes for automatic skill extraction and analysis
- **ATS Optimization Check**: Analyze your resume against job descriptions to improve ATS compatibility
- **User Authentication**: Secure login and registration system with JWT tokens
- **Profile Management**: Build and update your professional profile
- **Interactive Dashboard**: Modern web interface with real-time updates
- **Game Integration**: Gamified learning experience with scoring system
- **Password Reset**: Secure password recovery system

## 🛠️ Tech Stack

### Backend
- **FastAPI**: High-performance async web framework
- **SQLAlchemy**: ORM for database operations
- **SQLite**: Database (easily configurable for PostgreSQL/MySQL)
- **JWT**: JSON Web Tokens for authentication
- **Google Generative AI**: AI-powered career recommendations
- **PyPDF2**: PDF processing for resume uploads

### Frontend
- **HTML5/CSS3**: Modern responsive design
- **JavaScript (ES6+)**: Interactive user interface
- **Fetch API**: RESTful API communication

## 📋 Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Google AI API key (for AI features)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-career-recommendation-system
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv .venv
   # On Windows
   .venv\Scripts\activate
   # On macOS/Linux
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**

   Copy the example environment file and configure it:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your actual values
   ```

5. **Initialize the database**
   ```bash
   cd backend
   python -c "from main import models; models.Base.metadata.create_all(bind=models.engine)"
   ```

## 🚀 Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Open the frontend**
   - Open `frontend/index.html` in your web browser
   - Or serve the frontend files with a web server

3. **Access the application**
   - Frontend: `http://localhost:8000/frontend/index.html` (if serving static files)
   - API Documentation: `http://localhost:8000/docs` (Swagger UI)
   - Alternative API Docs: `http://localhost:8000/redoc`

## 📖 API Documentation

The API provides the following endpoints:

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `POST /api/password-reset-request` - Request password reset
- `POST /api/password-reset` - Reset password

### Profile Management
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### AI Features
- `POST /api/recommendations` - Get career recommendations
- `POST /api/upload-resume` - Upload and analyze resume
- `POST /api/ats/check` - Check resume against job description
- `POST /api/chat` - Chat with AI career coach

### Gaming
- `GET /api/games/scores` - Get user game scores
- `POST /api/games/scores` - Save game score

## 🎮 How to Use

1. **Register/Login**: Create an account or log in with existing credentials
2. **Complete Your Profile**: Add your skills, experience, education, and location
3. **Get Recommendations**: Receive AI-powered career suggestions
4. **Upload Resume**: Upload your resume for analysis
5. **Check ATS Compatibility**: Test your resume against job descriptions
6. **Chat with AI Coach**: Get personalized advice through the chat interface
7. **Play Games**: Engage with gamified learning modules

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation with Pydantic
- Secure file upload handling

## 🗄️ Database Schema

The application uses SQLite with the following main tables:
- `users` - User accounts and authentication
- `profiles` - User professional profiles
- `game_scores` - User gaming achievements

## 🔧 Configuration

### Environment Variables
- `SECRET_KEY`: JWT signing key (change in production)
- `GOOGLE_API_KEY`: Google AI API key for AI features

### Database
The app uses SQLite by default. To use PostgreSQL/MySQL:
1. Install appropriate database driver
2. Update `database.py` with new connection string
3. Run migrations

## 🧪 Testing

Run the backend tests:
```bash
cd backend
python -m pytest
```

## � Project Structure

```
ai-career-recommendation-system/
├── backend/                    # FastAPI backend
│   ├── main.py                # Main application file
│   ├── auth.py                # Authentication logic
│   ├── models.py              # SQLAlchemy models
│   ├── schemas.py             # Pydantic schemas
│   ├── database.py            # Database configuration
│   ├── ai_service.py          # AI integration services
│   ├── app.db                 # SQLite database (auto-generated)
│   ├── .env                   # Environment variables (create from .env.example)
│   └── .env.example           # Environment variables template
├── frontend/                   # Static web frontend
│   ├── index.html             # Login/registration page
│   ├── dashboard.html         # Main dashboard
│   ├── recommendations.html   # Career recommendations page
│   ├── landing.html           # Landing page
│   ├── css/
│   │   └── styles.css         # Main stylesheet
│   └── js/
│       ├── auth.js            # Authentication JavaScript
│       ├── dashboard.js       # Dashboard functionality
│       └── recommendations.js # Recommendations page logic
├── requirements.txt           # Python dependencies
├── README.md                  # This file
└── .gitignore                 # Git ignore rules
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Generative AI for AI-powered recommendations
- FastAPI community for the excellent framework
- Open source contributors

## 📞 Support

If you encounter any issues or have questions:
1. Check the API documentation at `/docs`
2. Review the code comments
3. Open an issue on GitHub

---

**Happy Career Planning! 🚀**