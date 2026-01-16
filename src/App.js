import './App.css';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where, doc, getDoc, addDoc, serverTimestamp, orderBy, limit, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import ChatList from './components/ChatList';
import ChatFeed from './components/ChatFeed';
import LoginForm from './components/LoginForm';
import Settings from './components/Settings';

function App() {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch chats where user is a participant
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.email));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatPromises = snapshot.docs.map(async (doc) => {
        const chatData = { id: doc.id, ...doc.data() };

        // Get the last message for each chat
        const messagesRef = collection(db, 'chats', doc.id, 'messages');
        const lastMessageQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
        const lastMessageSnap = await getDocs(lastMessageQuery);

        if (!lastMessageSnap.empty) {
          chatData.lastMessage = { id: lastMessageSnap.docs[0].id, ...lastMessageSnap.docs[0].data() };
        }

        return chatData;
      });

      const chatList = await Promise.all(chatPromises);
      
      // Sort chats by last message timestamp
      chatList.sort((a, b) => {
        const timeA = a.lastMessage?.timestamp?.toMillis() || a.createdAt?.toMillis() || 0;
        const timeB = b.lastMessage?.timestamp?.toMillis() || b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

      setChats(chatList);
    });
    return unsubscribe;
  }, [user]);

  const startNewChat = async (recipientEmail) => {
    if (!user || recipientEmail === user.email) return;

    // Check if chat already exists
    const chatId = [user.email, recipientEmail].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await addDoc(collection(db, 'chats'), {
        id: chatId,
        participants: [user.email, recipientEmail].sort(),
        createdAt: serverTimestamp()
      });
    }
    setCurrentChat(chatId);
    setShowSettings(false); // Switch back to chat view
  };

  const handleSetCurrentChat = (chatId) => {
    setCurrentChat(chatId);
    setSidebarOpen(false);
    setShowSettings(false);
  }

  const handleMouseDown = (e) => {
    setIsResizing(true);
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    const newWidth = e.clientX;
    if (newWidth > 200 && newWidth < 600) { // Min and max width constraints
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  if (!user) return <LoginForm />

  return (
    <div className="App" style={{ display: 'flex', height: '100vh', backgroundColor: '#f8f9fa' }}>
      <ChatList
        chats={chats}
        currentChat={currentChat}
        setCurrentChat={handleSetCurrentChat}
        startNewChat={startNewChat}
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onShowSettings={() => setShowSettings(true)}
        width={sidebarWidth}
      />
      <div
        className="resizer"
        onMouseDown={handleMouseDown}
        style={{ width: '5px', cursor: 'col-resize', backgroundColor: '#ddd' }}
      ></div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {showSettings ? (
          <div>
            <button onClick={() => setShowSettings(false)}>Back to Chat</button>
            <Settings user={user} />
          </div>
        ) : currentChat ? (
          <ChatFeed
            chats={chats}
            chatId={currentChat}
            user={user}
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          />
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#e5ddd5',
            fontSize: '18px',
            color: '#666'
          }}>
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
