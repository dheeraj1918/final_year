import { useState, useEffect, useRef } from 'react';
import { onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, collection, orderBy, query } from '../firebase';
import MyMessage from "./MyMessage";
import TheirMessage from "./TheirMessage";
import MessageForm from "./MessageForm";

const ChatFeed = ({ chats, chatId, user, onMenuClick }) => {
    const [messages, setMessages] = useState([]);
    const [isFavorite, setIsFavorite] = useState(false);
    const messagesEndRef = useRef(null);
    const timersRef = useRef(new Map());

    const activeChat = chats?.find(chat => chat.id === chatId);
    const otherUser = activeChat?.participants.find(p => p !== user.email);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!chatId) return;

        const chatRef = doc(db, 'chats', chatId);
        const unsubscribeChat = onSnapshot(chatRef, (doc) => {
            if (doc.exists()) {
                setIsFavorite(doc.data().favorite || false);
            }
        });

        const unsubscribeMessages = onSnapshot(
            query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp')),
            (snapshot) => {
                const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMessages(msgs);
            }
        );

        return () => {
            unsubscribeChat();
            unsubscribeMessages();
        };
    }, [chatId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        messages.forEach(message => {
            if (message.timer && message.timer > 0) {
                const messageId = message.id;
                const timerKey = `${chatId}-${messageId}`;

                if (!timersRef.current.has(timerKey)) {
                    const timerId = setTimeout(async () => {
                        try {
                            await deleteDoc(doc(db, 'chats', chatId, 'messages', messageId));
                            timersRef.current.delete(timerKey);
                        } catch (error) {
                            console.error('Error deleting timed message:', error);
                        }
                    }, message.timer * 60 * 1000); 

                    timersRef.current.set(timerKey, timerId);
                }
            }
        });

        return () => {
            timersRef.current.forEach(timerId => clearTimeout(timerId));
            timersRef.current.clear();
        };
    }, [messages, chatId]);

    const sendMessage = async (messageData) => {
        if (!chatId) return;
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
            ...messageData,
            sender: { 
                username: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                email: user.email 
            },
            timestamp: serverTimestamp()
        });
    };

    const toggleFavorite = async () => {
        if (!chatId) return;
        const chatRef = doc(db, 'chats', chatId);
        try {
            await updateDoc(chatRef, {
                favorite: !isFavorite
            });
        } catch (error) {
            console.error("Error updating favorite status: ", error);
        }
    };

    return (
        <div className="chat-feed">
            <div className="chat-header">
                <div className="chat-header-left">
                    <button className="menu-btn" onClick={onMenuClick}>
                        &#9776;
                    </button>
                    <button className="favorite-btn" onClick={toggleFavorite} style={{ color: isFavorite ? 'gold' : '#666' }}>
                        &#9733;
                    </button>
                </div>
                <div className="chat-title">{otherUser || 'Chat'}</div>
            </div>
            <div className="messages-container">
                {messages.map((message, index) => {
                    const lastMessage = index === 0 ? null : messages[index - 1];
                    const isMyMessage = user.email === message.sender.username;

                    if (isMyMessage) {
                        return <MyMessage key={message.id} message={message} />;
                    }
                    return <TheirMessage key={message.id} message={message} lastMessage={lastMessage} />;
                })}
                <div ref={messagesEndRef} />
            </div>
            <MessageForm sendMessage={sendMessage} />
        </div>
    );
};
 
export default ChatFeed;