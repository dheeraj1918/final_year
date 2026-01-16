import { useState } from "react";
import { SendOutlined, PaperClipOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

const MessageForm = ({ sendMessage }) => {
    const [value, setValue] = useState('');
    const [timerValue, setTimerValue] = useState('');
    const [showTimer, setShowTimer] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        const text = value.trim();
        const timer = parseInt(timerValue, 10) || 0;
        if (text) {
            sendMessage({ text, timer: timer > 0 ? timer : null });
        }
        setValue('');
        setTimerValue('');
        setShowTimer(false);
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const timer = parseInt(timerValue, 10) || 0;
        const storageRef = ref(storage, `files/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        sendMessage({
            attachments: [{ file: downloadURL, type: file.type }],
            timer: timer > 0 ? timer : null
        });
        setTimerValue('');
        setShowTimer(false);
    };

    return (
        <div className="message-form-container">
            <form className="message-form" onSubmit={handleSubmit}>
                <input
                    className="message-input"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Type a message..."
                    autoFocus
                />
                <div className="message-form-actions">
                    <label htmlFor="upload-button" className="action-btn">
                        <PaperClipOutlined />
                    </label>
                    <input
                        type="file"
                        id="upload-button"
                        style={{ display: 'none' }}
                        onChange={handleUpload}
                        accept="image/*,video/*"
                    />
                    <button type="button" className="action-btn" onClick={() => setShowTimer(!showTimer)}>
                        <ClockCircleOutlined />
                    </button>
                    {showTimer && (
                        <input
                            type="text"
                            className="timer-input"
                            value={timerValue}
                            onChange={(e) => /^\d*$/.test(e.target.value) && setTimerValue(e.target.value)}
                            placeholder="min"
                        />
                    )}
                    <button type="submit" className="send-btn" disabled={!value.trim()}>
                        <SendOutlined />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MessageForm;