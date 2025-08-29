# Chatbot Platform

A modern, real-time chat application built with React, TypeScript, and Supabase. This platform allows users to create, customize, and interact with AI-powered chatbots in a sleek, responsive interface.

## 🚀 Features

- 🔒 **User Authentication**: Secure login and registration using Supabase Auth
- 🤖 **Chatbot Creation**: Create and customize AI chatbots with custom avatars and personalities
- 💬 **Real-time Messaging**: Instant message exchange with AI chatbots
- 🎨 **Customizable UI**: Modern, responsive design with a dark theme and pink accents
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🔄 **Real-time Updates**: Instant synchronization across devices using Supabase Realtime
- 📦 **File Uploads**: Support for custom bot avatars with image uploads

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: CSS Modules
- **State Management**: React Context API
- **Backend**: Supabase (Auth, Database, Storage)
- **Real-time**: Supabase Realtime
- **UI Components**: Custom components with Lucide icons
- **Routing**: React Router v6

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
   git clone <repository-url>
   cd ch_frontend
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
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open in your browser**
   The application will be available at `http://localhost:5173`

## 📂 Project Structure

```
ch_frontend/
├── public/                  # Static files
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Sidebar.tsx      # Sidebar navigation component
│   │   ├── SidebarProvider.tsx  # Context provider for sidebar state
│   │   └── CharacterPreviewModal.tsx  # Modal for character previews
│   │
│   ├── styles/              # Global styles and CSS modules
│   │   ├── Dashboard.css
│   │   ├── MyChats.css
│   │   ├── chatUI.css
│   │   ├── sidebar.css
│   │   ├── global.css
│   │   └── CharacterPreviewModal.css
│   │
│   ├── utils/               # Utility functions
│   │   ├── aiChat.ts        # AI chat functionality
│   │   ├── createCharacter.ts # Character creation logic
│   │   ├── deleteCharOrConv.ts # Deletion utilities
│   │   ├── deleteMsgs.ts    # Message deletion logic
│   │   ├── fetchBotAndLastMessage.ts
│   │   ├── getCharacterInfo.ts
│   │   ├── getEntityDeletionInfo.ts
│   │   └── getSignedUploadUrl.ts
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useLazyMessages.tsx
│   │   └── useRealtimeCharacterSync.ts
│   │
│   ├── types.ts             # TypeScript type definitions
│   ├── App.tsx              # Root application component
│   ├── Dashboard.tsx        # Main dashboard view
│   ├── conversation.tsx     # Chat conversation interface
│   ├── myChats.tsx          # User's chat history view
│   ├── Paginator.tsx        # Pagination component
│   ├── supabaseClient.ts    # Supabase configuration
│   └── main.tsx             # Application entry point
│
├── .env                     # Environment variables
├── .gitignore               # Git ignore file
├── package.json             # Project dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── tsconfig.node.json       # TypeScript node configuration
├── tsconfig.app.json        # TypeScript app configuration
├── vite.config.ts           # Vite configuration
└── README.md                # Project documentation
```

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

