import { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../firebase';

const Settings = ({ user, setCurrentUser }) => {
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [photo, setPhoto] = useState(null);
    const [photoURL, setPhotoURL] = useState(user.photoURL || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let newPhotoURL = photoURL;
            if (photo) {
                const photoRef = ref(storage, `avatars/${user.uid}/${photo.name}`);
                await uploadBytes(photoRef, photo);
                newPhotoURL = await getDownloadURL(photoRef);
            }

            await updateProfile(auth.currentUser, {
                displayName: displayName,
                photoURL: newPhotoURL,
            });
            
            // Passing the updated user to the parent component is not straightforward
            // because the auth object is not directly mutable in the parent state from here.
            // A page reload or a global state management would be needed.
            // For now, we can update the local state to reflect the change visually.
            setPhotoURL(newPhotoURL);
            alert('Profile updated successfully! Refresh to see changes everywhere.');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = (e) => {
        if (e.target.files[0]) {
            setPhoto(e.target.files[0]);
            const reader = new FileReader();
            reader.onload = (e) => setPhotoURL(e.target.result);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    return (
        <div className="settings-page">
            <h2>User Profile</h2>
            <form onSubmit={handleSubmit}>
                <div className="avatar-section">
                    <img src={photoURL} alt="Avatar" className="profile-avatar" />
                    <input type="file" onChange={handlePhotoChange} accept="image/*" />
                </div>
                <div className="input-group">
                    <label htmlFor="displayName">Display Name</label>
                    <input
                        type="text"
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your display name"
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={user.email}
                        disabled
                    />
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Profile'}
                </button>
            </form>
        </div>
    );
};

export default Settings;
