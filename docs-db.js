/**
 * docs-db.js
 * IndexedDB wrapper for document storage
 */

// Initialize IndexedDB
const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('DocumentsDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('documents')) {
                const store = db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
                store.createIndex('docId', 'docId', { unique: false });
                store.createIndex('userId', 'userId', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
};

// Document storage operations
const DocumentDB = {
    async save(docId, title, data, userId) {
        console.log('DocumentDB.save called with:', { docId, title, data, userId });
        
        const db = await initDB();
        const transaction = db.transaction(['documents'], 'readwrite');
        const store = transaction.objectStore('documents');
        
        const document = {
            docId,
            title,
            data,
            userId,
            timestamp: Date.now()
        };
        
        console.log('Saving document to IndexedDB:', document);
        
        return new Promise((resolve, reject) => {
            const request = store.add(document);
            request.onsuccess = () => {
                console.log('Document saved successfully with ID:', request.result);
                resolve(request.result);
            };
            request.onerror = () => {
                console.error('Error saving document:', request.error);
                reject(request.error);
            };
        });
    },
    
    async getByUser(userId) {
        const db = await initDB();
        const transaction = db.transaction(['documents'], 'readonly');
        const store = transaction.objectStore('documents');
        const index = store.index('userId');
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(userId);
            request.onsuccess = () => {
                const docs = request.result.sort((a, b) => b.timestamp - a.timestamp);
                resolve(docs);
            };
            request.onerror = () => reject(request.error);
        });
    },
    
    async getById(id) {
        const db = await initDB();
        const transaction = db.transaction(['documents'], 'readonly');
        const store = transaction.objectStore('documents');
        
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    async delete(id) {
        const db = await initDB();
        const transaction = db.transaction(['documents'], 'readwrite');
        const store = transaction.objectStore('documents');
        
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
};

// Make available globally
window.DocumentDB = DocumentDB;