import React from 'react';

const Settings = () => {
    const handleLogout = () => {
        // Handle logout functionality (e.g., clear user session, redirect to login page)
        console.log('User logged out!');
    };

    return (
        <div>
            <h1>User Profile</h1>
            <div>
                {/* User Profile Information */}
                <h2>Profile Details</h2>
                <p>Name: John Doe</p>
                <p>Email: johndoe@example.com</p>
            </div>

            <h1>Account Management</h1>
            <div>
                {/* Account Management Features */}
                <h2>Change Password</h2>
                <input type="password" placeholder="New Password" />
                <button>Update Password</button>
            </div>

            <h1>Statistics</h1>
            <div>
                {/* User Statistics */}
                <h2>Your Activity</h2>
                <p>Projects Completed: 5</p>
                <p>Hours Spent: 20</p>
            </div>

            <h1>Preferences</h1>
            <div>
                {/* User Preferences */}
                <h2>Notification Settings</h2>
                <label>
                    <input type="checkbox" />
                    Email Notifications
                </label>
                <br />
                <label>
                    <input type="checkbox" />
                    SMS Notifications
                </label>
            </div>

            <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default Settings;
