# Chatbot Platform

A modern, real-time chat application built with React, TypeScript, and Supabase. This platform allows users to create, customize, and interact with AI-powered chatbots in a sleek, responsive interface.

## 🚀 Features

- 🔒 **User Authentication**: Secure login and registration using Supabase Auth
- 🤖 **Chatbot Creation**: Create and customize AI chatbots with custom avatars and personalities
- 💬 **Real-time Messaging**: Instant message exchange with AI chatbots
- 🎨 **Sleak UI**: Modern, responsive design with a dark theme and pink accents
- 🔄 **Real-time Updates**: Instant synchronization across devices using Supabase Realtime
- 📦 **File Uploads**: Support for custom bot avatars with image uploads

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: CSS Modules
- **State Management**: React Context API
- **Backend**: Supabase (Auth, Database, Storage)
- **Real-time**: Supabase Realtime
- **UI Components**: Custom components with Lucide icons

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or later)
- npm or yarn
- A Supabase project with the following setup:
  - Authentication enabled
  - Storage buckets configured
  - Database tables for chats and messages

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone (https://github.com/androvonx95/characterForge_frontend/)
   cd characterForge_frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   *among other env vars for urls either implemented as supabase edge functions or locally*
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open in your browser**
   The application will be available at `http://localhost:5173`

6. **OUTPUT**

<img width="1886" height="957" alt="image" src="https://github.com/user-attachments/assets/81788ec3-a677-4ee3-bb0d-042e037c83eb" />
<img width="1886" height="957" alt="image" src="https://github.com/user-attachments/assets/1793aff7-73a7-4644-b933-12d51a8256e3" />
<img width="1886" height="957" alt="image" src="https://github.com/user-attachments/assets/3a423476-00a2-4c11-ba44-6d36099c1f81" />
<img width="1022" height="958" alt="image" src="https://github.com/user-attachments/assets/fc116765-6315-41f4-94c6-304d154f65f5" />


## 🎨 Theming

The application features a custom dark theme with pink accents. The theme can be customized by modifying the theme object in `App.tsx`.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) for the amazing backend services
- [Vite](https://vitejs.dev/) for the fast development experience
- [React](https://reactjs.org/) for the UI library
- [Lucide](https://lucide.dev/) for the beautiful icons

## BACKEND
Check out the backend at [https://github.com/androvonx95/CharacterForge_Backend](https://github.com/androvonx95/CharacterForge_Backend)   
