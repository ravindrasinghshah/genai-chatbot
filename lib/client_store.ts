/**
 * Functions to manage data persistence at client side
 */
function clearChatContext() {
    localStorage.clear();
}
function setUsername(username: string) {
    localStorage.setItem("username", username);
}
function getUsername() {
    return localStorage.getItem("username");
}

export {
    clearChatContext as store_deleteAll,
    setUsername as store_setUsername,
    getUsername as store_getUserName,
};
