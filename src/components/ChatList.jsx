import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { PlusOutlined, SettingOutlined, MenuOutlined, StarOutlined, StarFilled, UserOutlined, DeleteOutlined, LogoutOutlined } from '@ant-design/icons';
import { Dropdown, Modal } from 'antd';

const ChatList = ({ chats, currentChat, setCurrentChat, startNewChat, user, isOpen, onClose, onShowSettings, width }) => {
  const [newChatEmail, setNewChatEmail] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  const handleStartNewChat = () => {
    if (newChatEmail.trim()) {
      startNewChat(newChatEmail.trim());
      setNewChatEmail('');
      setShowNewChat(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleFavorite = async (chatId, isFavorited) => {
    const chatRef = doc(db, 'chats', chatId);
    try {
      if (isFavorited) {
        await updateDoc(chatRef, {
          favoritedBy: arrayRemove(user.email)
        });
      } else {
        await updateDoc(chatRef, {
          favoritedBy: arrayUnion(user.email)
        });
      }
    } catch (error) {
      console.error("Error updating favorite status: ", error);
    }
  };

  const handleLeaveChat = (chatId) => {
    Modal.confirm({
      title: 'Are you sure you want to leave this chat?',
      content: 'You will not be able to see messages in this chat unless you are added back.',
      okText: 'Leave',
      cancelText: 'Cancel',
      onOk: async () => {
        const chatRef = doc(db, 'chats', chatId);
        try {
          await updateDoc(chatRef, {
            participants: arrayRemove(user.email)
          });
          if (currentChat === chatId) {
            setCurrentChat(null);
          }
        } catch (error) {
          console.error("Error leaving chat: ", error);
        }
      }
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => onShowSettings(),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  return (
    <div className={`chat-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="user-info">
          <div className="avatar-placeholder user-avatar" style={{ backgroundImage: `url(${user.photoURL})` }}>
            {!user.photoURL && user.displayName ? user.displayName.charAt(0).toUpperCase() : !user.photoURL && user.email.charAt(0).toUpperCase()}
          </div>
          <span className="user-name">{user.displayName || user.email}</span>
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <MenuOutlined style={{ fontSize: '18px', cursor: 'pointer', marginLeft: '8px' }} />
          </Dropdown>
        </div>
        <div className="sidebar-actions">
          <button className="new-chat-btn" onClick={() => setShowNewChat(!showNewChat)}>
            <PlusOutlined />
          </button>
        </div>
      </div>

      {showNewChat && (
        <div className="new-chat-form">
          <input
            type="email"
            placeholder="Enter user's email"
            value={newChatEmail}
            onChange={(e) => setNewChatEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStartNewChat()}
            className="new-chat-input"
            autoFocus
          />
          <button onClick={handleStartNewChat} className="start-chat-btn">
            Start
          </button>
        </div>
      )}

      <div className="chats-list">
        {chats.map(chat => {
          const otherUser = chat.participants.find(p => p !== user.email);
          const lastMessage = chat.lastMessage || {};
          const isActive = currentChat === chat.id;
          const isFavorited = chat.favoritedBy && chat.favoritedBy.includes(user.email);

          const chatMenuItems = [
            {
              key: 'favorite',
              icon: isFavorited ? <StarFilled /> : <StarOutlined />,
              label: isFavorited ? 'Unfavorite' : 'Favorite',
              onClick: () => handleFavorite(chat.id, isFavorited),
            },
            {
              key: 'leave',
              icon: <DeleteOutlined />,
              label: 'Leave Chat',
              onClick: () => handleLeaveChat(chat.id),
            },
          ];

          return (
            <div
              key={chat.id}
              onClick={() => setCurrentChat(chat.id)}
              className={`chat-item ${isActive ? 'active' : ''}`}
            >
              <div className="chat-avatar">
                <div className="avatar-placeholder">
                  {(otherUser || ' ').charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="chat-info">
                <div className="chat-name">
                  {isFavorited && <StarFilled style={{ color: '#ffc107', marginRight: '8px' }} />}
                  {otherUser || 'New Chat'}
                </div>
                <div className="chat-last-message">
                  {lastMessage.text || 'No messages yet'}
                </div>
              </div>
              <div className="chat-meta">
                <div className="chat-time">
                  {formatTime(lastMessage.timestamp)}
                </div>
                <div className="chat-actions">
                  <Dropdown menu={{ items: chatMenuItems }} trigger={['click']}>
                    <MenuOutlined style={{ fontSize: '16px', cursor: 'pointer' }} />
                  </Dropdown>
                </div>
                {lastMessage.sender !== user.email && lastMessage.text && (
                  <div className="unread-indicator"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;