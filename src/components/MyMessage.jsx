import { useState, useEffect } from 'react';

const MyMessage = ({ message }) => {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (message.timer && message.timer > 0) {
            const messageTime = message.timestamp?.toDate ? message.timestamp.toDate() : new Date(message.timestamp);
            const expiryTime = new Date(messageTime.getTime() + (message.timer * 60 * 1000));

            const updateTimer = () => {
                const now = new Date();
                const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
                setTimeLeft(remaining > 0 ? remaining : null);
            };

            updateTimer();
            const interval = setInterval(updateTimer, 1000);
            return () => clearInterval(interval);
        }
    }, [message.timer, message.timestamp]);

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatTimeLeft = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const renderAttachment = (attachment) => {
        if (attachment.type.startsWith('image/')) {
            return <img src={attachment.file} alt="attachment" className="message-image" />;
        } else if (attachment.type.startsWith('video/')) {
            return <video src={attachment.file} controls className="message-video" />;
        }
        return null;
    };

    return (
        <div className="my-message-row">
            <div className="my-message-bubble">
                {message.attachments && message.attachments.length > 0
                    ? renderAttachment(message.attachments[0])
                    : <p className="message-text">{message.text}</p>
                }
                <div className="message-meta">
                    <span className="message-timestamp">{formatTime(message.timestamp)}</span>
                    {timeLeft !== null && (
                        <span className="message-timer">
                            &#x23F2; {formatTimeLeft(timeLeft)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyMessage;