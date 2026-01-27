# SkillBaazi

SkillBaazi is a comprehensive platform designed with a robust backend and worker architecture, currently expanding to include a modern frontend interface. This project enables scalable background job processing, secure user authentication, and data management.

## 🚀 Technology Stack

### Backend
The backend is built using **NestJS**, a progressive Node.js framework, ensuring a modular and scalable architecture.

*   **Framework**: NestJS (TypeScript)
*   **Database**: PostgreSQL
*   **ORM**: Prisma
*   **Authentication**: JWT, Passport, Bcrypt
*   **Queue/Job Processing**: BullMQ (Redis-based)
*   **API Documentation**: Swagger/OpenAPI
*   **Validation**: Class Validator, Class Transformer

### Worker Service
A dedicated worker service helps in processing background tasks efficiently, decoupling heavy operations from the main API.

*   **Framework**: NestJS (TypeScript)
*   **Queue Processing**: BullMQ
*   **Monitoring**: Bull Board (for visualization of queues)
*   **Database Access**: Shared Prisma Client

### Frontend (Pending)
The frontend is currently under development and will be built using modern web technologies to ensure a seamless user experience.

*   **Framework**: Next.js
*   **Language**: TypeScript
*   **Status**: 🚧 Creation in progress

## 📂 Project Structure

*   **`backend/`**: Contains the main API logic, including user authentication, resource management, and API endpoints.
*   **`worker/`**: A separate service dedicated to consuming and processing background jobs from BullMQ.
*   **`frontend/`**: Directory reserved for the upcoming Next.js application.

## 🛠️ Getting Started

### Prerequisites
*   Node.js (LTS version recommended)
*   PostgreSQL
*   Redis (for BullMQ)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/kumarpraveer143/skillbaazi.git
    cd SkillBaazi
    ```

2.  **Setup Backend:**
    ```bash
    cd backend
    npm install
    cp .env.example .env  # Configure your database and redis credentials
    npx prisma generate
    npm run start:dev
    ```

3.  **Setup Worker:**
    ```bash
    cd ../worker
    npm install
    cp .env.example .env  # Ensure it matches backend credentials where necessary
    npx prisma generate
    npm run start:dev
    ```

4.  **Setup Frontend (Coming Soon):**
    ```bash
    cd ../frontend
    # Instructions will be added once the frontend is initialized
    ```

## 📜 Key Features (Current)
*   **Secure Authentication**: Robust login and registration using JWT.
*   **Scalable Architecture**: Separation of concerns between API handling and background processing.
*   **Database Management**: Type-safe database interactions with Prisma.
*   **Job Queues**: Efficient handling of asynchronous tasks with BullMQ.
*   **API Documentation**: Auto-generated Swagger docs for easy API testing and integration.

## 🤝 Contributing
Contributions are welcome! Please feel free to verify the status of the `frontend` directory or submit pull requests for backend improvements.

## 📄 License
[UNLICENSED]
