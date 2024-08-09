import React, { useState, useEffect } from 'react';
import './BugItem.css';
import trashIcon from './assets/trashIcon.png';
import axios from 'axios';

function BugItem({bugId, title, description, status, category, assignedUserId, assignedUsername, priority, importance, creationDate, openDate, isAdmin, onSave, listOfCoders}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedBug, setEditedBug] = useState({
        bugId,
        bugName: title,
        bugDesc: description,
        status,
        category,
        assignedId: assignedUserId,
        assignedName: assignedUsername,
        priority,
        importance,
        creationDate,
        openDate, 
        isDescChanged: '0'
    });

    const statusOptions = ["In Progress", "New", "Done"]; // Options for status dropdown
    const categoryOptions = ["Ui", "Functionality", "Performance", "Usability", "Security"]; // Options for category dropdown

    const handleDeleteBug = async () => {
        if (status !== "Done") return;
        if (!confirm("Are you sure you want to delete this bug?")) return;
        try {
            await axios.post('http://localhost:8090/homePage/removeBug', { bugId });
            window.location.reload(); // refresh the page after successful deletion to see the updated list of bugs
        } catch (error) {
            alert(`Error removing the bug, ${error.response.data.error}`);
        }
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedBug({
            ...editedBug,
            [name]: value,
        });
    };

    const handleSaveClick = async () => {
        setIsEditing(false);

        //check if the description has changed
        if (editedBug.bugDesc !== description) 
            editedBug.isDescChanged = '1'; //indicate that description has been changed
        else
            editedBug.isDescChanged = '0'; //indicate that description hasn't changed

        console.log(editedBug.isDescChanged);
        console.log(editedBug.bugDesc);

        try {
            //adding additional information to the editedBug var before sending it to the database
            editedBug['assignedName'] = assignedToCoder.uname;
            editedBug['assignedId'] = assignedToCoder.uid === 0 ? null : assignedToCoder.uid;
  
            //then after the assignedId is updated we can update the bug safely 
            const response = await axios.post('http://localhost:8090/homePage/updateBug', editedBug);
            if (!response.data.error) {
                response.data['assignedUsername'] = editedBug['assignedName'];
                response.data['assignedId'] = editedBug['assignedId'] === null ? 0 : assignedToCoder.uid;
                onSave(response.data); // Update locally in the frontend if backend update was successful
                console.log('Bug updated successfully');
            } 
            else {
                console.error('Failed to update bug on backend');
            }
            pushNotificationsToAllUsers("The following bug has been updated: " + title);
        } catch (error) {
            console.error('Failed to update bug:', error);
        }
    };

    const pushNotificationsToAllUsers = async (notification_message) => {
        try {
            const response = await axios.post('http://localhost:8090/notifications/pushNotificationsToAllUsers', { message: notification_message });
            if (response.data.error) {
                console.error('Error pushing notification to all users:', response.data.error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleCancelClick = async () => {
        setIsEditing(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Done':
                return 'green';
            case 'In Progress':
                return 'yellow';
            case 'New':
                return 'red';
            default:
                return 'gray'; // Default or unknown status
        }
    };

    // Function to determine the color based on the value
    const getPriorityAndImportanceColor = (value) => {
        if (value <= 4) {
            return 'green';
        } else if (value >= 5 && value <= 7) {
            return 'orange';
        } else if (value >= 8) {
            return 'red';
        } else {
            return 'black'; // Default color if value is out of range
        }
    };

    //this variable holds the userId and the username of the user
    const [assignedToCoder, setAssignedToCoder] = useState({
        uid: 0,
        uname: ""
    });

    useEffect(() => {
        // only assign the assignedToCoder variable if its the first time the component loads
        if (assignedToCoder.uname === "" && listOfCoders) {
            //findAndAssignCoder(assignedUserName);
            setAssignedToCoder({
                uid: assignedUserId,
                uname: assignedUsername
            });
        }
    }, [assignedUserId, assignedUsername, listOfCoders]);

    //helper function for splitting a string on the '-' character to get the username and userId on separate variables
    const parseAssignedUserString = (assignedUserString) => {
        if (assignedUserString === "Unassigned") 
            return { selected_username: "Unassigned", selected_userid: null };
        
        const [username, userIdString] = assignedUserString.split(' - ');
        const userId = parseInt(userIdString, 10); // Convert userId to an integer
        return { selected_username: username.trim(), selected_userid: userId };
    };

   // when the admin user assigns a user this function runs, updates the variables and the database
   const handleAssignmentChange = (event) => {
        const { selected_username, selected_userid } = parseAssignedUserString(event.target.value);
        handleDatabaseUpdates(selected_userid);
        setAssignedToCoder({
            uid: selected_userid,
            uname: selected_username
        });
    };

    // Function for assigning the user in the database and sending him a notification
    const handleDatabaseUpdates = async (userId) => {
        await assignUserInDatabase(userId);
        await pushNotification(userId, "You have been assign to the following bug: " + title);
        return true;
    }

    // given a userId, assign the user to the current bug in the database
    const assignUserInDatabase = async (userId) => {
        try {
            const response = await axios.post('http://localhost:8090/bug/assignUserToBug', { selectedUserId: userId, bugId });
            if (response.data.error) {
                console.error('Error assigning user:', response.data.error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const pushNotification = async (user_id, notification_message) => {
        try {
            const response = await axios.post('http://localhost:8090/notifications/pushNotificationToUser', { userId: user_id, message: notification_message });
            if (response.data.error) {
                console.error('Error pushing notification to user:', response.data.error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };


    return (
        <div className="bug-item-div" style={{ borderColor: getStatusColor(status) }}>
            {isEditing ? (
                <div className="bug-item-editing">
                    <div className="bug-item-row-textarea">
                        <label htmlFor="bugDesc">Bug Description:</label>
                        <textarea 
                            id="bugDesc" 
                            name="bugDesc"  
                            value={editedBug.bugDesc} 
                            onChange={handleInputChange} 
                            className="bug-item-textarea">
                        </textarea>
                    </div>
                    <div className="bug-item-row">
                        <label htmlFor="status">Status:</label>
                        <select 
                            id="status" 
                            name="status" 
                            value={editedBug.status} 
                            onChange={handleInputChange} 
                            className="bug-item-select" // Added className for consistent styling
                        >
                            {statusOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <div className="bug-item-row">
                        <label htmlFor="category">Category:</label>
                        <select 
                            id="category" 
                            name="category" 
                            value={editedBug.category} 
                            onChange={handleInputChange} 
                            className="bug-item-select" // Added className for consistent styling
                        >
                            {categoryOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <div className="bug-item-row">
                        <label htmlFor="priority">Priority:</label>
                        <input 
                            type="text" 
                            id="priority" 
                            name="priority" 
                            value={editedBug.priority} 
                            onChange={handleInputChange} 
                            className="bug-item-input" // Added className for consistent styling
                        />
                    </div>
                    <div className="bug-item-row">
                        <label htmlFor="importance">Importance:</label>
                        <input 
                            type="text" 
                            id="importance" 
                            name="importance" 
                            value={editedBug.importance} 
                            onChange={handleInputChange} 
                            className="bug-item-input" // Added className for consistent styling
                        />
                    </div>
                    <div className="bug-item-row">
                        <div className="bug-item-label">Creation Date:</div>
                        <p className="bug-item-creation-date">{creationDate}</p>
                    </div>
                    <div className="bug-item-row">
                        <div className="bug-item-label">Open Date:</div>
                        <p className="bug-item-open-date">{openDate}</p>
                    </div>
                    <button onClick={handleSaveClick} className="bug-item-save-button">Save</button>
                    <button onClick={handleCancelClick} className="bug-item-cancel-button">Cancel</button>
                </div>
            ) : (
                <div className="bug-item-view">
                    <div className="bug-item-info">
                        <p className="bug-item-title">{title}</p>
                    </div>
                    <div className="bug-item-info">
                        <p className="bug-item-description">{description}</p>
                    </div>
                    <div className="bug-item-info">
                        <p className="bug-item-status" style={{ backgroundColor: getStatusColor(status) }}>{status}</p>
                    </div>

                    {(isAdmin && listOfCoders) ? (
                        <div className="bug-item-info"> 
                            <div className="bug-item-label">Assigned To:</div>
                            <select name="assignedTo" className="bug-item-assigned-combobox" value={`${assignedToCoder.uname} - ${assignedToCoder.uid}`} onChange={handleAssignmentChange} required>
                                <option value="Unassigned">Unassigned</option>
                                {Array.isArray(listOfCoders) && listOfCoders.map(user => (
                                    <option key={user.userId} value={`${user.userName} - ${user.userId}`}>{`${user.userName} - ${user.userId}`}</option>
                                ))}
                            </select>
                        </div>  
                    ) : (
                        <div className="bug-item-info"> 
                            <div className="bug-item-label">Assigned To:</div>
                            <p className="bug-item-assigned-p">{assignedUserId === 0 ? `${assignedUsername}` : `${assignedUsername} - ${assignedUserId}`}</p> {/**`${assignedUsername} - ${assignedUserId}` */}
                        </div> 
                    )}

                    <div className="bug-item-info">
                        <div className="bug-item-label">Category:</div>
                        <p className="bug-item-label">{category}</p>
                    </div>
    
                    <div className="bug-item-info">
                        <div className="bug-item-label">Priority:</div>
                        <p className="bug-item-priority"  style={{ color: getPriorityAndImportanceColor(priority) }}>{priority}</p>
                    </div>
                    <div className="bug-item-info">
                        <div className="bug-item-label">Importance:</div>
                        <p className="bug-item-importance" style={{ color: getPriorityAndImportanceColor(importance) }}>{importance}</p>
                    </div>
                    <div className="bug-item-info">
                        <div className="bug-item-label">Creation Date:</div>
                        <p className="bug-item-creation-date">{creationDate}</p>
                    </div>
                    <div className="bug-item-info">
                        <div className="bug-item-label">Open Date:</div>
                        <p className="bug-item-open-date">{openDate}</p>
                    </div>

                    {(isAdmin && (status === "Done")) && (
                        <img src={trashIcon} className="bug-item-remove-button" onClick={handleDeleteBug} alt="Remove Bug Icon" ></img>
                    )}

                    {!isAdmin && (
                        <button onClick={handleEditClick} className="bug-item-edit-button">Edit</button>
                    )}
                </div>
            )}
        </div>
    );
}

export default BugItem;
